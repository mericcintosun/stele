// POST /api/decide
//
// The whole control loop in one request:
//   signal -> written thesis -> valve reads that thesis's ledger -> model writes
//   the explanation -> uploadAiLog receipt -> sim shadow fill -> live fill.
//
// A rejection travels the exact same path as an order. That is the point: the
// exchange gets a receipt for the agent saying no, and that receipt is what
// makes the ledger auditable evidence of AI participation.

import { NextResponse } from "next/server";
import { judge } from "@/lib/agent";
import { marketFor, signalById, thesisById } from "@/lib/data/seed";
import type { AiLogRecord, ApiResponse, Decision } from "@/lib/types";
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
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { signalId?: string };
  const signal = body.signalId ? signalById(body.signalId) : undefined;
  if (!signal) {
    const fail: ApiResponse<never> = { ok: false, error: "unknown signal" };
    return NextResponse.json(fail, { status: 400 });
  }

  const thesis = thesisById(signal.thesisId);
  if (!thesis) {
    const fail: ApiResponse<never> = {
      ok: false,
      error: "signal is not bound to a written thesis",
    };
    return NextResponse.json(fail, { status: 422 });
  }

  const valve = valveFor(thesis);
  const verdict = verdictFor(valve);
  const notionalUsdt = sizeOrder(thesis, valve);

  const reference = marketFor(signal.symbol)?.lastPrice ?? 0;
  const liveVenue = venueFromEnv();
  const entryPrice = await lastPrice(signal.symbol, reference, liveVenue);
  const bracket = bracketFor(entryPrice, signal.suggestedSide);

  const judgement = await judge(signal, thesis, valve);

  const stage = verdict === "rejected" ? "rejection" : "order";
  const now = new Date().toISOString();
  const clientOid = `stele-${signal.id}-${Date.now()}`;

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
    }
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

  const receipt = await uploadAiLog(
    {
      stage,
      model: judgement.model,
      input: `${signal.symbol} ${signal.headline} funding=${signal.fundingRatePct}% oi_1h=${signal.oiChange1hPct}%`,
      output,
      explanation: judgement.explanation,
      orderId: liveFill?.orderId ?? null,
    },
    liveVenue,
  );

  const aiLog: AiLogRecord = {
    id: `LOG-${Date.now().toString().slice(-6)}`,
    stage,
    model: judgement.model,
    thesisId: thesis.id,
    input: `${signal.symbol} funding ${signal.fundingRatePct.toFixed(4)}%, OI ${signal.oiChange1hPct.toFixed(1)}% / 1h. ${signal.headline}`,
    output,
    explanation: judgement.explanation.slice(0, 1000),
    orderId: liveFill?.orderId ?? null,
    postedAt: now,
    weexResponse: receipt.response,
    queued: receipt.queued,
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

  const ok: ApiResponse<{ decision: Decision; wiring: Wiring }> = {
    ok: true,
    data: {
      decision,
      // Surfaced in the console header so a judge can see which path actually ran.
      wiring: {
        weexCredentials: hasCredentials(),
        venue: liveVenue,
        modelPath: judgement.source,
      },
    },
  };
  return NextResponse.json(ok);
}
