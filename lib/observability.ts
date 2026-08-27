// One line per core step, one prefix, no payloads.
//
// What goes in a detail bag: ids, hashes, lengths, counts, durations, verdicts.
// What never goes in: an API key, a passphrase, a full prompt, a full model
// response, a request body. If a value could be a secret or could be long,
// log its length or its hash instead.

import { LOG_PREFIX } from "./config";

export type TraceDetail = Record<string, string | number>;

export function trace(step: string, detail?: TraceDetail): void {
  if (!detail) {
    console.info(`${LOG_PREFIX} ${step}`);
    return;
  }
  const tail = Object.entries(detail)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");
  console.info(`${LOG_PREFIX} ${step} ${tail}`);
}
