// The error vocabulary for the core path.
//
// Route handlers answer with { error, hint }: the code is for the client to
// switch on, the hint is for the human reading the console. The client never
// matches on message text, so wording can change without breaking the UI.
//
// errorResponse() below is the only way a route in this repo builds a failure
// body. No handler writes NextResponse.json({ error: ... }) by hand, which is
// what keeps the status codes and the envelope shape consistent across all six.

import { NextResponse } from "next/server";

export type SteleErrorCode =
  | "invalid_input"
  | "upstream_timeout"
  | "upstream_error"
  | "parse_failure"
  | "not_configured"
  | "unknown_thesis"
  | "store_unavailable"
  | "internal";

export interface SteleError {
  error: SteleErrorCode;
  hint: string;
}

export function fail(code: SteleErrorCode, hint: string): SteleError {
  return { error: code, hint };
}

/** HTTP status for each code, so the routes stay consistent with each other. */
export const STATUS_FOR: Record<SteleErrorCode, number> = {
  invalid_input: 400,
  unknown_thesis: 422,
  parse_failure: 422,
  not_configured: 503,
  store_unavailable: 503,
  upstream_timeout: 504,
  upstream_error: 502,
  internal: 500,
};

/**
 * The failure half of ApiResponse<T>, as a response. Every route created or
 * edited in Phase 3 maps its failures through here.
 */
export function errorResponse(code: SteleErrorCode, hint: string): NextResponse {
  return NextResponse.json({ ok: false, ...fail(code, hint) }, { status: STATUS_FOR[code] });
}
