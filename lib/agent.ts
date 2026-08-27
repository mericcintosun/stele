// The model chain. Server only.
//
// Three links, tried in order, all returning the same shape:
//   1. Anthropic SDK when ANTHROPIC_API_KEY is set. This is the submission path
//      and the one the recorded demo must run.
//   2. The developer's local `claude` CLI when it is on PATH. Real agent
//      behavior during development with zero API keys.
//   3. A deterministic stub so the console always renders.
//
// The model does two jobs and only two: confirm which written thesis a signal
// belongs to, and write the 1000 character explanation that goes to WEEX. It
// never sizes the order. Sizing is arithmetic in lib/valve.ts.

import { spawn } from "node:child_process";
import Anthropic from "@anthropic-ai/sdk";
import type { Signal, Thesis } from "./types";
import type { ValveVerdict } from "./valve";

export type AgentSource = "anthropic" | "claude-cli" | "mock";

export interface AgentJudgement {
  source: AgentSource;
  model: string;
  /** Does the signal actually satisfy the written precondition. */
  matches: boolean;
  confidence: number;
  /** Goes straight into the uploadAiLog explanation field. */
  explanation: string;
}

export const SPONSOR_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";

function buildPrompt(signal: Signal, thesis: Thesis, valve: ValveVerdict): string {
  return [
    "You are the decision recorder for a WEEX perpetual futures agent.",
    "Every order must belong to a thesis that was written down before the round started.",
    "You do not choose position size. A deterministic valve does that from the thesis ledger.",
    "",
    `THESIS ${thesis.id} (${thesis.name})`,
    `Precondition: ${thesis.precondition}`,
    `Ledger: ${thesis.trades} closed trades, ${thesis.wins} wins, ${thesis.realizedPnlPct.toFixed(2)}% realized on deployed capital, ${thesis.maxDrawdownPct.toFixed(1)}% max drawdown.`,
    `Quota: ${thesis.quotaUsedUsdt.toFixed(1)} of ${thesis.quotaUsdt.toFixed(0)} USDT used.`,
    "",
    `SIGNAL ${signal.id} on ${signal.symbol}`,
    signal.headline,
    `Funding ${signal.fundingRatePct.toFixed(4)}%, open interest ${signal.oiChange1hPct.toFixed(1)}% over one hour, proposed side ${signal.suggestedSide}.`,
    "",
    `VALVE (already decided, do not argue with it): ${valve.state}, multiplier ${valve.multiplier.toFixed(2)}x. ${valve.reason}`,
    "",
    "Answer with: whether the signal satisfies the written precondition, a confidence between 0 and 1,",
    "and an explanation under 900 characters that names the thesis, states what the ledger says, and",
    "states what the valve did about it. Write plainly. No marketing language.",
  ].join("\n");
}

/** Path 1: the sponsor SDK. */
async function viaAnthropic(prompt: string): Promise<AgentJudgement | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });

    // Structured output through a forced tool call: the model must return the
    // three fields or nothing. The surface is pinned to a local shape so an SDK
    // minor bump cannot break the build; the runtime call is the normal one.
    const messages = client.messages as unknown as {
      create: (p: Record<string, unknown>) => Promise<{
        content: Array<{ type: string; input?: unknown }>;
      }>;
    };

    const res = await messages.create({
      model: SPONSOR_MODEL,
      max_tokens: 900,
      system:
        "You record trading decisions for a compliance log. Be precise and terse. Never invent numbers that were not given to you.",
      messages: [{ role: "user", content: prompt }],
      tools: [
        {
          name: "record_decision",
          description: "Record whether the signal satisfies the written thesis precondition.",
          input_schema: {
            type: "object",
            properties: {
              matches: { type: "boolean" },
              confidence: { type: "number" },
              explanation: { type: "string" },
            },
            required: ["matches", "confidence", "explanation"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "record_decision" },
    });

    const call = res.content.find((b) => b.type === "tool_use");
    const input = (call?.input ?? {}) as Partial<AgentJudgement>;

    if (typeof input.explanation !== "string") return null;
    return {
      source: "anthropic",
      model: SPONSOR_MODEL,
      matches: input.matches !== false,
      confidence: typeof input.confidence === "number" ? input.confidence : 0.7,
      explanation: input.explanation.slice(0, 1000),
    };
  } catch {
    return null;
  }
}

/** Path 2: the local CLI, so a developer with no keys still sees a real model answer. */
let cliAvailable: boolean | null = null;

async function hasClaudeCli(): Promise<boolean> {
  if (cliAvailable !== null) return cliAvailable;
  cliAvailable = await run("claude", ["--version"], "", 4000)
    .then(() => true)
    .catch(() => false);
  return cliAvailable;
}

async function viaClaudeCli(prompt: string): Promise<AgentJudgement | null> {
  if (!(await hasClaudeCli())) return null;
  try {
    const text = await run(
      "claude",
      ["-p", "--output-format", "text", "--model", "haiku"],
      `${prompt}\n\nReply with one paragraph under 900 characters. No preamble.`,
      45_000,
    );
    const explanation = text.trim().slice(0, 1000);
    if (!explanation) return null;
    return {
      source: "claude-cli",
      model: "claude-haiku (local CLI)",
      matches: true,
      confidence: 0.66,
      explanation,
    };
  } catch {
    return null;
  }
}

/** Path 3: deterministic, offline, always answers. */
function viaMock(signal: Signal, thesis: Thesis, valve: ValveVerdict): AgentJudgement {
  const verdict =
    valve.multiplier === 0
      ? "The order is refused and this refusal is the log entry."
      : valve.multiplier < 1
        ? "The order goes out at reduced size."
        : "The order goes out at full size.";

  const explanation = [
    `Signal ${signal.id} on ${signal.symbol} is matched to ${thesis.id} (${thesis.name}).`,
    `Precondition on file: ${thesis.precondition}`,
    `Ledger: ${thesis.trades} closed trades, ${thesis.realizedPnlPct.toFixed(2)}% realized,`,
    `${thesis.maxDrawdownPct.toFixed(1)}% max drawdown, ${thesis.quotaUsedUsdt.toFixed(1)} of`,
    `${thesis.quotaUsdt.toFixed(0)} USDT quota spent.`,
    `Valve: ${valve.reason}`,
    verdict,
  ].join(" ");

  return {
    source: "mock",
    model: "stele-offline-stub",
    matches: true,
    confidence: 0.62,
    explanation: explanation.slice(0, 1000),
  };
}

export async function judge(
  signal: Signal,
  thesis: Thesis,
  valve: ValveVerdict,
): Promise<AgentJudgement> {
  const prompt = buildPrompt(signal, thesis, valve);
  return (await viaAnthropic(prompt)) ?? (await viaClaudeCli(prompt)) ?? viaMock(signal, thesis, valve);
}

function run(cmd: string, args: string[], stdin: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let done = false;

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      child.kill("SIGKILL");
      reject(new Error("timeout"));
    }, timeoutMs);

    child.stdout.on("data", (c: Buffer) => {
      out += c.toString();
    });
    child.on("error", (err) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(`exit ${code}`));
    });

    if (stdin) child.stdin.write(stdin);
    child.stdin.end();
  });
}
