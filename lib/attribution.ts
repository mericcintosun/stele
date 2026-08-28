// Order attribution. Pure functions, no I/O, same discipline as lib/valve.ts.
//
// This is the piece that makes the ledger the agent's own memory rather than a
// seed file. Every order Stele sends carries a client_oid shaped
// stele-<thesisId>-<signalId>-<timestamp>. When the position closes, the fill
// comes back with that same oid, and the realized PnL lands on the thesis that
// opened it. lib/valve.ts then sizes the next order from a number the agent
// earned.
//
// Two rules, both deliberate:
//   - A fill whose oid does not parse to a known thesis is skipped, never
//     guessed at. An unattributed loss is better than a loss charged to the
//     wrong reason, because the wrong reason is the one that gets cut.
//   - A fill whose orderId has already been counted is skipped. The job is safe
//     to run twice.
//
// This module imports types only, so it loads under `node --test` with no
// bundler and no environment.

import type { ClosedFill, Position, Thesis } from "./types";

/**
 * Mirrors CLIENT_OID_PREFIX in lib/config.ts. It is repeated here rather than
 * imported so this module stays a leaf with zero runtime imports; the call
 * sites in the app pass the config value in explicitly.
 */
const DEFAULT_PREFIX = "stele";

/**
 * stele-TH-SQZ-LONG-SIG-9104-1756412345678, with an optional -sim marker on the
 * shadow order. Thesis ids and signal ids both contain hyphens, so the signal
 * segment is the anchor and the timestamp is the tail.
 */
const CLIENT_OID = /^([a-z0-9]+)-(.+?)-(SIG-[A-Za-z0-9]+)-(\d+)(?:-sim)?$/;

export interface ParsedClientOid {
  thesisId: string;
  signalId: string;
}

/** The one place the client_oid grammar is written down for reading. */
export function parseClientOid(oid: string, prefix: string = DEFAULT_PREFIX): ParsedClientOid | null {
  const match = CLIENT_OID.exec(oid.trim());
  if (!match) return null;
  if (match[1] !== prefix) return null;
  return { thesisId: match[2], signalId: match[3] };
}

/** The one place it is written down for sending. */
export function buildClientOid(
  thesisId: string,
  signalId: string,
  timestampMs: number,
  prefix: string = DEFAULT_PREFIX,
): string {
  return `${prefix}-${thesisId}-${signalId}-${timestampMs}`;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;
const round1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * What realizedPnlPct is a percent OF.
 *
 * Phases 2 and 3 both left this open, and it matters more than it looks. The
 * ledger a thesis carries measures its realized PnL against the capital it has
 * deployed across every round, which is a cumulative notional figure. The per
 * round quota (quotaUsedUsdt) is a different and much smaller number: for
 * TH-SQZ-LONG the seed reads -21.4 USDT at -2.14%, which is -21.4 against about
 * 1000 USDT of deployed notional, not against 148.2 USDT of round quota.
 *
 * Recomputing against the quota therefore re-scaled the ledger by roughly eight
 * times the moment one trade closed, and a closed LOSS made the percentage read
 * larger rather than smaller. On the console that looks like a bug, because it
 * is one.
 *
 * So the base is read back out of the row's own two numbers, which is the only
 * place the original denominator survives, and quotaUsedUsdt is kept as the
 * fallback for a thesis that has not closed a trade yet. Both inputs are stored
 * rounded to two decimals, so the recovered base drifts by a fraction of a
 * percent across a handful of closes. That is well inside the precision the
 * valve reads it at.
 */
function deployedBase(t: Thesis): number {
  if (t.realizedPnlUsdt !== 0 && t.realizedPnlPct !== 0) {
    const implied = Math.abs(t.realizedPnlUsdt) / (Math.abs(t.realizedPnlPct) / 100);
    if (Number.isFinite(implied) && implied >= 1) return implied;
  }
  return Math.max(1, t.quotaUsedUsdt);
}

/**
 * What one open position realizes if it is closed at a given price.
 *
 * A long pays the rise and a short pays the fall, over contracts rather than
 * notional, because the position carries the size it was actually filled at.
 * This is the arithmetic the real attribution poller will run once it reads
 * closed fills back from WEEX; today POST /api/attribute runs it against a
 * position the console hands it.
 */
export function realizedFromExit(p: Position, exitPrice: number): number {
  const direction = p.side === "long" ? 1 : -1;
  return round2((exitPrice - p.entryPrice) * p.sizeContracts * direction);
}

/**
 * One closed trade landing on one thesis.
 *
 * realizedPnlPct is measured against deployed capital, floored at 1 USDT so a
 * thesis that has not spent anything yet cannot divide by zero. maxDrawdownPct
 * is the running peak to trough of the cumulative realized curve, which is why
 * the caller may hand in the peak it has been tracking across a batch.
 */
export function applyFillToThesis(
  t: Thesis,
  realizedUsdt: number,
  closedAt: string,
  peakUsdt: number = Math.max(t.realizedPnlUsdt, 0),
): Thesis {
  const deployed = deployedBase(t);
  const realizedPnlUsdt = round2(t.realizedPnlUsdt + realizedUsdt);
  const peak = Math.max(peakUsdt, realizedPnlUsdt);
  const drawdownPct = round1(((peak - realizedPnlUsdt) / deployed) * 100);

  return {
    ...t,
    trades: t.trades + 1,
    wins: t.wins + (realizedUsdt > 0 ? 1 : 0),
    realizedPnlUsdt,
    realizedPnlPct: round2((realizedPnlUsdt / deployed) * 100),
    maxDrawdownPct: Math.max(t.maxDrawdownPct, drawdownPct),
    lastTradedAt: closedAt > t.lastTradedAt ? closedAt : t.lastTradedAt,
  };
}

export interface AttributeOptions {
  /** Defaults to the same prefix lib/config.ts sends. */
  prefix?: string;
  /** orderIds already written to the ledger by an earlier run. */
  counted?: ReadonlySet<string>;
}

export interface AttributionResult {
  theses: Thesis[];
  applied: number;
}

/** Fold a batch of closed fills onto the thesis snapshot they belong to. */
export function attribute(
  theses: Thesis[],
  fills: ClosedFill[],
  options: AttributeOptions = {},
): AttributionResult {
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  const counted = options.counted ?? new Set<string>();

  const byId = new Map<string, Thesis>(theses.map((t) => [t.id, t]));
  const peaks = new Map<string, number>();
  const seen = new Set<string>();
  let applied = 0;

  // Oldest first, so the drawdown curve is walked in the order it happened.
  const ordered = [...fills].sort((a, b) =>
    a.closedAt === b.closedAt ? a.orderId.localeCompare(b.orderId) : a.closedAt.localeCompare(b.closedAt),
  );

  for (const fill of ordered) {
    if (counted.has(fill.orderId) || seen.has(fill.orderId)) continue;

    const parsed = parseClientOid(fill.clientOid, prefix);
    if (!parsed) continue;

    const current = byId.get(parsed.thesisId);
    if (!current) continue;

    const peak = peaks.get(current.id) ?? Math.max(current.realizedPnlUsdt, 0);
    const next = applyFillToThesis(current, fill.realizedPnlUsdt, fill.closedAt, peak);

    peaks.set(current.id, Math.max(peak, next.realizedPnlUsdt));
    byId.set(current.id, next);
    seen.add(fill.orderId);
    applied += 1;
  }

  return { theses: theses.map((t) => byId.get(t.id) ?? t), applied };
}
