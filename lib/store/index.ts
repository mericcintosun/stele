// The swap seam. Server only.
//
// This is the ONLY module in the repo that branches on ADAPTER_MODE, and the
// only one that decides which store a caller gets. Pages, route handlers and
// the attribution job all call getStore() and never import an implementation
// directly.
//
// The default is the seed on purpose. A Vercel deploy with no environment
// variables at all has to serve a working /console, because that is what the
// recorded demo runs on and what a judge opens cold. ADAPTER_MODE=real without
// WEEX credentials degrades to the seed rather than to a 500.

import { ADAPTER_MODE } from "../config";
import { trace } from "../observability";
import { hasCredentials } from "../weex";
import { seedStore } from "./seed";
import type { LedgerStore } from "./types";
import { weexStore } from "./weex-store";

export function getStore(): LedgerStore {
  if (ADAPTER_MODE === "real" && hasCredentials()) {
    trace("store selected", { mode: "real" });
    return weexStore;
  }

  if (ADAPTER_MODE === "real") {
    // Asked for real, no keys to read with. Say so once, then serve the seed.
    trace("store: falling back to seed", { reason: "no_weex_credentials" });
  }

  return seedStore;
}

export type { LedgerStore } from "./types";
