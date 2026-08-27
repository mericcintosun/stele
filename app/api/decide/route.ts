// POST /api/decide
//
// The whole control loop in one request:
//   signal -> written thesis -> valve reads that thesis's ledger -> model writes
//   the explanation -> the log record is queued -> uploadAiLog receipt -> sim
//   shadow fill -> live fill.
//
// A rejection travels the exact same path as an order. That is the point: the
// exchange gets a receipt for the agent saying no, and that receipt is what
// makes the ledger auditable evidence of AI participation.
//
// The log record is written to the store queue BEFORE the POST is attempted. An
// un-allowlisted UID is the normal case today, and a record that never left the
// process is a hole in the evidence trail.

import { NextResponse } from "next/server";
import { judge } from "@/lib/agent";
import { buildClientOid } from "@/lib/attribution";
import { CLIENT_OID_PREFIX } from "@/lib/config";
import { fail, STATUS_FOR } from "@/lib/errors";
import { trace } from "@/lib/observability";
import { DecideRequestSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";
import type { AiLogRecord, ApiResponse, Decision, Thesis } from "@/lib/types";
import { bracketFor, sizeOrder, valveFor, verdictFor } from "@/lib/valve";
import {
  hasCredentials,
  lastPrice,
  placeOrder,
  uploadAiLog,
  venueFromEnv,
  type Venue,
} from "@/lib/weex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Which path actually ran. The console header prints it so a judge can see.
// Not exported: Next 15 rejects unexpected exports from a route module.
interface Wiring {
  weexCredentials: boolean;
  venue: Venue;
  modelPath: Decision["source"];
  store: "fake" | "real";
}

interface DecidePayload {
  decision: Decision;
  wiring: Wiring;
  /** The ledger after this decision, so the console renders server truth. */
  theses: Thesis[];
  queueDepth: number;
}

export async function POST(req: Request) {
  const raw: unknown = await req.json().catch(() => null);
  const parsed = DecideRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const body: ApiResponse<never> = {
      ok: false,
      ...fail("invalid_input", "post a JSON body shaped { signalId: string }"),
    };
    return NextResponse.json(body, { status: STATUS_FOR.invalid_input });
  }

  const store = getStore();
  const signal = await store.getSignal(parsed.data.signalId);
  if (!signal) {
    const body: ApiResponse<never> = {
      ok: false,
      ...fail("invalid_input", `no signal ${parsed.data.signalId} in the queue`),
    };
    return NextResponse.json(body, { status: STATUS_FOR.invalid_input });
  }

  const thesis = await store.getThesis(signal.thesisId);
  if (!thesis) {
    const body: ApiResponse<never> = {
      ok: false,
      ...fail("unknown_thesis", `signal ${signal.id} is not bound to a written thesis`),
    };
    return NextResponse.json(body, { status: STATUS_FOR.unknown_thesis });
  }

  const valve = valveFor(thesis);
  const verdict = verdictFor(valve);
  const notionalUsdt = sizeOrder(thesis, valve);
  trace("valve decided", {
    thesis: thesis.id,
    state: valve.state,
    multiplier: valve.multiplier,
    notional: notionalUsdt,
  });

  const markets = await store.listMarkets();
  const reference = markets.find((m) => m.symbol === signal.symbol)?.lastPrice ?? 0;
  const liveVenue = venueFromEnv();
  const entryPrice = await lastPrice(signal.symbol, reference, liveVenue);
  const bracket = bracketFor(entryPrice, signal.suggestedSide);

  const judgement = await judge(signal, thesis, valve);
  trace("model answered", {
    source: judgement.source,
    confidence: judgement.confidence,
    explanation_chars: judgement.explanation.length,
  });

  const stage = verdict === "rejected" ? "rejection" : "order";
  const now = new Date().toISOString();
  // stele-<thesisId>-<signalId>-<timestamp>. This is the only thread back from a
  // closed fill to the reason that opened it, so lib/attribution.ts can pay the
  // realized PnL to the right ledger.
  const clientOid = buildClientOid(thesis.id, signal.id, Date.now(), CLIENT_OID_PREFIX);

  // Shadow first, then live. Same decision, two venues, so the demo can put the
  // sim fill and the real fill side by side.
  let shadowFill: Decision["shadowFill"] = null;
  let liveFill: Decision["liveFill"] = null;

  if (verdict !== "rejected") {
    const shadow = await placeOrder(
      {
        symbol: signal.symbol,
        side: signal.suggestedSide,
        notionalUsdt,
        price: entryPrice,
        takeProfit: bracket.takeProfit,
        stopLoss: bracket.stopLoss,
        leverage: 5,
        clientOid: `${clientOid}-sim`,
      },
      "sim",
    );
    shadowFill = {
      venue: "sim",
      price: shadow.price,
      orderId: shadow.orderId,
      filledAt: shadow.filledAt,
    };
    trace("shadow fill", { thesis: thesis.id, orderId: shadow.orderId, ok: String(shadow.ok) });

    if (shadow.ok) {
      const live = await placeOrder(
        {
          symbol: signal.symbol,
          side: signal.suggestedSide,
          notionalUsdt,
          price: entryPrice,
          takeProfit: bracket.takeProfit,
          stopLoss: bracket.stopLoss,
          leverage: 5,
          clientOid,
        },
        liveVenue,
      );
      liveFill = {
        venue: liveVenue,
        price: live.price,
        orderId: live.orderId,
        filledAt: live.filledAt,
      };
      trace("live fill", { thesis: thesis.id, venue: liveVenue, orderId: live.orderId });
    }
  }

  // The ledger is the memory. An accepted order spends quota now; realized PnL
  // lands later, when the position closes and attribution pays it back.
  if (notionalUsdt > 0 && liveFill) {
    await store.spendQuota(thesis.id, notionalUsdt);
  }

  const output = JSON.stringify({
    thesis: thesis.id,
    verdict,
    multiplier: valve.multiplier,
    notional_usdt: notionalUsdt,
    side: signal.suggestedSide,
    tp: bracket.takeProfit,
    sl: bracket.stopLoss,
  });

  const input = `${signal.symbol} funding ${signal.fundingRatePct.toFixed(4)}%, OI ${signal.oiChange1hPct.toFixed(1)}% / 1h. ${signal.headline}`;

  const record: AiLogRecord = {
    id: `LOG-${signal.id.replace("SIG-", "")}-${Date.now().toString().slice(-6)}`,
    stage,
    model: judgement.model,
    thesisId: thesis.id,
    input,
    output,
    explanation: judgement.explanation.slice(0, 1000),
    orderId: liveFill?.orderId ?? null,
    postedAt: now,
    weexResponse: null,
    queued: true,
  };

  // Durable first, posted second.
  await store.enqueueLog(record);
  trace("log queued", { id: record.id, stage, thesis: thesis.id });

  const receipt = await uploadAiLog(
    {
      stage,
      model: judgement.model,
      input,
      output,
      explanation: judgement.explanation,
      orderId: liveFill?.orderId ?? null,
    },
    liveVenue,
  );

  if (receipt.accepted) {
    await store.markLogSent(record.id, receipt.response);
    trace("log accepted", { id: record.id, code: receipt.response?.code ?? "00000" });
  }

  const aiLog: AiLogRecord = {
    ...record,
    weexResponse: receipt.accepted ? receipt.response : null,
    queued: !receipt.accepted,
  };

  const decision: Decision = {
    signalId: signal.id,
    thesisId: thesis.id,
    verdict,
    side: signal.suggestedSide,
    symbol: signal.symbol,
    sizeMultiplier: valve.multiplier,
    notionalUsdt,
    entryPrice,
    takeProfit: bracket.takeProfit,
    stopLoss: bracket.stopLoss,
    reason: valve.reason,
    source: judgement.source,
    aiLog,
    shadowFill,
    liveFill,
  };

  const body: ApiResponse<DecidePayload> = {
    ok: true,
    data: {
      decision,
      // Surfaced in the console header so a judge can see which path actually ran.
      wiring: {
        weexCredentials: hasCredentials(),
        venue: liveVenue,
        modelPath: judgement.source,
        store: store.mode,
      },
      theses: await store.listTheses(),
      queueDepth: await store.queueDepth(),
    },
  };
  return NextResponse.json(body);
}
