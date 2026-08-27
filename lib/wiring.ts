// Which path actually ran, in one object.
//
// Every route that answers the console attaches this, so a judge watching the
// recording can tell a real signed WEEX call from the credential free mock, the
// Anthropic API from the offline stub, and a persisted round from the in
// process one. It was an unexported interface inside /api/decide until Phase 3
// needed the same block on /api/round, /api/reset and /api/attribute.
//
// Server only. It reads whether credentials exist, never what they are.

import { storeMode } from "./config";
import { getStore } from "./store";
import type { Decision } from "./types";
import { hasCredentials, venueFromEnv, type Venue } from "./weex";

export interface Wiring {
  weexCredentials: boolean;
  venue: Venue;
  /** Null until a decision has run in this round. */
  modelPath: Decision["source"] | null;
  store: "fake" | "real";
  /** "kv" once the two round store keys are set, "memory" otherwise. */
  persistence: "kv" | "memory";
}

export function wiringNow(modelPath: Decision["source"] | null): Wiring {
  return {
    weexCredentials: hasCredentials(),
    venue: venueFromEnv(),
    modelPath,
    store: getStore().mode,
    persistence: storeMode(),
  };
}
