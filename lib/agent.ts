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
//
// No prompt text lives in this file. It is all in prompts/decision-record.ts,
// so changing what the model is asked never means touching the code that calls
// it. Answers are validated with JudgementSchema and cached by a hash of the
// prompt, which is what makes two runs of the demo render the same words.

import { spawn } from "node:child_process";
import Anthropic from "@anthropic-ai/sdk";
import fixture from "../fixtures/judgement.json";
import {
  buildCliSuffix,
  buildPrompt,
  SYSTEM_PROMPT,
  TOOL_DESCRIPTION,
  TOOL_NAME,
} from "@/prompts/decision-record";
import { cacheGet, cacheSet, hashInput } from "./cache";
import { ANTHROPIC_MODEL, MODEL_TIMEOUT_MS, REQUEST_TIMEOUT_MS, RETRY_COUNT } from "./config";
import { trace } from "./observability";
import { JudgementSchema } from "./schemas";
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

export const SPONSOR_MODEL = ANTHROPIC_MODEL;

/**
 * The floor under the sponsor path: a realistic record for the SIG-9104 /
 * TH-SQZ-LONG input, shipped in the repo. It is used only when the model
 * answered but the answer did not parse, so a malformed response degrades to a
 * valid record instead of to an exception on the core path.
 */
function fromFixture(): AgentJudgement | null {
  const parsed = JudgementSchema.safeParse(fixture);
  if (!parsed.success) return null;
  return {
    source: "mock",
    model: `${ANTHROPIC_MODEL} (fixture fallback)`,
    matches: parsed.data.matches,
    confidence: parsed.data.confidence,
    explanation: parsed.data.explanation,
  };
}

/** Models sometimes wrap JSON in a fence or trail a sentence after it. */
function cleanJson(text: string): unknown {
  const withoutFence = text.replace(/```(?:json)?/gi, "").trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(withoutFence.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** Path 1: the sponsor SDK. */
async function viaAnthropic(prompt: string): Promise<AgentJudgement | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  let candidate: unknown;

  try {
    const client = new Anthropic({ apiKey });

    // Structured output through a forced tool call: the model must return the
    // three fields or nothing. The surface is pinned to a local shape so an SDK
    // minor bump cannot break the build; the runtime call is the normal one.
    const messages = client.messages as unknown as {
      create: (
        p: Record<string, unknown>,
        o?: Record<string, unknown>,
      ) => Promise<{ content: Array<{ type: string; input?: unknown; text?: string }> }>;
    };

    const res = await messages.create(
      {
        model: ANTHROPIC_MODEL,
        max_tokens: 900,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
        tools: [
          {
            name: TOOL_NAME,
            description: TOOL_DESCRIPTION,
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
        tool_choice: { type: "tool", name: TOOL_NAME },
      },
      // The one outbound deadline for this call site, and exactly one retry.
      { timeout: MODEL_TIMEOUT_MS, maxRetries: RETRY_COUNT },
    );

    const call = res.content.find((b) => b.type === "tool_use");
    candidate = call?.input ?? cleanJson(res.content.map((b) => b.text ?? "").join(""));
  } catch {
    // The API itself failed. Fall through to the next link in the chain.
    return null;
  }

  const parsed = JudgementSchema.safeParse(candidate);
  if (parsed.success) {
    return {
      source: "anthropic",
      model: ANTHROPIC_MODEL,
      matches: parsed.data.matches,
      confidence: parsed.data.confidence,
      explanation: parsed.data.explanation.slice(0, 1000),
    };
  }

  trace("model answered", { source: "anthropic", parse: "failed", fallback: "fixture" });
  return fromFixture();
}

/** Path 2: the local CLI, so a developer with no keys still sees a real model answer. */
let cliAvailable: boolean | null = null;

async function hasClaudeCli(): Promise<boolean> {
  if (cliAvailable !== null) return cliAvailable;
  cliAvailable = await run("claude", ["--version"], "", REQUEST_TIMEOUT_MS)
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
      `${prompt}${buildCliSuffix()}`,
      MODEL_TIMEOUT_MS,
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
  const key = hashInput(prompt);

  const cached = cacheGet<AgentJudgement>(key);
  if (cached) return cached;

  const answer =
    (await viaAnthropic(prompt)) ?? (await viaClaudeCli(prompt)) ?? viaMock(signal, thesis, valve);

  return cacheSet(key, answer);
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
