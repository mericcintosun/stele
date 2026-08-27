// /api/queue
//
// The durable side of uploadAiLog. Every decision writes its record to the
// store before the POST is attempted, so a rejected write is not a lost record,
// it is a queued one. Only allowlisted UIDs may post to
// /capi/v3/order/uploadAiLog, which means "queued" is the normal state until
// WEEX approves the UID and the static IP.
//
//   GET  returns { depth, records }
//   POST replays everything still unsent, oldest postedAt first
//
// The replay stops at the first record the exchange refuses. Replaying record
// three while record two is still missing would put the evidence trail out of
// order, and the order is the part that makes it evidence.

import { NextResponse } from "next/server";
import { fail, STATUS_FOR } from "@/lib/errors";
import { trace } from "@/lib/observability";
import { QueueReplayRequestSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";
import type { AiLogRecord, ApiResponse } from "@/lib/types";
import { uploadAiLog, venueFromEnv } from "@/lib/weex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface QueueView {
  depth: number;
  records: AiLogRecord[];
}

interface ReplayResult {
  replayed: number;
  failed: number;
  depth: number;
}

export async function GET() {
  try {
    const store = getStore();
    const records = await store.listLogs();
    const depth = await store.queueDepth();
    const body: ApiResponse<QueueView> = { ok: true, data: { depth, records } };
    return NextResponse.json(body);
  } catch {
    const body: ApiResponse<never> = {
      ok: false,
      ...fail("upstream_error", "the log queue could not be read"),
    };
    return NextResponse.json(body, { status: STATUS_FOR.upstream_error });
  }
}

export async function POST(req: Request) {
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = QueueReplayRequestSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    const body: ApiResponse<never> = {
      ok: false,
      ...fail("invalid_input", "post {} or { limit: number } with limit between 1 and 100"),
    };
    return NextResponse.json(body, { status: STATUS_FOR.invalid_input });
  }

  const store = getStore();
  const venue = venueFromEnv();
  const all = await store.listLogs();

  const pending = all
    .filter((record) => record.queued)
    .sort((a, b) => a.postedAt.localeCompare(b.postedAt))
    .slice(0, parsed.data.limit ?? 100);

  let replayed = 0;

  for (const record of pending) {
    const receipt = await uploadAiLog(
      {
        stage: record.stage,
        model: record.model,
        input: record.input,
        output: record.output,
        explanation: record.explanation,
        orderId: record.orderId,
      },
      venue,
    );

    if (!receipt.accepted) break;

    await store.markLogSent(record.id, receipt.response);
    replayed += 1;
    trace("log accepted", { id: record.id, replay: 1 });
  }

  const depth = await store.queueDepth();
  const result: ReplayResult = { replayed, failed: pending.length - replayed, depth };
  trace("log queued", { depth, replayed });

  const body: ApiResponse<ReplayResult> = { ok: true, data: result };
  return NextResponse.json(body);
}
