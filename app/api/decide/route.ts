// POST /api/decide
//
// The whole control loop in one request:
//   signal -> written thesis -> valve reads that thesis's ledger -> model writes
//   the explanation -> the log record is queued -> uploadAiLog receipt -> sim
//   shadow fill -> live fill -> the round is rewritten.
//
// A rejection travels the exact same path as an order. That is the point: the
// exchange gets a receipt for the agent saying no, and that receipt is what
// makes the ledger auditable evidence of AI participation.
//
// Two invariants this route is built around.
//
//   Durable first, posted second. The log record is written into the round
//   BEFORE uploadAiLog is attempted. An un-allowlisted UID is the normal case
//   today, and a record that never left the process is a hole in the evidence
//   trail.
//
//   Every effect lands in the persisted round, not in React state. Quota spent,
//   the new position, the decision, the log record and the signal leaving the
//   queue are all written here, which is why the refusal in step 4 of DEMO.md
//   is still on screen after the hard refresh in step 5.
//
// The thesis is read out of the persisted round rather than out of the seed, so
// a second run of the same signal sees the quota the first run spent.

import { NextResponse } from "next/server";
import { judge } from "@/lib/agent";
import { buildClientOid } from "@/lib/attribution";
import { CLIENT_OID_PREFIX } from "@/lib/config";
import { errorResponse } from "@/lib/errors";
import { trace } from "@/lib/observability";
import { readRound, viewOf, writeRound } from "@/lib/store";
import type {
  AiLogRecord,
  ApiResponse,
  Decision,
  Position,
  RoundState,
  RoundView,
} from "@/lib/types";
import { bracketFor, sizeOrder, valveFor, verdictFor } from "@/lib/valve";
import { parseDecideBody, readJson } from "@/lib/validate";
import { wiringNow, type Wiring } from "@/lib/wiring";
import { lastPrice, placeOrder, uploadAiLog, venueFromEnv } from "@/lib/weex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DecidePayload {
  decision: Decision;
  wiring: Wiring;
  /** The round after this decision, so the console renders server truth. */
  round: RoundView;
  /** True when this key had already been answered and nothing new was sent. */
  replayed: boolean;
}

export async function POST(req: Request) {
  const parsed = parseDecideBody(await readJson(req));
  if (!parsed.ok) return errorResponse(parsed.code, parsed.message);

  let state: RoundState;
  try {
    state = await readRound();
  } catch {
    return errorResponse("store_unavailable", "the round snapshot could not be read");
  }

  const signal = state.signals.find((s) => s.id === parsed.value.signalId);
  if (!signal) {
    return errorResponse("invalid_input", `no signal ${parsed.value.signalId} in the queue`);
  }

  const thesis = state.theses.find((t) => t.id === signal.thesisId);
  if (!thesis) {
    return errorResponse(
      "unknown_thesis",
      `signal ${signal.id} is not bound to a written thesis`,
    );
  }

  // Idempotency. Checked here, before placeOrder and before uploadAiLog, so a
  // double click cannot open a second position or write a second receipt. The
  // console sends `${signalId}-${round.updatedAt}`; a caller with no key gets
  // the signal id, which still makes a repeat a repeat.
  const idempotencyKey = parsed.value.idempotencyKey ?? signal.id;
  const alreadyDecided = state.seenKeys.includes(idempotencyKey);
  if (alreadyDecided) {
    const stored = state.decisions.find((d) => d.key === idempotencyKey);
    if (!stored) {
      // The key was spent by something other than a decision, /api/attribute
      // being the only other writer. Refuse rather than run the loop twice.
      return errorResponse("invalid_input", `idempotency key ${idempotencyKey} is already spent`);
    }
    trace("decision replayed", { key: idempotencyKey, thesis: thesis.id });
    const replay: ApiResponse<DecidePayload> = {
      ok: true,
      data: {
        decision: stored.decision,
        wiring: wiringNow(stored.decision.source),
        round: viewOf(state),
        replayed: true,
      },
    };
    return NextResponse.json(replay);
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

  const reference = state.markets.find((m) => m.symbol === signal.symbol)?.lastPrice ?? 0;
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
    aiLog: record,
    shadowFill,
    liveFill,
  };

  // The ledger is the memory. An accepted order spends quota now; realized PnL
  // lands later, when the position closes and /api/attribute pays it back.
  const spends = notionalUsdt > 0 && liveFill !== null;
  const position: Position | null = liveFill
    ? {
        id: `POS-${liveFill.orderId.slice(-4)}`,
        symbol: decision.symbol,
        side: decision.side,
        thesisId: decision.thesisId,
        entryPrice: liveFill.price,
        markPrice: liveFill.price,
        sizeContracts: Math.round((notionalUsdt / entryPrice) * 10_000) / 10_000,
        notionalUsdt,
        leverage: 5,
        takeProfit: bracket.takeProfit,
        stopLoss: bracket.stopLoss,
        unrealizedPnlUsdt: 0,
        openedAt: liveFill.filledAt,
      }
    : null;

  // Write one: everything except the receipt. After this line the decision is
  // durable, the key is spent and the record is in the queue, all before a
  // single byte goes to uploadAiLog.
  let written: RoundState;
  try {
    written = await writeRound({
      ...state,
      theses: state.theses.map((t) =>
        t.id === thesis.id && spends
          ? { ...t, quotaUsedUsdt: Math.round((t.quotaUsedUsdt + notionalUsdt) * 10) / 10 }
          : t,
      ),
      positions: position ? [position, ...state.positions] : state.positions,
      logs: [record, ...state.logs],
      decisions: [{ key: idempotencyKey, decision }, ...state.decisions],
      handledSignalIds: [...state.handledSignalIds, signal.id],
      seenKeys: [...state.seenKeys, idempotencyKey],
    });
  } catch {
    return errorResponse("store_unavailable", "the decision could not be written to the round");
  }
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

  const aiLog: AiLogRecord = {
    ...record,
    weexResponse: receipt.accepted ? receipt.response : null,
    queued: !receipt.accepted,
  };
  const answered: Decision = { ...decision, aiLog };

  // Write two: the receipt, if the exchange gave one. A rejected write leaves
  // the record queued exactly where write one put it, and POST /api/queue
  // replays it in postedAt order once the allowlist lands.
  if (receipt.accepted) {
    written = await writeRound({
      ...written,
      logs: written.logs.map((l) => (l.id === record.id ? aiLog : l)),
      decisions: written.decisions.map((d) =>
        d.key === idempotencyKey ? { key: d.key, decision: answered } : d,
      ),
    });
    trace("log accepted", { id: record.id, code: receipt.response?.code ?? "00000" });
  }

  const body: ApiResponse<DecidePayload> = {
    ok: true,
    data: {
      decision: answered,
      // Surfaced in the console header so a judge can see which path actually ran.
      wiring: wiringNow(judgement.source),
      round: viewOf(written),
      replayed: false,
    },
  };
  return NextResponse.json(body);
}
