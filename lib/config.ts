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
