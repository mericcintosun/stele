// The one seam between the console and where its data comes from. Server only.
//
// Today every read resolves to lib/data/seed. In Phase 2 the real ledger lands
// behind realAdapter() and nothing above this file changes: pages and route
// handlers call getAdapter() and never import the seed directly.
//
// The default is fake on purpose. A Vercel deploy with no environment variables
// at all has to serve a working /console, because that is what the recorded
// demo runs on and what a judge opens cold.

import { account, logs, markets, positions, signals, theses } from "./data/seed";
import type { AiLogRecord, ConsoleSnapshot, Thesis } from "./types";

export interface StelAdapter {
  mode: "fake" | "real";
  snapshot(): Promise<ConsoleSnapshot>;
  theses(): Promise<Thesis[]>;
  logs(): Promise<AiLogRecord[]>;
}

export const fakeAdapter: StelAdapter = {
  mode: "fake",
  async snapshot() {
    return { account, theses, positions, markets, signals, logs };
  },
  async theses() {
    return theses;
  },
  async logs() {
    return logs;
  },
};

/**
 * Phase 2: read the SQLite ledger written by the VPS agent loop.
 *
 * Declared now so the seam is fixed and the call sites never move. It delegates
 * to the seed until that ledger exists, so setting ADAPTER_MODE=real early
 * degrades to seeded data instead of throwing in production.
 */
export const realAdapter: StelAdapter = {
  mode: "real",
  async snapshot() {
    // Phase 2: read the SQLite ledger written by the VPS agent loop.
    return fakeAdapter.snapshot();
  },
  async theses() {
    // Phase 2: read the SQLite ledger written by the VPS agent loop.
    return fakeAdapter.theses();
  },
  async logs() {
    // Phase 2: read the SQLite ledger written by the VPS agent loop, including
    // the uploadAiLog queue table and its unsent depth.
    return fakeAdapter.logs();
  },
};

/** Anything other than the exact string "real" is fake. Unset is fake. */
export function getAdapter(): StelAdapter {
  return process.env.ADAPTER_MODE === "real" ? realAdapter : fakeAdapter;
}
