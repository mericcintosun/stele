// POST /api/attribute
//
// Closes the loop. An order spends quota when it goes out; this is where the
// money comes back and lands on the reason that opened the trade.
//
//   POST { positionId, exitPrice, idempotencyKey? }
//
// It removes the position from the round, folds its realized PnL onto the
// owning thesis through lib/attribution.ts (which recomputes trades, wins,
// realizedPnlPct and the running drawdown), writes a stage: "attribution"
// record to uploadAiLog, and rewrites the round.
//
// This is the manual, single position version of what lib/store/weex-store.ts
// does automatically from closed fills once ADAPTER_MODE=real and the WEEX
// credentials are in place. Both end in the same call, applyFillToThesis(), so
// the two paths cannot drift.
//
// The 90 second script does not close a position, so nothing in DEMO.md depends
// on this route. It is here because the ledger is the product and a ledger that
// only ever goes out is half a ledger.

import { NextResponse } from "next/server";
import { applyFillToThesis } from "@/lib/attribution";
import { errorResponse } from "@/lib/errors";
import { trace } from "@/lib/observability";
import { readRound, viewOf, writeRound } from "@/lib/store";
import type { AiLogRecord, ApiResponse, RoundState, RoundView, Thesis } from "@/lib/types";
import { parseAttributeBody, readJson } from "@/lib/validate";
import { uploadAiLog, venueFromEnv } from "@/lib/weex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AttributePayload {
  /** Null on a replay: the position is already gone, so there is nothing new to report. */
  thesis: Thesis | null;
  realizedUsdt: number;
  round: RoundView;
  replayed: boolean;
}

export async function POST(req: Request) {
  const parsed = parseAttributeBody(await readJson(req));
  if (!parsed.ok) return errorResponse(parsed.code, parsed.message);

  let state: RoundState;
  try {
    state = await readRound();
  } catch {
    return errorResponse("store_unavailable", "the round snapshot could not be read");
  }

  const { positionId, exitPrice } = parsed.value;
  const key = parsed.value.idempotencyKey ?? `attribute-${positionId}`;

  // Same guard as /api/decide, same reason: a repeat must not pay the same
  // closed trade onto the ledger twice.
  if (state.seenKeys.includes(key)) {
    trace("attribution replayed", { key });
    const replay: ApiResponse<AttributePayload> = {
      ok: true,
      data: { thesis: null, realizedUsdt: 0, round: viewOf(state), replayed: true },
    };
    return NextResponse.json(replay);
  }

  const position = state.positions.find((p) => p.id === positionId);
  if (!position) {
    return errorResponse("invalid_input", `no open position ${positionId} in this round`);
  }

  const current = state.theses.find((t) => t.id === position.thesisId);
  if (!current) {
    return errorResponse(
      "unknown_thesis",
      `position ${positionId} points at ${position.thesisId}, which is not a written thesis`,
    );
  }

  // Long pays the rise, short pays the fall. Contracts, not notional, because
  // the position carries the size it was actually filled at.
  const direction = position.side === "long" ? 1 : -1;
  const realizedUsdt =
    Math.round((exitPrice - position.entryPrice) * position.sizeContracts * direction * 100) / 100;

  const closedAt = new Date().toISOString();
  const next = applyFillToThesis(current, realizedUsdt, closedAt);

  const input = `Position ${position.id} closed at ${exitPrice.toFixed(2)}, opened ${position.entryPrice.toFixed(2)}, size ${position.sizeContracts} ${position.symbol}, side ${position.side}.`;
  const output = JSON.stringify({
    thesis: next.id,
    realized_usdt: realizedUsdt,
    ledger_after_pct: next.realizedPnlPct,
    trades: next.trades,
    wins: next.wins,
  });
  const explanation = [
    `Closed fill written back to ${next.id} (${next.name}).`,
    `Closed trade ${next.trades} on this thesis, ${next.wins} wins.`,
    `Realized ${realizedUsdt.toFixed(2)} USDT, ledger moves from ${current.realizedPnlPct.toFixed(2)}% to ${next.realizedPnlPct.toFixed(2)}% of deployed capital.`,
    `Max drawdown now ${next.maxDrawdownPct.toFixed(1)}%. The next signal matching this thesis is sized from this number.`,
  ]
    .join(" ")
    .slice(0, 1000);

  const record: AiLogRecord = {
    id: `LOG-ATTR-${position.id.replace("POS-", "")}-${Date.now().toString().slice(-6)}`,
    stage: "attribution",
    model: "stele-attribution",
    thesisId: next.id,
    input,
    output,
    explanation,
    orderId: null,
    postedAt: closedAt,
    weexResponse: null,
    queued: true,
  };

  // Durable before posted, exactly as in /api/decide.
  let written: RoundState;
  try {
    written = await writeRound({
      ...state,
      theses: state.theses.map((t) => (t.id === next.id ? next : t)),
      positions: state.positions.filter((p) => p.id !== position.id),
      logs: [record, ...state.logs],
      seenKeys: [...state.seenKeys, key],
    });
  } catch {
    return errorResponse("store_unavailable", "the closed trade could not be written to the round");
  }
  trace("attribution applied", { thesis: next.id, realized: realizedUsdt, applied: 1 });

  const receipt = await uploadAiLog(
    { stage: "attribution", model: record.model, input, output, explanation, orderId: null },
    venueFromEnv(),
  );

  if (receipt.accepted) {
    written = await writeRound({
      ...written,
      logs: written.logs.map((l) =>
        l.id === record.id ? { ...l, queued: false, weexResponse: receipt.response } : l,
      ),
    });
    trace("log accepted", { id: record.id, code: receipt.response?.code ?? "00000" });
  }

  const body: ApiResponse<AttributePayload> = {
    ok: true,
    data: { thesis: next, realizedUsdt, round: viewOf(written), replayed: false },
  };
  return NextResponse.json(body);
}
