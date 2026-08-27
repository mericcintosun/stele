// Seed data for the Stele decision console.
//
// Everything here is a plausible snapshot of an agent that has already traded
// one weekly round on WEEX perpetuals: six named theses, their closed-trade
// ledgers, three open positions carrying exchange-side TP/SL, the market rows
// the agent watches, four pending signals, and the uploadAiLog records the
// agent has already written to the exchange.
//
// The values live in seed.json so scripts/seed.mjs can validate them without a
// TypeScript step. This file only puts the types back on. In Phase 2 the real
// ledger reads through lib/adapter.ts and satisfies the same types, so nothing
// downstream of the adapter changes.

import raw from "./seed.json";
import type { AiLogRecord, ConsoleSnapshot, MarketRow, Position, Signal, Thesis } from "../types";

// JSON widens every string literal to `string`, so the union members in Thesis,
// Position, Signal and AiLogRecord have to be re-asserted here. The one place
// in the repo where a cast is the right answer.
export const account = raw.account as ConsoleSnapshot["account"];
export const theses = raw.theses as unknown as Thesis[];
export const positions = raw.positions as unknown as Position[];
export const markets = raw.markets as unknown as MarketRow[];
export const signals = raw.signals as unknown as Signal[];
export const logs = raw.logs as unknown as AiLogRecord[];

export function thesisById(id: string): Thesis | undefined {
  return theses.find((t) => t.id === id);
}

export function signalById(id: string): Signal | undefined {
  return signals.find((s) => s.id === id);
}

export function marketFor(symbol: string): MarketRow | undefined {
  return markets.find((m) => m.symbol === symbol);
}
