// GET /api/ledger
//
// The thesis ledger as the store sees it. Seeded by default, attributed from
// WEEX closed fills when the real store is selected, same body either way.

import { NextResponse } from "next/server";
import { fail, STATUS_FOR } from "@/lib/errors";
import { getStore } from "@/lib/store";
import type { ApiResponse, Thesis } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const theses = await getStore().listTheses();
    const body: ApiResponse<{ theses: Thesis[] }> = { ok: true, data: { theses } };
    return NextResponse.json(body);
  } catch {
    const body: ApiResponse<never> = {
      ok: false,
      ...fail("upstream_error", "the thesis ledger could not be read"),
    };
    return NextResponse.json(body, { status: STATUS_FOR.upstream_error });
  }
}
