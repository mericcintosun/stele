// POST /api/reset
//
// Puts the round back to the opening frame of DEMO.md: six theses with the
// ledgers they earned in round one, three open positions, four signals waiting,
// four prior log records, no decisions and no spent idempotency keys.
//
// This is what makes the 90 second recording retakeable. The wow step spends
// quota and writes a refusal into the persisted round, so without a documented
// way back the second take starts from a different screen than the first. Both
// the Reset round control in the console and `npm run demo:reset` come here.

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { resetRound, viewOf } from "@/lib/store";
import type { ApiResponse, RoundView } from "@/lib/types";
import { parseEmptyBody, readJson } from "@/lib/validate";
import { wiringNow, type Wiring } from "@/lib/wiring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ResetPayload {
  round: RoundView;
  wiring: Wiring;
}

export async function POST(req: Request) {
  const parsed = parseEmptyBody(await readJson(req));
  if (!parsed.ok) return errorResponse(parsed.code, parsed.message);

  try {
    const round = viewOf(await resetRound());
    const body: ApiResponse<ResetPayload> = {
      ok: true,
      data: { round, wiring: wiringNow(null) },
    };
    return NextResponse.json(body);
  } catch {
    return errorResponse("store_unavailable", "the round snapshot could not be rewritten");
  }
}
