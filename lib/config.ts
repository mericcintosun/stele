// Every constant in Stele lives here. Server only.
//
// Two rules that keep this file useful:
//   1. No other module reads process.env for a value that belongs to the core
//      path. If you need a knob, add it here and add the matching line to
//      .env.example, never inline in a route.
//   2. Nothing in here imports anything. It is a leaf, so a pure module or a
//      test can pull it in without dragging the WEEX client behind it.

/** WEEX OpenAPI v3 host. Regional endpoints are the only reason to override it. */
export const WEEX_HOST = process.env.WEEX_API_HOST ?? "https://api-contract.weex.com";

/**
 * "live" sends real orders, anything else stays on the demo futures endpoints.
 * The three WEEX secrets are deliberately not read here: they are read at the
 * call site in lib/weex.ts and never copied into a constant.
 */
export const WEEX_VENUE = process.env.WEEX_VENUE ?? "sim";

/** v3 paths. lib/weex.ts rewrites /capi/v3/ to /capi/v3/sim/ for the shadow venue. */
export const PATH_PLACE_ORDER = "/capi/v3/order/placeOrder";
export const PATH_UPLOAD_AI_LOG = "/capi/v3/order/uploadAiLog";
export const PATH_TICKER = "/capi/v3/market/ticker";
/** Closed position history. The attribution job reads realized PnL from here. */
export const PATH_FILLS = "/capi/v3/position/history";

/** Abort an outbound WEEX call after this many milliseconds. */
export const REQUEST_TIMEOUT_MS = 8000;
/** Retries after the first attempt. Exactly one, never a loop. */
export const RETRY_COUNT = 1;
/** The model chain gets longer than a REST call, but it is still bounded. */
export const MODEL_TIMEOUT_MS = 20000;

/** The sponsor model. The recorded demo runs on the Anthropic API path. */
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";

/**
 * "real" reads closed fills from WEEX and attributes them. Anything else,
 * including unset and a typo, is the seeded ledger. lib/store/index.ts is the
 * only module allowed to branch on this value.
 */
export const ADAPTER_MODE = process.env.ADAPTER_MODE ?? "fake";

/** First segment of every client_oid Stele sends: stele-<thesisId>-<signalId>-<ts>. */
export const CLIENT_OID_PREFIX = "stele";

// ---------------------------------------------------------------------------
// Round store (lib/store/round.ts, the only module that uses these two values)
// ---------------------------------------------------------------------------
// An Upstash compatible Redis REST endpoint. Both are optional. With either one
// missing the round lives in a module scope singleton instead, which still walks
// the whole of DEMO.md and only loses state when the process does.
//
// Server only. Neither key carries a NEXT_PUBLIC_ prefix and no client
// component imports this module.
export const KV_REST_API_URL = process.env.KV_REST_API_URL ?? "";
export const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN ?? "";

/** Which driver lib/store/round.ts will actually use on this process. */
export function storeMode(): "kv" | "memory" {
  return KV_REST_API_URL !== "" && KV_REST_API_TOKEN !== "" ? "kv" : "memory";
}

/** One key holds the whole round snapshot. Bump the suffix to invalidate. */
export const ROUND_KEY = "stele:round:v1";

/** Abort a store read or write after this. Shorter than the WEEX deadline. */
export const STORE_TIMEOUT_MS = 4000;

/** Where scripts/demo-reset.mjs posts. Only that script reads it. */
export const BASE_URL = process.env.STELE_BASE_URL ?? "http://localhost:3000";

/**
 * The two signals DEMO.md runs, by id. Step 2 sends an order, step 4 is the
 * refusal, and the thesis under the halt line is the one the refusal names.
 * Written down here so a seed edit that breaks the recording is one grep away.
 */
export const DEMO = {
  orderSignalId: "SIG-9107",
  refusalSignalId: "SIG-9104",
  haltedThesisId: "TH-SQZ-LONG",
} as const;

/** The perpetual pairs the agent is allowed to touch. WEEX writes them lowercase. */
export const ALLOWED_SYMBOLS = [
  "cmt_btcusdt",
  "cmt_ethusdt",
  "cmt_solusdt",
  "cmt_xrpusdt",
  "cmt_bnbusdt",
  "cmt_dogeusdt",
  "cmt_adausdt",
  "cmt_linkusdt",
] as const;

export type AllowedSymbol = (typeof ALLOWED_SYMBOLS)[number];

export function isAllowedSymbol(symbol: string): boolean {
  return (ALLOWED_SYMBOLS as readonly string[]).includes(symbol);
}

/** Prefix on every core path log line, so one grep finds the whole loop. */
export const LOG_PREFIX = "[core]";
