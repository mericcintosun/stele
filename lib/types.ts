// The shape contract for the whole product.
//
// Nothing here has a value or an implementation. The seed in lib/data/seed.json
// satisfies these types today and the SQLite ledger satisfies the same types in
// Phase 2, which is why this file can be imported from a server route, a client
// component and the pure valve alike.

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

/** Every route handler in this repo answers with exactly this envelope. */
export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

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
