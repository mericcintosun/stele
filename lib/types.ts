// The shape contract for the whole product.
//
// Nothing here has a value or an implementation. The seed in lib/data/seed.json
// satisfies these types today and the SQLite ledger satisfies the same types in
// Phase 2, which is why this file can be imported from a server route, a client
// component and the pure valve alike.

import type { SteleError } from "./errors";

export type ThesisState = "active" | "throttled" | "halted";

export interface Thesis {
  /** Stable id used to tag every order and every uploadAiLog record. */
  id: string;
  name: string;
  /** The written entry condition. Fixed before the round starts, never edited mid round. */
  precondition: string;
  symbols: string[];
  /** Closed trades only. Open positions do not touch the ledger. */
  trades: number;
  wins: number;
  realizedPnlUsdt: number;
  /** Realized PnL as a percent of the capital this thesis has deployed. */
  realizedPnlPct: number;
  maxDrawdownPct: number;
  /** Cumulative notional this thesis may deploy across the whole round. */
  quotaUsdt: number;
  quotaUsedUsdt: number;
  lastTradedAt: string;
}

export interface Position {
  id: string;
  symbol: string;
  side: "long" | "short";
  thesisId: string;
  entryPrice: number;
  markPrice: number;
  sizeContracts: number;
  notionalUsdt: number;
  leverage: number;
  /** Exchange-side orders, resting on WEEX. They survive an agent crash. */
  takeProfit: number;
  stopLoss: number;
  unrealizedPnlUsdt: number;
  openedAt: string;
}

export interface MarketRow {
  symbol: string;
  label: string;
  lastPrice: number;
  change24hPct: number;
  fundingRatePct: number;
  oiChange1hPct: number;
}

export interface Signal {
  id: string;
  symbol: string;
  headline: string;
  fundingRatePct: number;
  oiChange1hPct: number;
  suggestedSide: "long" | "short";
  /** Which written thesis this signal claims to satisfy. */
  thesisId: string;
}

export type LogStage =
  | "signal"
  | "thesis_match"
  | "sizing"
  | "order"
  | "rejection"
  | "attribution";

/** One POST to /capi/v3/order/uploadAiLog. Field names match the WEEX schema. */
export interface AiLogRecord {
  id: string;
  stage: LogStage;
  model: string;
  input: string;
  output: string;
  /** WEEX caps this at 1000 characters. */
  explanation: string;
  orderId: string | null;
  thesisId: string;
  postedAt: string;
  /** Null while the record sits in the local queue waiting for allowlist approval. */
  weexResponse: { code: string; msg: string; requestTime: number } | null;
  queued: boolean;
}

export interface Fill {
  venue: "sim" | "live";
  price: number;
  orderId: string;
  filledAt: string;
}

/**
 * A position that has already closed, as the attribution job needs it. The
 * clientOid is the only link back to the thesis that opened it, which is why
 * every order Stele sends carries one. Shape mirrors FillSchema in
 * lib/schemas.ts; lib/attribution.ts reads this type and never imports zod.
 */
export interface ClosedFill {
  clientOid: string;
  orderId: string;
  symbol: string;
  realizedPnlUsdt: number;
  closedAt: string;
}

export interface Decision {
  signalId: string;
  thesisId: string;
  verdict: "approved" | "reduced" | "rejected";
  side: "long" | "short";
  symbol: string;
  sizeMultiplier: number;
  notionalUsdt: number;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  reason: string;
  /** Which link in the model chain answered: the sponsor SDK, the local CLI, or the offline stub. */
  source: "anthropic" | "claude-cli" | "mock";
  aiLog: AiLogRecord;
  shadowFill: Fill | null;
  liveFill: Fill | null;
}

/**
 * Every route handler in this repo answers with exactly this envelope. The
 * failure arm carries the SteleErrorCode the client switches on plus a hint a
 * human can read, so no component ever matches on message text.
 */
export type ApiResponse<T> = { ok: true; data: T } | ({ ok: false } & SteleError);

/**
 * One decision as the round remembers it. The key is the idempotency key the
 * browser sent, so a repeat of the same click replays the stored answer instead
 * of placing a second order.
 */
export interface StoredDecision {
  key: string;
  decision: Decision;
}

/**
 * The whole round as one JSON blob. This is what lib/store/round.ts reads and
 * rewrites, and it is the only mutable state in the product.
 *
 * Everything here has to survive JSON.stringify, which is why the two "already
 * handled" collections are arrays rather than Sets.
 */
export interface RoundState {
  account: ConsoleSnapshot["account"];
  theses: Thesis[];
  positions: Position[];
  markets: MarketRow[];
  signals: Signal[];
  logs: AiLogRecord[];
  decisions: StoredDecision[];
  /** Signals the round has already answered. The queue hides them. */
  handledSignalIds: string[];
  /** Idempotency keys already spent. Checked before any outbound order. */
  seenKeys: string[];
  /** orderIds already folded onto the ledger, so attribution is safe to rerun. */
  countedOrderIds: string[];
  updatedAt: string;
}

/**
 * The round as the browser sees it. One shape, three sources: the server render,
 * the /api/decide answer and the /api/round refetch all hand back exactly this,
 * so the console has a single apply path and no chained effects.
 */
export interface RoundView {
  account: ConsoleSnapshot["account"];
  theses: Thesis[];
  positions: Position[];
  markets: MarketRow[];
  signals: Signal[];
  logs: AiLogRecord[];
  decisions: Decision[];
  handledSignalIds: string[];
  queueDepth: number;
  /** Half of the idempotency key the console sends back. */
  updatedAt: string;
}

/** One read of the whole console state. What the adapter hands to /console. */
export interface ConsoleSnapshot {
  account: {
    uid: string;
    equityUsdt: number;
    availableUsdt: number;
    round: number;
    totalRounds: number;
    side: string;
    maxLeverage: number;
  };
  theses: Thesis[];
  positions: Position[];
  markets: MarketRow[];
  signals: Signal[];
  logs: AiLogRecord[];
}
