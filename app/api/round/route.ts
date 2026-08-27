// GET /api/round
//
// The whole round as the browser reads it: theses, positions, markets, signals,
// the uploadAiLog stream, the decisions already made and which signals they
// answered. One request, no waterfall.
//
// This is the client's only refresh path. The console server renders its first
// frame from readRound() directly in app/console/page.tsx, then comes here when
// the round changes: the retry button in ConsoleErrorState and the reload after
// a round reset both land on this route.
//
// readRound() seeds itself, so this never answers with an empty round.

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { readRound, viewOf } from "@/lib/store";
import type { ApiResponse, RoundView } from "@/lib/types";
import { wiringNow, type Wiring } from "@/lib/wiring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RoundPayload {
  round: RoundView;
  wiring: Wiring;
}

export async function GET() {
  try {
    const state = await readRound();
    const round = viewOf(state);
    const body: ApiResponse<RoundPayload> = {
      ok: true,
      data: {
        round,
        wiring: wiringNow(round.decisions[0]?.source ?? null),
      },
    };
    return NextResponse.json(body);
  } catch {
    return errorResponse("store_unavailable", "the round snapshot could not be read");
  }
}
