// WEEX OpenAPI v3 client. Server only.
//
// One module, two paths, on purpose:
//   - When WEEX_API_KEY / WEEX_API_SECRET / WEEX_API_PASSPHRASE are all set,
//     every function below signs and sends a real HTTPS request to WEEX.
//   - When they are not set, the same function returns a shaped mock so the
//     console runs end to end with zero credentials.
//
// Signature recipe (WEEX OpenAPI v3, same family as the docs at
// https://www.weex.com/api-doc/ai/UploadAiLog):
//   prehash = ACCESS-TIMESTAMP + METHOD + requestPath + body
//   ACCESS-SIGN = base64(hmacSha256(prehash, apiSecret))
// Verify this against the live doc before the first real order. If WEEX changes
// the prehash order, this is the only function that has to move.
//
// Every outbound call goes through withTimeout(): one AbortController at
// REQUEST_TIMEOUT_MS, then exactly RETRY_COUNT retry. Both constants come from
// lib/config.ts. There is no loop, so a dead endpoint cannot hold a request
// handler open.

import { createHmac } from "node:crypto";
import {
  PATH_FILLS,
  PATH_PLACE_ORDER,
  PATH_TICKER,
  PATH_UPLOAD_AI_LOG,
  REQUEST_TIMEOUT_MS,
  RETRY_COUNT,
  WEEX_HOST,
  WEEX_VENUE,
} from "./config";
import { trace } from "./observability";
import { FillSchema, WeexEnvelopeSchema } from "./schemas";
import type { ClosedFill } from "./types";

/** "sim" routes through the demo futures endpoints, "live" through production. */
export type Venue = "sim" | "live";

export function venueFromEnv(): Venue {
  return WEEX_VENUE === "live" ? "live" : "sim";
}

export function hasCredentials(): boolean {
  return Boolean(
    process.env.WEEX_API_KEY && process.env.WEEX_API_SECRET && process.env.WEEX_API_PASSPHRASE,
  );
}

/**
 * The sim venue is the same v3 surface behind a /sim path segment.
 *
 * Exported because lib/evidence.ts has to name the exact path uploadAiLog()
 * posted to. Reading it from here rather than rebuilding the string keeps the
 * evidence page honest: if the venue switch ever changes, the page changes with
 * it instead of quietly printing yesterday's endpoint.
 */
export function pathFor(path: string, venue: Venue): string {
  if (venue === "live") return path;
  return path.replace("/capi/v3/", "/capi/v3/sim/");
}

function sign(timestamp: string, method: string, requestPath: string, body: string): string {
  const secret = process.env.WEEX_API_SECRET ?? "";
  return createHmac("sha256", secret).update(timestamp + method + requestPath + body).digest("base64");
}

interface WeexEnvelope<T> {
  code: string;
  msg: string;
  requestTime: number;
  data: T | null;
}

/**
 * One bounded attempt, then exactly one retry. The retry re-signs, because the
 * prehash carries a timestamp and a stale one is rejected. Repeating a
 * placeOrder is safe against the exchange because every order carries a
 * client_oid, which is also what attribution matches on later.
 */
async function withTimeout(attempt: (signal: AbortSignal) => Promise<Response>): Promise<Response> {
  const once = async (): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await attempt(controller.signal);
    } finally {
      clearTimeout(timer);
    }
  };

  let attempts = 0;
  try {
    attempts += 1;
    return await once();
  } catch (first) {
    if (RETRY_COUNT < 1) throw first;
    attempts += 1;
    return await once();
  } finally {
    if (attempts > 1) trace("weex retried", { attempts });
  }
}

/**
 * The envelope a dead endpoint produces. Both attempts timed out or the network
 * refused, so nothing was sent and nothing can be read back. It is shaped like
 * every other answer on purpose: placeOrder reports ok: false, uploadAiLog
 * reports the record still queued, and the caller never has an exception on the
 * core path. lib/errors.ts calls this condition upstream_timeout.
 */
const TIMEOUT_CODE = "upstream_timeout";

