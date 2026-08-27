// The round snapshot, and the only module in Stele that talks to a persistence
// driver. Server only.
//
// Decision table row: ONE SMALL MUTABLE STATE. The demo never filters, joins or
// aggregates. It reads one round, rewrites one round, and the largest thing in
// it is six thesis rows. So the store is a single JSON blob under a single key.
//
//   Postgres was rejected: a schema, a migration step and a connection pool for
//   a document that is read whole and written whole is more machinery than the
//   demo has work for, and a migration is one more thing that can be un-run
//   before a recording.
//   "No store at all" was rejected: step 5 of DEMO.md is a hard refresh that
//   has to still show the refusal, and React state does not survive that.
//
// Two drivers, chosen by whether the two env vars are set:
//   kv     Upstash compatible Redis REST over plain fetch. No dependency.
//   memory A module scope singleton. Same behavior inside one process, lost on
//          a restart or a cold serverless instance.
//
// Every KV failure degrades to memory rather than throwing. A judge opening the
// deployed URL with a misconfigured token gets a working console, not a 500.

import {
  KV_REST_API_TOKEN,
  KV_REST_API_URL,
  ROUND_KEY,
  STORE_TIMEOUT_MS,
  storeMode,
} from "../config";
import { trace } from "../observability";
import type { RoundState, RoundView } from "../types";
import { freshRound } from "./fresh";

export type { RoundState, RoundView } from "../types";
export { freshRound } from "./fresh";

/**
 * The memory fallback. Not a comment, not a TODO: this branch is what runs on a
 * checkout with no environment variables, which is every local `npm run dev`
 * and the Vercel deploy until the two KV keys are filled in.
 */
let memory: RoundState | null = null;

/** Set once the KV driver has failed, so one bad key does not cost every request. */
let kvDisabled = false;

function kvReady(): boolean {
  return storeMode() === "kv" && !kvDisabled;
}

async function kvFetch(path: string, body?: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), STORE_TIMEOUT_MS);
  try {
    const res = await fetch(`${KV_REST_API_URL.replace(/\/$/, "")}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
      body,
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`store responded ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Upstash answers every command as { result: ... }. */
function resultOf(payload: unknown): unknown {
  if (typeof payload === "object" && payload !== null && "result" in payload) {
    return (payload as { result: unknown }).result;
  }
  return null;
}

/**
 * A round read back off the wire is unknown JSON, so it is checked field by
 * field before it is trusted. A blob written by an older build, or a truncated
 * one, is treated as missing and reseeded rather than rendered half empty.
 */
function isRoundState(value: unknown): value is RoundState {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  const lists = [
    "theses",
    "positions",
    "markets",
    "signals",
    "logs",
    "decisions",
    "handledSignalIds",
    "seenKeys",
    "countedOrderIds",
  ];
  if (!lists.every((key) => Array.isArray(r[key]))) return false;
  if (typeof r.updatedAt !== "string") return false;
  return typeof r.account === "object" && r.account !== null;
}

async function loadFromKv(): Promise<RoundState | null> {
  try {
    const raw = resultOf(await kvFetch(`/get/${encodeURIComponent(ROUND_KEY)}`));
    if (typeof raw !== "string" || raw === "") return null;
    const parsed: unknown = JSON.parse(raw);
    return isRoundState(parsed) ? parsed : null;
  } catch {
    kvDisabled = true;
    trace("store: falling back to memory", { reason: "kv_read_failed" });
    return null;
  }
}

async function saveToKv(next: RoundState): Promise<boolean> {
  try {
    await kvFetch(`/set/${encodeURIComponent(ROUND_KEY)}`, JSON.stringify(next));
    return true;
  } catch {
    kvDisabled = true;
    trace("store: falling back to memory", { reason: "kv_write_failed" });
    return false;
  }
}

/**
 * The round, seeded on first read.
 *
 * No caller can ever get null, so no route and no page has an empty branch to
 * render. That is the whole reason this returns RoundState rather than
 * RoundState | null.
 */
export async function readRound(): Promise<RoundState> {
  if (kvReady()) {
    const stored = await loadFromKv();
    if (stored) return stored;
    if (kvReady()) {
      // Key missing on a healthy store: seed it so the next read is a plain hit.
      const seeded = freshRound();
      await saveToKv(seeded);
      memory = seeded;
      trace("round seeded", { driver: "kv" });
      return seeded;
    }
  }

  if (memory) return memory;

  const seeded = freshRound();
  memory = seeded;
  trace("round seeded", { driver: "memory" });
  return seeded;
}

/** Replace the round. The caller hands in the whole next state, stamped here. */
export async function writeRound(next: RoundState): Promise<RoundState> {
  const stamped: RoundState = { ...next, updatedAt: new Date().toISOString() };
  memory = stamped;
  if (kvReady()) await saveToKv(stamped);
  return stamped;
}

/** Back to the opening frame of DEMO.md. This is what npm run demo:reset calls. */
export async function resetRound(): Promise<RoundState> {
  const seeded = freshRound();
  memory = seeded;
  if (kvReady()) await saveToKv(seeded);
  trace("round reset", { driver: storeMode(), theses: seeded.theses.length });
  return seeded;
}

/** Records the exchange has not accepted yet. */
export function queuedCount(state: RoundState): number {
  return state.logs.filter((l) => l.queued).length;
}

/** The round as the browser reads it. Drops the idempotency bookkeeping. */
export function viewOf(state: RoundState): RoundView {
  return {
    account: state.account,
    theses: state.theses,
    positions: state.positions,
    markets: state.markets,
    signals: state.signals,
    logs: state.logs,
    decisions: state.decisions.map((d) => d.decision),
    handledSignalIds: state.handledSignalIds,
    queueDepth: queuedCount(state),
    updatedAt: state.updatedAt,
  };
}
