// The seed store. Server only.
//
// This is the insurance for the recorded demo and the permanent fallback: with
// zero environment variables the console still renders six theses, three
// positions, three market rows, four signals and four prior log records.
//
// Since Phase 3 it holds none of that state itself. Every method reads the
// round snapshot through lib/store/round.ts and every mutation is one
// readRound() plus one writeRound(), so a decision survives a page reload when
// the KV keys are set and survives everything short of a process restart when
// they are not. syncAttribution() still applies nothing here: there is no
// exchange to read, and the seeded ledger is already the finished number.

import { applyFillToThesis } from "../attribution";
import type { AiLogRecord, Thesis } from "../types";
import { queuedCount, readRound, writeRound } from "./round";
import type { AttributionSync, LedgerStore, WeexResponse } from "./types";

export const seedStore: LedgerStore = {
  mode: "fake",

  async listTheses() {
    return (await readRound()).theses;
  },

  async getThesis(id) {
    return (await readRound()).theses.find((t) => t.id === id) ?? null;
  },

  async spendQuota(thesisId, notionalUsdt) {
    const state = await readRound();
    const current = state.theses.find((t) => t.id === thesisId);
    if (!current) throw new Error(`unknown thesis ${thesisId}`);

    const next: Thesis = {
      ...current,
      quotaUsedUsdt: Math.round((current.quotaUsedUsdt + notionalUsdt) * 10) / 10,
    };
    await writeRound({
      ...state,
      theses: state.theses.map((t) => (t.id === next.id ? next : t)),
    });
    return next;
  },

  async applyRealized(thesisId, realizedUsdt, closedAt) {
    const state = await readRound();
    const current = state.theses.find((t) => t.id === thesisId);
    if (!current) throw new Error(`unknown thesis ${thesisId}`);

    const next = applyFillToThesis(current, realizedUsdt, closedAt);
    await writeRound({
      ...state,
      theses: state.theses.map((t) => (t.id === next.id ? next : t)),
    });
    return next;
  },

  async listPositions() {
    return (await readRound()).positions;
  },

  async listMarkets() {
    return (await readRound()).markets;
  },

  async listSignals() {
    return (await readRound()).signals;
  },

  async getSignal(id) {
    return (await readRound()).signals.find((s) => s.id === id) ?? null;
  },

  async listLogs() {
    return (await readRound()).logs;
  },

  async enqueueLog(record: AiLogRecord) {
    const state = await readRound();
    await writeRound({
      ...state,
      logs: [record, ...state.logs.filter((l) => l.id !== record.id)],
    });
  },

  async markLogSent(id: string, response: WeexResponse) {
    const state = await readRound();
    await writeRound({
      ...state,
      logs: state.logs.map((l) => (l.id === id ? { ...l, queued: false, weexResponse: response } : l)),
    });
  },

  async queueDepth() {
    return queuedCount(await readRound());
  },

  async syncAttribution(): Promise<AttributionSync> {
    // Nothing to read. The seeded ledger is already the finished number.
    return { applied: 0, theses: (await readRound()).theses };
  },

  async account() {
    return (await readRound()).account;
  },

  async snapshot() {
    const state = await readRound();
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