async function request<T>(
  method: "GET" | "POST",
  path: string,
  payload: Record<string, unknown> | null,
  venue: Venue,
): Promise<WeexEnvelope<T>> {
  const requestPath = pathFor(path, venue);
  const body = method === "POST" && payload ? JSON.stringify(payload) : "";

  let res: Response;
  try {
    res = await withTimeout((signal) => {
      const timestamp = Date.now().toString();
      return fetch(`${WEEX_HOST}${requestPath}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "ACCESS-KEY": process.env.WEEX_API_KEY ?? "",
          "ACCESS-SIGN": sign(timestamp, method, requestPath, body),
          "ACCESS-TIMESTAMP": timestamp,
          "ACCESS-PASSPHRASE": process.env.WEEX_API_PASSPHRASE ?? "",
          locale: "en-US",
        },
        body: body || undefined,
        cache: "no-store",
        signal,
      });
    });
  } catch {
    // Both attempts aborted or the network refused. Report it as the envelope
    // every call site already knows how to read, so a dead endpoint cannot
    // throw an exception up through a route handler.
    trace("weex unreachable", { path: requestPath, code: TIMEOUT_CODE });
    return { code: TIMEOUT_CODE, msg: "WEEX did not answer in time", requestTime: Date.now(), data: null };
  }

  const raw: unknown = await res.json().catch(() => null);
  const parsed = WeexEnvelopeSchema.safeParse(raw);
  if (!parsed.success) {
    // The schema is the contract, but a live order must not be thrown away over
    // a missing requestTime. If the answer still carries a code, read it
    // loosely; otherwise report a parse failure, shaped like every other answer
    // so no call site has to branch on null.
    const loose = isRecord(raw) ? raw : null;
    if (loose && typeof loose.code === "string") {
      const stamped = numeric(loose.requestTime);
      return {
        code: loose.code,
        msg: text(loose.msg),
        requestTime: Number.isFinite(stamped) ? stamped : Date.now(),
        data: (loose.data ?? null) as T | null,
      };
    }
    return { code: "parse_failure", msg: "unreadable WEEX envelope", requestTime: Date.now(), data: null };
  }

  return {
    code: parsed.data.code,
    msg: parsed.data.msg,
    requestTime: parsed.data.requestTime,
    data: (parsed.data.data ?? null) as T | null,
  };
}

export interface OrderRequest {
  symbol: string;
  side: "long" | "short";
  notionalUsdt: number;
  price: number;
  takeProfit: number;
  stopLoss: number;
  leverage: number;
  /** Stele's own tag. Carried through so the fill can be attributed on close. */
  clientOid: string;
}

export interface OrderResult {
  orderId: string;
  price: number;
  venue: Venue;
  filledAt: string;
  ok: boolean;
  message: string;
}

/**
 * Place a bracketed entry. TP and SL go with the entry so the position is
 * protected exchange side even if this process dies.
 */
export async function placeOrder(req: OrderRequest, venue: Venue): Promise<OrderResult> {
  const filledAt = new Date().toISOString();

  if (!hasCredentials()) {
    // Offline path: shaped exactly like the live envelope so nothing downstream
    // has to branch. Slippage is deterministic so the demo is reproducible.
    const slip = venue === "sim" ? 0.0004 : 0.0007;
    const price = Math.round(req.price * (1 + (req.side === "long" ? slip : -slip)) * 100) / 100;
    return {
      orderId: `${venue === "sim" ? "S" : "L"}-${Math.abs(hash(req.clientOid + venue)) % 1_000_000_000}`,
      price,
      venue,
      filledAt,
      ok: true,
      message: "mock fill (no WEEX credentials configured)",
    };
  }

  const size = Math.round((req.notionalUsdt / req.price) * 10_000) / 10_000;
  const env = await request<{ order_id?: string; orderId?: string; price?: string }>(
    "POST",
    PATH_PLACE_ORDER,
    {
      symbol: req.symbol,
      client_oid: req.clientOid,
      size: String(size),
      // WEEX order types: 1 open long, 2 open short, 3 close long, 4 close short.
      type: req.side === "long" ? 1 : 2,
      order_type: 0,
      match_price: 1,
      price: String(req.price),
      preset_take_profit_price: String(req.takeProfit),
      preset_stop_loss_price: String(req.stopLoss),
    },
    venue,
  );

  const id = env.data?.order_id ?? env.data?.orderId ?? "";
  return {
    orderId: id,
    price: env.data?.price ? Number(env.data.price) : req.price,
    venue,
    filledAt,
    ok: env.code === "00000" && Boolean(id),
    message: env.msg,
  };
}

export interface AiLogPayload {
  stage: string;
  model: string;
  input: string;
  output: string;
  /** WEEX rejects anything over 1000 characters. Truncated here, not at the call site. */
  explanation: string;
  orderId?: string | null;
}

export interface AiLogResult {
  accepted: boolean;
  queued: boolean;
  response: { code: string; msg: string; requestTime: number } | null;
}

/**
 * POST /capi/v3/order/uploadAiLog
 *
 * This is the disqualification gate: a team that cannot show valid AI
 * participation evidence is removed from the ranking. It is also where Stele's
 * thesis ledger lives, so the same write closes both.
 *
 * Only allowlisted UIDs may post. Anything rejected is reported as queued so
 * the caller can replay it once approval lands.
 */
export async function uploadAiLog(payload: AiLogPayload, venue: Venue): Promise<AiLogResult> {
  const explanation = payload.explanation.slice(0, 1000);

  if (!hasCredentials()) {
    return { accepted: false, queued: true, response: null };
  }

  const env = await request<unknown>(
    "POST",
    PATH_UPLOAD_AI_LOG,
    {
      stage: payload.stage,
      model: payload.model,
      input: payload.input,
      output: payload.output,
      explanation,
      ...(payload.orderId ? { orderId: Number(payload.orderId) } : {}),
    },
    venue,
  );

  const accepted = env.code === "00000";
  return {
    accepted,
    queued: !accepted,
    response: { code: env.code, msg: env.msg, requestTime: env.requestTime },
  };
}

/**
 * Last traded price. Falls back to the caller's reference price when there are
 * no credentials, which keeps the console deterministic offline.
 */
export async function lastPrice(symbol: string, fallback: number, venue: Venue): Promise<number> {
  if (!hasCredentials()) return fallback;
  try {
    const env = await request<{ last?: string }>(
      "GET",
      `${PATH_TICKER}?symbol=${encodeURIComponent(symbol)}`,
      null,
      venue,
    );
    const last = env.data?.last ? Number(env.data.last) : NaN;
    return Number.isFinite(last) ? last : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Closed positions, normalized into the shape lib/attribution.ts folds onto the
 * ledger.
 *
 * WEEX field names on the position history endpoint are not verified yet, so
 * this reads the handful of spellings the v3 surface uses elsewhere and then
 * validates every row through FillSchema. A row that does not parse is skipped,
 * never guessed at: an unattributed fill is better than a loss charged to the
 * wrong thesis, because the wrong thesis is the one the valve cuts.
 *
 * With no credentials there is nothing to read, so the answer is an empty list
 * and the seeded ledger stands.
 */
export async function closedFills(venue: Venue): Promise<ClosedFill[]> {
  if (!hasCredentials()) return [];

  const env = await request<unknown>("GET", PATH_FILLS, null, venue);
  if (env.code !== "00000" || env.data === null) return [];

  return rowsOf(env.data)
    .map(normalizeFill)
    .filter((fill): fill is ClosedFill => fill !== null);
}

function rowsOf(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data.filter(isRecord);
  if (!isRecord(data)) return [];
  for (const key of ["list", "orderList", "result", "rows", "data"]) {
    const inner = data[key];
    if (Array.isArray(inner)) return inner.filter(isRecord);
  }
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeFill(row: Record<string, unknown>): ClosedFill | null {
  const candidate = {
    clientOid: text(row.client_oid ?? row.clientOid),
    orderId: text(row.order_id ?? row.orderId ?? row.id),
    symbol: text(row.symbol ?? row.instrument_id ?? row.contract_code),
    realizedPnlUsdt: numeric(row.realized_pnl ?? row.realizedPnl ?? row.profit ?? row.pnl),
    closedAt: timestamp(row.close_time ?? row.closeTime ?? row.utime ?? row.ctime),
  };

  const parsed = FillSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
}

function numeric(value: unknown): number {
  const n = typeof value === "number" ? value : Number(text(value));
  return Number.isFinite(n) ? n : Number.NaN;
}

/** WEEX sends epoch milliseconds on some rows and an ISO string on others. */
function timestamp(value: unknown): string {
  if (typeof value === "string" && value.includes("-")) return value;
  const ms = numeric(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : "";
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
