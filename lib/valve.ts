// The capital valve.
//
// This is the part of Stele that is deliberately not an LLM. The model picks
// which written thesis a signal belongs to and writes the explanation. The
// size of the order comes from arithmetic over that thesis's own closed-trade
// ledger, so a losing reason loses its funding whether or not the model still
// likes it.
//
// Pure functions, no I/O. Safe to import from both the server route and the
// client console.

import type { Thesis } from "./types";

export const VALVE = {
  /** Ledger at or below this percent of deployed capital: the thesis is cut to zero. */
  haltPnlPct: -2.0,
  /** Below this and above the halt line: half size. */
  throttlePnlPct: -0.5,
  /** Max drawdown on the thesis that also forces a half size. */
  throttleDrawdownPct: 5.0,
  /** Closed trades needed before the ledger is allowed to size up past the cold start. */
  warmupTrades: 6,
  /** Multiplier applied while a thesis is still inside its warmup window. */
  warmupMultiplier: 0.5,
  /** Notional a thesis at full confidence deploys per order, in USDT. */
  baseNotionalUsdt: 240,
  /** Stop distance as a percent of entry. Take profit is twice this. */
  stopPct: 2.0,
} as const;

export interface ValveVerdict {
  multiplier: number;
  state: "active" | "throttled" | "halted";
  /** One line the console shows and the uploadAiLog explanation quotes. */
  reason: string;
  quotaRemainingUsdt: number;
}

export function valveFor(t: Thesis): ValveVerdict {
  const quotaRemainingUsdt = Math.max(0, t.quotaUsdt - t.quotaUsedUsdt);

  if (t.realizedPnlPct <= VALVE.haltPnlPct) {
    return {
      multiplier: 0,
      state: "halted",
      reason: `Ledger at ${t.realizedPnlPct.toFixed(2)}% over ${t.trades} closed trades, at or past the ${VALVE.haltPnlPct.toFixed(1)}% halt line. Capital for this thesis is closed for the round.`,
      quotaRemainingUsdt,
    };
  }

  if (quotaRemainingUsdt < 25) {
    return {
      multiplier: 0,
      state: "halted",
      reason: `Cumulative quota spent: ${t.quotaUsedUsdt.toFixed(1)} of ${t.quotaUsdt.toFixed(0)} USDT. No headroom left regardless of leverage.`,
      quotaRemainingUsdt,
    };
  }

  if (t.realizedPnlPct <= VALVE.throttlePnlPct || t.maxDrawdownPct >= VALVE.throttleDrawdownPct) {
    return {
      multiplier: 0.5,
      state: "throttled",
      reason: `Ledger ${t.realizedPnlPct.toFixed(2)}% with a ${t.maxDrawdownPct.toFixed(1)}% max drawdown. Above the halt line but under water, so size is halved.`,
      quotaRemainingUsdt,
    };
  }

  if (t.trades < VALVE.warmupTrades) {
    return {
      multiplier: VALVE.warmupMultiplier,
      state: "active",
      reason: `Only ${t.trades} closed trades on this thesis. Cold start rule holds size at ${VALVE.warmupMultiplier.toFixed(1)}x until the ledger has ${VALVE.warmupTrades}.`,
      quotaRemainingUsdt,
    };
  }

  const winRate = t.wins / t.trades;
  const multiplier = winRate >= 0.6 && t.realizedPnlPct >= 2 ? 1.25 : 1;
  return {
    multiplier,
    state: "active",
    reason: `Ledger +${t.realizedPnlPct.toFixed(2)}% over ${t.trades} closed trades, ${Math.round(winRate * 100)}% win rate, ${t.maxDrawdownPct.toFixed(1)}% max drawdown. Valve at ${multiplier.toFixed(2)}x.`,
    quotaRemainingUsdt,
  };
}

/** Order notional after the valve and the cumulative quota both have their say. */
export function sizeOrder(t: Thesis, v: ValveVerdict): number {
  if (v.multiplier === 0) return 0;
  const wanted = VALVE.baseNotionalUsdt * v.multiplier;
  return Math.round(Math.min(wanted, v.quotaRemainingUsdt) * 100) / 100;
}

/**
 * Exchange-side take profit and stop loss, sent with the entry so the position
 * is protected even if the agent process dies mid round.
 */
export function bracketFor(entry: number, side: "long" | "short") {
  const stop = VALVE.stopPct / 100;
  const target = stop * 2;
  const round = (n: number) => Math.round(n * 100) / 100;
  return side === "long"
    ? { takeProfit: round(entry * (1 + target)), stopLoss: round(entry * (1 - stop)) }
    : { takeProfit: round(entry * (1 - target)), stopLoss: round(entry * (1 + stop)) };
}

export function verdictFor(v: ValveVerdict): "approved" | "reduced" | "rejected" {
  if (v.multiplier === 0) return "rejected";
  if (v.multiplier < 1) return "reduced";
  return "approved";
}
