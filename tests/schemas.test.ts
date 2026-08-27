// The edge schemas. Everything a browser, a model or WEEX sends is parsed here
// before any other logic runs, so these are the cases that must stay rejected.
//
// Run with: npm test   (Node 22.18 or newer)
// See the import note at the top of tests/valve.test.ts.

import test from "node:test";
import assert from "node:assert/strict";

const LIB = "../lib/";
const schemas = (await import(`${LIB}schemas.ts`)) as typeof import("../lib/schemas");

test("DecideRequestSchema accepts a real signal id", () => {
  const parsed = schemas.DecideRequestSchema.safeParse({ signalId: "SIG-9104" });

  assert.equal(parsed.success, true);
});

test("DecideRequestSchema rejects five malformed bodies", () => {
  const malformed: unknown[] = [
    {},
    { signalId: "" },
    { signalId: 9104 },
    null,
    [{ signalId: "SIG-9104" }],
  ];

  for (const body of malformed) {
    assert.equal(schemas.DecideRequestSchema.safeParse(body).success, false);
  }
});

test("JudgementSchema accepts a well formed model answer", () => {
  const parsed = schemas.JudgementSchema.safeParse({
    matches: true,
    confidence: 0.71,
    explanation: "TH-SQZ-LONG is past the halt line, so the order is refused.",
  });

  assert.equal(parsed.success, true);
});

test("JudgementSchema rejects five malformed model answers", () => {
  const malformed: unknown[] = [
    {},
    { matches: "yes", confidence: 0.5, explanation: "ok" },
    { matches: true, confidence: 1.4, explanation: "confidence is out of range" },
    { matches: true, confidence: 0.5, explanation: "x".repeat(1001) },
    { matches: true, confidence: 0.5 },
  ];

  for (const answer of malformed) {
    assert.equal(schemas.JudgementSchema.safeParse(answer).success, false);
  }
});

test("JudgementSchema holds the explanation to the WEEX 1000 character cap", () => {
  const atCap = schemas.JudgementSchema.safeParse({
    matches: true,
    confidence: 0.5,
    explanation: "x".repeat(1000),
  });

  assert.equal(atCap.success, true);
});

test("FillSchema rejects a row that is missing the link back to a thesis", () => {
  const good = schemas.FillSchema.safeParse({
    clientOid: "stele-TH-SQZ-LONG-SIG-9104-1756412345678",
    orderId: "1103047722",
    symbol: "cmt_solusdt",
    realizedPnlUsdt: -4,
    closedAt: "2026-08-28T09:00:00Z",
  });
  assert.equal(good.success, true);

  const malformed: unknown[] = [
    { orderId: "1", symbol: "cmt_solusdt", realizedPnlUsdt: -4, closedAt: "now" },
    { clientOid: "", orderId: "1", symbol: "cmt_solusdt", realizedPnlUsdt: -4, closedAt: "now" },
    {
      clientOid: "stele-TH-SQZ-LONG-SIG-9104-1",
      orderId: "1",
      symbol: "cmt_solusdt",
      realizedPnlUsdt: Number.NaN,
      closedAt: "now",
    },
  ];

  for (const row of malformed) {
    assert.equal(schemas.FillSchema.safeParse(row).success, false);
  }
});

test("WeexEnvelopeSchema accepts a null data envelope", () => {
  const parsed = schemas.WeexEnvelopeSchema.safeParse({
    code: "00000",
    msg: "success",
    requestTime: 1787168531411,
    data: null,
  });

  assert.equal(parsed.success, true);
});
