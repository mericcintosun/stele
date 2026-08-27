// GET /api/log
//
// Every uploadAiLog record the agent has written this round, plus how many are
// still sitting in the local queue waiting on allowlist approval. The depth is
// the store's own count now, not a filter over the rendered list.

import { NextResponse } from "next/server";
import { fail, STATUS_FOR } from "@/lib/errors";
import { getStore } from "@/lib/store";
import type { AiLogRecord, ApiResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = getStore();
    const logs = await store.listLogs();
    const queueDepth = await store.queueDepth();
    const body: ApiResponse<{ logs: AiLogRecord[]; queueDepth: number }> = {
      ok: true,
      data: { logs, queueDepth },
    };
    return NextResponse.json(body);
  } catch {
    const body: ApiResponse<never> = {
      ok: false,
      ...fail("upstream_error", "the uploadAiLog record list could not be read"),
    };
    return NextResponse.json(body, { status: STATUS_FOR.upstream_error });
  }
}
