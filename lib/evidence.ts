// The AI participation receipt trail, summarized. Server only.
//
// WEEX removes a team from the ranking if it cannot present valid evidence of
// AI participation, and the AI model token allocation is awarded on proof of
// real model usage. Both of those are decided on what /capi/v3/order/uploadAiLog
// received, so this module answers one question about the records Stele has
// written: where did they go, who wrote them, and how many did the exchange
// actually take.
//
// It reads its endpoint and its venue out of lib/weex.ts rather than repeating
// the strings, so the page cannot claim an endpoint the client is not posting
// to. Delete lib/weex.ts and this file stops compiling, which is the point.

import { PATH_UPLOAD_AI_LOG } from "./config";
import { logs as priorLogs } from "./data/seed";
import type { AiLogRecord } from "./types";
import { hasCredentials, pathFor, venueFromEnv, type Venue } from "./weex";

export interface EvidenceSummary {
  /** The path uploadAiLog() posts to on this deployment, sim aware. */
  endpoint: string;
  venue: Venue;
  /** All three WEEX secrets present. Without them the client queues instead of posting. */
  credentialed: boolean;
  total: number;
  /** Records the exchange answered with code 00000. */
  accepted: number;
  /** Records still waiting on the uploadAiLog allowlist. */
  queued: number;
  byStage: Array<{ stage: string; count: number }>;
  /** Every distinct value that has appeared in the WEEX `model` field. */
  models: string[];
  /** The longest explanation written so far, against the WEEX cap of 1000. */
  maxExplanationChars: number;
}

/** The WEEX field limit, repeated here so the page can show the ratio. */
export const EXPLANATION_LIMIT = 1000;

/**
 * Defaults to the seeded prior records so a caller with no round in hand still
 * gets a real answer. /evidence passes the live round's logs instead, which is
 * why a decision run in the demo shows up on the strip immediately.
 */
export function evidenceSummary(logs: AiLogRecord[] = priorLogs): EvidenceSummary {
  const venue = venueFromEnv();

  const counts = new Map<string, number>();
  const models = new Set<string>();
  let accepted = 0;
  let maxExplanationChars = 0;

  for (const log of logs) {
    counts.set(log.stage, (counts.get(log.stage) ?? 0) + 1);
    models.add(log.model);
    if (log.weexResponse !== null) accepted += 1;
    if (log.explanation.length > maxExplanationChars) {
      maxExplanationChars = log.explanation.length;
    }
  }

  return {
    endpoint: pathFor(PATH_UPLOAD_AI_LOG, venue),
    venue,
    credentialed: hasCredentials(),
    total: logs.length,
    accepted,
    queued: logs.length - accepted,
    // Most used stage first, then alphabetically, so the order is stable across
    // two server renders of the same round.
    byStage: [...counts.entries()]
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => (b.count === a.count ? a.stage.localeCompare(b.stage) : b.count - a.count)),
    models: [...models].sort(),
    maxExplanationChars,
  };
}
