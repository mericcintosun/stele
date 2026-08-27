// One shape for every request body check on the demo path.
//
// The Phase 3 brief called for a hand written validator here so the phase would
// not need a new dependency. zod is already a dependency, added in Phase 2 and
// already parsing the model answer, the WEEX envelope and the fill rows, so the
// fence ("no new npm dependency") is satisfied without writing a second parser
// that could disagree with the first. The schemas stay in lib/schemas.ts, and
// this module is the thin adapter that turns a ZodError into the SteleErrorCode
// the routes answer with.
//
// Every function here returns the same tagged union, so a route reads:
//
//   const parsed = parseDecideBody(raw);
//   if (!parsed.ok) return errorResponse(parsed.code, parsed.message);

import type { SteleErrorCode } from "./errors";
import {
  AttributeRequestSchema,
  DecideRequestSchema,
  QueueReplayRequestSchema,
  type AttributeRequest,
  type DecideRequest,
  type QueueReplayRequest,
} from "./schemas";

export type Parsed<T> =
  | { ok: true; value: T }
  | { ok: false; code: SteleErrorCode; message: string };

function invalid<T>(message: string): Parsed<T> {
  return { ok: false, code: "invalid_input", message };
}

/** POST /api/decide: { signalId, idempotencyKey? }. */
export function parseDecideBody(raw: unknown): Parsed<DecideRequest> {
  const parsed = DecideRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return invalid("post a JSON body shaped { signalId: string, idempotencyKey?: string }");
  }
  return { ok: true, value: parsed.data };
}

/** POST /api/attribute: { positionId, exitPrice, idempotencyKey? }. */
export function parseAttributeBody(raw: unknown): Parsed<AttributeRequest> {
  const parsed = AttributeRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return invalid(
      "post a JSON body shaped { positionId: string, exitPrice: number, idempotencyKey?: string }",
    );
  }
  return { ok: true, value: parsed.data };
}

/** POST /api/queue: {} or { limit }. */
export function parseQueueBody(raw: unknown): Parsed<QueueReplayRequest> {
  const parsed = QueueReplayRequestSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return invalid("post {} or { limit: number } with limit between 1 and 100");
  }
  return { ok: true, value: parsed.data };
}

/**
 * GET and POST bodies that carry nothing. Present so /api/round and /api/reset
 * go through the same door as the two mutating routes rather than skipping
 * validation because they happen to have no fields today.
 */
export function parseEmptyBody(raw: unknown): Parsed<Record<string, never>> {
  if (raw === null || raw === undefined) return { ok: true, value: {} };
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return invalid("post an empty body or {}");
  }
  return { ok: true, value: {} };
}

/** Read a request body without throwing on an empty or malformed one. */
export async function readJson(req: Request): Promise<unknown> {
  return req
    .json()
    .then((value: unknown) => value)
    .catch(() => null);
}
