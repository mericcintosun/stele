// The seed store. Server only.
//
// This is the insurance for the recorded demo and the permanent fallback: with
// zero environment variables the console still renders six theses, three
// positions, three market rows, four signals and four prior log records.
//
// State lives at module scope, not on disk. This app deploys to Vercel where a
// request time filesystem write is not available, so a decision moves the
// ledger for as long as that server instance stays warm and the seed values are
// what a cold instance starts from. That is enough for the demo and it is why
// syncAttribution() here applies nothing: there is no exchange to read.

import { applyFillToThesis } from "../attribution";
import {
  account as seedAccount,
  logs as seedLogs,
  markets as seedMarkets,
  positions as seedPositions,
  signals as seedSignals,
  theses as seedTheses,
} from "../data/seed";
import type { AiLogRecord, ConsoleSnapshot, MarketRow, Position, Signal, Thesis } from "../types";
import type { AttributionSync, LedgerStore, WeexResponse } from "./types";

function clone<T extends object>(rows: readonly T[]): T[] {
  return rows.map((row) => ({ ...row }));
}

interface LedgerState {
  account: ConsoleSnapshot["account"];
  theses: Thesis[];
  positions: Position[];
  markets: MarketRow[];
  signals: Signal[];
  logs: AiLogRecord[];
  /** orderIds already written to the ledger, so attribution is idempotent. */
  countedOrderIds: Set<string>;
}

const state: LedgerState = {
  account: { ...seedAccount },
  theses: clone(seedTheses),
  positions: clone(seedPositions),
  markets: clone(seedMarkets),
  signals: clone(seedSignals),
  logs: clone(seedLogs),
  countedOrderIds: new Set<string>(),
};

/**
 * Shared state, not a second copy. The WEEX store attributes real fills onto
 * these same rows and delegates every read it cannot answer back here, so no
 * method ever returns an empty list and blanks a panel.
 */
export function ledgerState(): LedgerState {
  return state;
}

function requireThesis(id: string): Thesis {
  const found = state.theses.find((t) => t.id === id);
  if (!found) throw new Error(`unknown thesis ${id}`);
  return found;
}

function replaceThesis(next: Thesis): Thesis {
  state.theses = state.theses.map((t) => (t.id === next.id ? next : t));
  return next;
}

export const seedStore: LedgerStore = {
  mode: "fake",

  async listTheses() {
    return state.theses;
  },

  async getThesis(id) {
    return state.theses.find((t) => t.id === id) ?? null;
  },

  async spendQuota(thesisId, notionalUsdt) {
    const current = requireThesis(thesisId);
    return replaceThesis({
      ...current,
      quotaUsedUsdt: Math.round((current.quotaUsedUsdt + notionalUsdt) * 10) / 10,
    });
  },

  async applyRealized(thesisId, realizedUsdt, closedAt) {
    const current = requireThesis(thesisId);
    return replaceThesis(applyFillToThesis(current, realizedUsdt, closedAt));
  },

  async listPositions() {
    return state.positions;
  },

  async listMarkets() {
    return state.markets;
  },

  async listSignals() {
    return state.signals;
  },

  async getSignal(id) {
    return state.signals.find((s) => s.id === id) ?? null;
  },

  async listLogs() {
    return state.logs;
  },

  async enqueueLog(record) {
    state.logs = [record, ...state.logs.filter((l) => l.id !== record.id)];
  },

  async markLogSent(id: string, response: WeexResponse) {
    state.logs = state.logs.map((l) =>
      l.id === id ? { ...l, queued: false, weexResponse: response } : l,
    );
  },

  async queueDepth() {
    return state.logs.filter((l) => l.queued).length;
  },

  async syncAttribution(): Promise<AttributionSync> {
    // Nothing to read. The seeded ledger is already the finished number.
    return { applied: 0, theses: state.theses };
  },

  async account() {
    return state.account;
  },

  async snapshot() {
    return {
      account: state.account,
      theses: state.theses,
      positions: state.positions,
      markets: state.markets,
      signals: state.signals,
      logs: state.logs,
    };
  },
};
