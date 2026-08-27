// The WEEX store. Server only.
//
// Same LedgerStore interface as the seed store, one real difference:
// syncAttribution() reads closed positions from WEEX and folds their realized
// PnL onto the thesis that opened them, matched by client_oid. That is the
// whole point of the phase. After it runs, the number lib/valve.ts sizes from
// was earned by the agent rather than typed into a seed file.
//
// Everything WEEX cannot answer (market rows, the signal queue, prior log
// records, the account strip) delegates to the seed store, so no panel is ever
// empty and no read path has a second failure mode.
//
// Since Phase 3 both stores read and write the same round snapshot, so an
// attributed ledger persists exactly as far as a decision does.

import { attribute } from "../attribution";
import { CLIENT_OID_PREFIX } from "../config";
import { trace } from "../observability";
import type { ClosedFill } from "../types";
import { closedFills, venueFromEnv } from "../weex";
import { readRound, writeRound } from "./round";
import { seedStore } from "./seed";
import type { AttributionSync, LedgerStore } from "./types";

export const weexStore: LedgerStore = {
  ...seedStore,
  mode: "real",

  async syncAttribution(): Promise<AttributionSync> {
    const state = await readRound();

    let fills: ClosedFill[];
    try {
      fills = await closedFills(venueFromEnv());
    } catch {
      // A read that fails leaves the ledger exactly where it was. The console
      // keeps rendering the last known state instead of an error screen.
      trace("attribution applied", { applied: 0, reason: "fills_unavailable" });
      return { applied: 0, theses: state.theses };
    }

    if (fills.length === 0) return { applied: 0, theses: state.theses };

    const counted = new Set(state.countedOrderIds);
    const result = attribute(state.theses, fills, { prefix: CLIENT_OID_PREFIX, counted });
    for (const fill of fills) counted.add(fill.orderId);

    const next = await writeRound({
      ...state,
      theses: result.theses,
      countedOrderIds: [...counted],
    });

    trace("attribution applied", { applied: result.applied, fills: fills.length });
    return { applied: result.applied, theses: next.theses };
  },

  async snapshot() {
    await weexStore.syncAttribution();
    return seedStore.snapshot();
  },

  async listTheses() {
    await weexStore.syncAttribution();
    return seedStore.listTheses();
  },
};
