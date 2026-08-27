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

import { createHmac } from "node:crypto";

const HOST = process.env.WEEX_API_HOST ?? "https://api-contract.weex.com";

/** "sim" routes through the demo futures endpoints, "live" through production. */
export type Venue = "sim" | "live";

export function venueFromEnv(): Venue {
  return process.env.WEEX_VENUE === "live" ? "live" : "sim";
}

export function hasCredentials(): boolean {
  return Boolean(
    process.env.WEEX_API_KEY && process.env.WEEX_API_SECRET && process.env.WEEX_API_PASSPHRASE,
  );
}

/** The sim venue is the same v3 surface behind a /sim path segment. */
function pathFor(path: string, venue: Venue): string {
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

async function request<T>(
  method: "GET" | "POST",
  path: string,
  payload: Record<string, unknown> | null,
  venue: Venue,
): Promise<WeexEnvelope<T>> {
  const requestPath = pathFor(path, venue);
  const body = method === "POST" && payload ? JSON.stringify(payload) : "";
  const timestamp = Date.now().toString();

  const res = await fetch(`${HOST}${requestPath}`, {
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
  });

  const json = (await res.json()) as WeexEnvelope<T>;
  return json;
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
    "/capi/v3/order/placeOrder",
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
    "/capi/v3/order/uploadAiLog",
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
      `/capi/v3/market/ticker?symbol=${encodeURIComponent(symbol)}`,
      null,
      venue,
    );
    const last = env.data?.last ? Number(env.data.last) : NaN;
    return Number.isFinite(last) ? last : fallback;
  } catch {
    return fallback;
  }
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
