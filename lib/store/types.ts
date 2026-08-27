// The store contract. Server only.
//
// Everything the console and the routes need from persistence is on this
// interface, and there are exactly two implementations: the seed store, which
// is the permanent fallback and what the recorded demo runs on, and the WEEX
// store, which reads closed fills from the exchange and attributes them.
//
// Types come from lib/types.ts. Nothing is redefined here.

import type {
  AiLogRecord,
  ConsoleSnapshot,
  MarketRow,
  Position,
  Signal,
  Thesis,
} from "../types";

export type WeexResponse = AiLogRecord["weexResponse"];

export interface AttributionSync {
  applied: number;
  theses: Thesis[];
}

export interface LedgerStore {
  /** Which implementation answered. The console header prints it. */
  readonly mode: "fake" | "real";

  listTheses(): Promise<Thesis[]>;
  getThesis(id: string): Promise<Thesis | null>;
  /** Charge an accepted order against the thesis quota. Returns the updated row. */
  spendQuota(thesisId: string, notionalUsdt: number): Promise<Thesis>;
  /** Write one closed trade onto the ledger. Returns the updated row. */
  applyRealized(thesisId: string, realizedUsdt: number, closedAt: string): Promise<Thesis>;

  listPositions(): Promise<Position[]>;
  listMarkets(): Promise<MarketRow[]>;
  listSignals(): Promise<Signal[]>;
  getSignal(id: string): Promise<Signal | null>;
  listLogs(): Promise<AiLogRecord[]>;

  /** Write the record before the POST is attempted. Nothing is lost on a reject. */
  enqueueLog(record: AiLogRecord): Promise<void>;
  /** Mark a queued record accepted by the exchange. */
  markLogSent(id: string, response: WeexResponse): Promise<void>;
  /** How many records are still waiting on the uploadAiLog allowlist. */
  queueDepth(): Promise<number>;

  /** Pull closed fills and fold them onto the ledger. Safe to run twice. */
  syncAttribution(): Promise<AttributionSync>;

  account(): Promise<ConsoleSnapshot["account"]>;
  /** One read of the whole console state, after attribution has run. */
  snapshot(): Promise<ConsoleSnapshot>;
}
