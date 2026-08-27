// Attribution: the client_oid grammar, and the money path where a closed loss
// pushes a thesis ledger past the halt line.
//
// Run with: npm test   (Node 22.18 or newer)
// See the import note at the top of tests/valve.test.ts.

import test from "node:test";
import assert from "node:assert/strict";
import type { ClosedFill, Thesis } from "../lib/types";

const LIB = "../lib/";
const attribution = (await import(`${LIB}attribution.ts`)) as typeof import("../lib/attribution");
const valve = (await import(`${LIB}valve.ts`)) as typeof import("../lib/valve");

function thesis(over: Partial<Thesis>): Thesis {
  return {
    id: "TH-SQZ-LONG",
    name: "Crowded Short Squeeze",
    precondition: "Written before the round started.",
    symbols: ["cmt_solusdt"],
    trades: 6,
    wins: 3,
    realizedPnlUsdt: -1,
    realizedPnlPct: -1,
    maxDrawdownPct: 1.2,
    quotaUsdt: 150,
    quotaUsedUsdt: 100,
    lastTradedAt: "2026-08-27T00:00:00Z",
    ...over,
  };
}

function fill(over: Partial<ClosedFill>): ClosedFill {
  return {
    clientOid: "stele-TH-SQZ-LONG-SIG-9104-1756412345678",
    orderId: "1103047722",
    symbol: "cmt_solusdt",
    realizedPnlUsdt: -1.5,
    closedAt: "2026-08-28T09:00:00Z",
    ...over,
  };
}

test("parseClientOid reads a well formed oid, hyphenated ids included", () => {
  const parsed = attribution.parseClientOid("stele-TH-SQZ-LONG-SIG-9104-1756412345678");

  assert.deepEqual(parsed, { thesisId: "TH-SQZ-LONG", signalId: "SIG-9104" });
});

test("parseClientOid reads the shadow order marker too", () => {
  const parsed = attribution.parseClientOid("stele-TH-OI-BREAK-SIG-9115-1756412345678-sim");

  assert.deepEqual(parsed, { thesisId: "TH-OI-BREAK", signalId: "SIG-9115" });
});

test("parseClientOid returns null on a malformed oid rather than guessing", () => {
  assert.equal(attribution.parseClientOid("not-an-oid"), null);
  assert.equal(attribution.parseClientOid("stele-TH-SQZ-LONG"), null);
  assert.equal(attribution.parseClientOid("stele-TH-SQZ-LONG-SIG-9104-notatimestamp"), null);
  assert.equal(attribution.parseClientOid(""), null);
  // Right shape, someone else's prefix.
  assert.equal(attribution.parseClientOid("other-TH-SQZ-LONG-SIG-9104-1756412345678"), null);
});

test("buildClientOid and parseClientOid are the same grammar", () => {
  const oid = attribution.buildClientOid("TH-VOL-CRUSH", "SIG-9107", 1756412345678);

  assert.equal(oid, "stele-TH-VOL-CRUSH-SIG-9107-1756412345678");
  assert.deepEqual(attribution.parseClientOid(oid), {
    thesisId: "TH-VOL-CRUSH",
    signalId: "SIG-9107",
  });
});

test("a losing fill pushes the ledger past the halt line and the valve closes the thesis", () => {
  const before = thesis({});
  assert.equal(valve.valveFor(before).state, "throttled");

  const result = attribution.attribute([before], [fill({ realizedPnlUsdt: -1.5 })]);
  const after = result.theses[0];

  assert.equal(result.applied, 1);
  assert.equal(after.trades, 7);
  assert.equal(after.wins, 3);
  assert.equal(after.realizedPnlUsdt, -2.5);
  // -2.50 USDT against 100 USDT deployed.
  assert.equal(after.realizedPnlPct, -2.5);

  const v = valve.valveFor(after);
  assert.equal(v.state, "halted");
  assert.equal(v.multiplier, 0);
  assert.equal(valve.sizeOrder(after, v), 0);
});

test("a fill for an unknown thesis is skipped, never charged to another one", () => {
  const rows = [thesis({})];
  const result = attribution.attribute(rows, [
    fill({ clientOid: "stele-TH-NOT-REAL-SIG-9104-1756412345678", orderId: "999" }),
  ]);

  assert.equal(result.applied, 0);
  assert.deepEqual(result.theses[0], rows[0]);
});

test("the same orderId is only counted once, so the job is safe to run twice", () => {
  const rows = [thesis({})];
  const twice = [fill({}), fill({})];
  const result = attribution.attribute(rows, twice);

  assert.equal(result.applied, 1);
  assert.equal(result.theses[0].trades, 7);

  const rerun = attribution.attribute(result.theses, [fill({})], {
    counted: new Set(["1103047722"]),
  });
  assert.equal(rerun.applied, 0);
  assert.equal(rerun.theses[0].trades, 7);
});

test("a winning fill counts a win and grows the drawdown only from the peak", () => {
  const result = attribution.attribute(
    [thesis({ realizedPnlUsdt: 0, realizedPnlPct: 0, maxDrawdownPct: 0 })],
    [fill({ realizedPnlUsdt: 6, orderId: "1103047999" })],
  );
  const after = result.theses[0];

  assert.equal(after.wins, 4);
  assert.equal(after.realizedPnlUsdt, 6);
  assert.equal(after.realizedPnlPct, 6);
  assert.equal(after.maxDrawdownPct, 0);
  assert.equal(after.lastTradedAt, "2026-08-28T09:00:00Z");
});
