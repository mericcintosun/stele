// Every boundary in Stele is validated here, and only here.
//
// Three boundaries exist: the request body a browser posts to a route, the JSON
// a model hands back, and the envelope WEEX returns. All three are written by
// something outside this repo, so all three are parsed before they are trusted.
// Everything is exported by name so a test can import a schema on its own.

import { z } from "zod";

/**
 * POST /api/decide.
 *
 * idempotencyKey is optional so a curl call still works. When it is missing the
 * route falls back to the signal id, which means a repeated call with no key is
 * also treated as a repeat rather than as a second order. The console always
 * sends one, shaped `${signalId}-${round.updatedAt}`, so a double click inside
 * one round state cannot place two orders.
 */
export const DecideRequestSchema = z.object({
  signalId: z.string().min(1, "signalId is required"),
  idempotencyKey: z.string().min(1).max(200).optional(),
});
export type DecideRequest = z.infer<typeof DecideRequestSchema>;

/**
 * POST /api/attribute. Closes one open position at a price and writes the
 * realized PnL back onto the thesis that opened it.
 */
export const AttributeRequestSchema = z.object({
  positionId: z.string().min(1, "positionId is required"),
  exitPrice: z.number().finite().positive(),
  idempotencyKey: z.string().min(1).max(200).optional(),
});
export type AttributeRequest = z.infer<typeof AttributeRequestSchema>;

/** POST /api/queue. An empty body replays everything that is still unsent. */
export const QueueReplayRequestSchema = z.object({
  limit: z.number().int().positive().max(100).optional(),
});
export type QueueReplayRequest = z.infer<typeof QueueReplayRequestSchema>;

/**
 * What the model is allowed to return. The explanation cap matches the WEEX
 * uploadAiLog field limit, so a record that parses here always posts.
 */
export const JudgementSchema = z.object({
  matches: z.boolean(),
  confidence: z.number().min(0).max(1),
  explanation: z.string().min(1).max(1000),
});
export type JudgementPayload = z.infer<typeof JudgementSchema>;

/** The envelope every WEEX v3 endpoint wraps its answer in. */
export const WeexEnvelopeSchema = z.object({
  code: z.string(),
  msg: z.string(),
  requestTime: z.number(),
  data: z.unknown().nullable(),
});
export type WeexEnvelopePayload = z.infer<typeof WeexEnvelopeSchema>;

/**
 * One closed position as the attribution job needs it. WEEX sends most numbers
 * as strings, so lib/weex.ts normalizes the row before it reaches this schema.
 */
export const FillSchema = z.object({
  clientOid: z.string().min(1),
  orderId: z.string().min(1),
  symbol: z.string().min(1),
  realizedPnlUsdt: z.number().finite(),
  closedAt: z.string().min(1),
});
export type FillPayload = z.infer<typeof FillSchema>;
