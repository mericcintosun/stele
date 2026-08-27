// GET /api/ledger
//
// The thesis ledger as the adapter sees it. Seeded today, the SQLite ledger in
// Phase 2, same body either way.

import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapter";
import type { ApiResponse, Thesis } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const theses = await getAdapter().theses();
    const body: ApiResponse<{ theses: Thesis[] }> = { ok: true, data: { theses } };
    return NextResponse.json(body);
  } catch {
    const body: ApiResponse<never> = { ok: false, error: "ledger read failed" };
    return NextResponse.json(body, { status: 500 });
  }
}
