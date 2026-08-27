// GET /api/log
//
// Every uploadAiLog record the agent has written this round, plus how many are
// still sitting in the local queue waiting on allowlist approval. Phase 2
// replaces the count with the real queue table depth.

import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapter";
import type { AiLogRecord, ApiResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs = await getAdapter().logs();
    const queueDepth = logs.filter((l) => l.queued === true).length;
    const body: ApiResponse<{ logs: AiLogRecord[]; queueDepth: number }> = {
      ok: true,
      data: { logs, queueDepth },
    };
    return NextResponse.json(body);
  } catch {
    const body: ApiResponse<never> = { ok: false, error: "log read failed" };
    return NextResponse.json(body, { status: 500 });
  }
}
