// The error vocabulary for the core path.
//
// Route handlers answer with { error, hint }: the code is for the client to
// switch on, the hint is for the human reading the console. The client never
// matches on message text, so wording can change without breaking the UI.

export type SteleErrorCode =
  | "invalid_input"
  | "upstream_timeout"
  | "upstream_error"
  | "parse_failure"
  | "not_configured"
  | "unknown_thesis";

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
  upstream_timeout: 504,
  upstream_error: 502,
};
