// The opening frame of the demo, as data.
//
// freshRound() is what the store writes when the round key is missing and what
// POST /api/reset writes when a take needs retaking. It is the reason no demo
// surface can ever render empty with zero environment variables set.
//
// The seed values are not duplicated here. They are imported from
// lib/data/seed.ts, cloned once per call so a caller that mutates the returned
// object cannot poison the next reset.

import {
  account as seedAccount,
  logs as seedLogs,
  markets as seedMarkets,
  positions as seedPositions,
  signals as seedSignals,
  theses as seedTheses,
} from "../data/seed";
import type { RoundState } from "../types";

function clone<T extends object>(rows: readonly T[]): T[] {
  return rows.map((row) => ({ ...row }));
}

/**
 * A round nobody has touched yet: six theses with the ledgers they earned in
 * round one, four open positions, five signals waiting and the four prior
 * uploadAiLog records. Two rows in there are load bearing. TH-SQZ-LONG is
 * already under the halt line, which is what makes step 4 of DEMO.md work with
 * no setup. TH-VOL-CRUSH sits one closed loss short of it, and POS-4475 is the
 * position that closes the gap, which is step 6.
 */
export function freshRound(): RoundState {
  return {
    account: { ...seedAccount },
    theses: clone(seedTheses),
    positions: clone(seedPositions),
    markets: clone(seedMarkets),
    signals: clone(seedSignals),
    logs: clone(seedLogs),
    decisions: [],
    handledSignalIds: [],
    seenKeys: [],
    countedOrderIds: [],
    // Fixed, not Date.now(): two resets produce byte identical state, and the
    // first idempotency key of a fresh round is therefore reproducible too.
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}
