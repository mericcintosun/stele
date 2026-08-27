// The capital valve, over five fixed theses.
//
// Run with: npm test   (Node 22.18 or newer, which strips types natively)
//
// Import note: Node needs the real .ts extension to load a sibling module, and
// tsconfig.json is on the never-touch list with allowImportingTsExtensions off.
// So the specifier is built at runtime and the module type is put back on with
// a cast. Nothing here pulls in next/server or the Anthropic SDK.

import test from "node:test";
import assert from "node:assert/strict";
import type { Thesis } from "../lib/types";

const LIB = "../lib/";
const valve = (await import(`${LIB}valve.ts`)) as typeof import("../lib/valve");

function thesis(over: Partial<Thesis>): Thesis {
  return {
    id: "TH-TEST",
    name: "Test thesis",
    precondition: "Written before the round started.",
    symbols: ["cmt_solusdt"],
    trades: 10,
    wins: 6,
    realizedPnlUsdt: 0,
    realizedPnlPct: 0,
    maxDrawdownPct: 1,
    quotaUsdt: 150,
    quotaUsedUsdt: 50,
    lastTradedAt: "2026-08-28T00:00:00Z",
    ...over,
  };
}

test("halt line: a ledger at or past -2.0% is cut to zero capital", () => {
  const t = thesis({ id: "TH-SQZ-LONG", trades: 7, wins: 3, realizedPnlPct: -2.14 });
  const v = valve.valveFor(t);

  assert.equal(v.state, "halted");
  assert.equal(v.multiplier, 0);
  assert.equal(valve.sizeOrder(t, v), 0);
  assert.equal(valve.verdictFor(v), "rejected");
});

test("halt line: exactly -2.0% halts, it is not a strict inequality", () => {
  const v = valve.valveFor(thesis({ realizedPnlPct: -2.0 }));

  assert.equal(v.state, "halted");
  assert.equal(v.multiplier, 0);
});

test("throttle line: under water but above the halt line halves the size", () => {
  const t = thesis({ trades: 9, realizedPnlPct: -0.71, maxDrawdownPct: 3.3, quotaUsedUsdt: 44 });
  const v = valve.valveFor(t);

  assert.equal(v.state, "throttled");
  assert.equal(v.multiplier, 0.5);
  assert.equal(valve.verdictFor(v), "reduced");
});

test("throttle line: a 5% max drawdown halves the size even on a positive ledger", () => {
  const v = valve.valveFor(thesis({ realizedPnlPct: 1.2, maxDrawdownPct: 5.8 }));

  assert.equal(v.state, "throttled");
  assert.equal(v.multiplier, 0.5);
});

test("warmup: under six closed trades the cold start multiplier holds", () => {
  const t = thesis({ trades: 3, wins: 2, realizedPnlPct: 0.4, maxDrawdownPct: 1, quotaUsedUsdt: 30 });
  const v = valve.valveFor(t);

  assert.equal(v.state, "active");
  assert.equal(v.multiplier, valve.VALVE.warmupMultiplier);
  // 240 base at 0.5x is 120, and 120 USDT of quota is still free.
  assert.equal(valve.sizeOrder(t, v), 120);
});

test("a warm, winning ledger sizes up, and quota still caps the order", () => {
  const t = thesis({ trades: 11, wins: 7, realizedPnlPct: 3.21, maxDrawdownPct: 2.4, quotaUsedUsdt: 92.5 });
  const v = valve.valveFor(t);

  assert.equal(v.state, "active");
  assert.equal(v.multiplier, 1.25);
  // 240 at 1.25x wants 300, but only 57.5 USDT of quota is left.
  assert.equal(valve.sizeOrder(t, v), 57.5);
});
