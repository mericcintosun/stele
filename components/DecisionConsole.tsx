"use client";

// The decision console.
//
// Since Phase 3 this component holds no round state of its own. It holds one
// RoundView, and that view only ever arrives from the server: the first frame
// is server rendered in app/console/page.tsx, and after that it comes back from
// POST /api/decide, POST /api/reset or GET /api/round. There is no useEffect
// fetch on mount and no arithmetic here that moves a ledger, spends a quota or
// invents a position. Everything on screen is what the store says.
//
// The reason is step 5 of DEMO.md: the refusal has to still be there after a
// hard refresh. Anything this component computed for itself would not be.

import { useState } from "react";
import {
  ConsoleErrorState,
  ConsoleSkeleton,
  SignalQueueEmptyState,
} from "@/components/ConsoleStates";
import DecisionLog from "@/components/DecisionLog";
import ThesisLedger from "@/components/ThesisLedger";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { SteleError, SteleErrorCode } from "@/lib/errors";
import { pct, stamp, usdt } from "@/lib/format";
import type { ApiResponse, Decision, Position, RoundView, Signal, Thesis } from "@/lib/types";
import { valveFor } from "@/lib/valve";

interface Props {
  /** The round as the server rendered it. The console never reads a seed literal. */
  initial: RoundView;
}

interface RoundPayload {
  round: RoundView;
  wiring: { modelPath: Decision["source"] | null; persistence: "kv" | "memory" };
}

/** What POST /api/attribute answers with when a position is closed. */
interface AttributePayload {
  thesis: Thesis | null;
  realizedUsdt: number;
  round: RoundView;
  replayed: boolean;
}

/**
 * One line per failure code. The console switches on the code the route sends,
 * never on message text, so server wording can change without breaking the UI.
 */
const ERROR_COPY: Record<SteleErrorCode, string> = {
  invalid_input: "The server does not have that signal. Reload the round and try again.",
  unknown_thesis: "That signal is not bound to a written thesis, so no order can exist.",
  parse_failure: "The model answer could not be read. Nothing was sent to the exchange.",
  not_configured: "This deployment has no WEEX credentials configured.",
  store_unavailable: "The round store did not answer. Nothing was written and nothing was sent.",
  upstream_timeout: "WEEX did not answer in time. Nothing was sent.",
  upstream_error: "WEEX refused the request. Nothing was sent.",
  internal: "The decision loop failed before it reached the exchange.",
};

/** The verdict pill, drawn by components/ui/badge.tsx. Same three colors. */
const VERDICT_VARIANT: Record<Decision["verdict"], BadgeVariant> = {
  approved: "accent",
  reduced: "warn",
  rejected: "bad",
};

const VERDICT_LABEL: Record<Decision["verdict"], string> = {
  approved: "ORDER SENT",
  reduced: "SIZE CUT",
  rejected: "REFUSED",
};

const SOURCE_LABEL: Record<Decision["source"], string> = {
  anthropic: "Anthropic API",
  "claude-cli": "local claude CLI",
  mock: "offline stub",
};

/** Thousand separators without touching the browser locale, so SSR and hydration agree. */
function price(n: number): string {
  const [whole, frac] = n.toFixed(2).split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${frac}`;
}

export default function DecisionConsole({ initial }: Props) {
  const [round, setRound] = useState<RoundView>(initial);
  const [selectedThesis, setSelectedThesis] = useState<string | null>("TH-SQZ-LONG");
  const [pending, setPending] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modelPath = round.decisions[0]?.source ?? null;
  const queue = round.signals.filter((s) => !round.handledSignalIds.includes(s.id));

  function applyFailure(payload: SteleError) {
    setError(ERROR_COPY[payload.error] ?? payload.hint);
  }

  /** The one refresh path. Both the retry button and a manual reload come here. */
  async function refresh() {
    setReloading(true);
    setError(null);
    try {
      const res = await fetch("/api/round", { cache: "no-store" });
      const payload = (await res.json()) as ApiResponse<RoundPayload>;
      if (!payload.ok) {
        applyFailure(payload);
        return;
      }
      setRound(payload.data.round);
    } catch {
      setError("The round could not be read. The server did not answer.");
    } finally {
      setReloading(false);
    }
  }

  async function evaluate(signal: Signal) {
    setPending(signal.id);
    setError(null);
    setSelectedThesis(signal.thesisId);

    try {
      const res = await fetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Signal plus the round state it was decided against. A double click
        // sends the same key twice and the second one replays the stored
        // decision instead of placing a second order.
        body: JSON.stringify({
          signalId: signal.id,
          idempotencyKey: `${signal.id}-${round.updatedAt}`,
        }),
      });
      const payload = (await res.json()) as ApiResponse<{ decision: Decision; round: RoundView }>;

      if (!payload.ok) {
        applyFailure(payload);
        return;
      }

      // The whole round comes back from the store: the ledger with its quota
      // already spent, the new position, the decision and its uploadAiLog
      // record. Nothing is reconstructed here.
      setRound(payload.data.round);
    } catch {
      // Network level only. Everything the server can explain arrives as a code.
      setError("The decision loop could not be reached. Nothing was sent.");
    } finally {
      setPending(null);
    }
  }

  /**
   * Close one open position at its resting stop loss and hand the realized loss
   * back to the thesis that opened it.
   *
   * This is the other half of the loop. Running a signal spends a thesis's
   * quota; this is where the money comes back and changes what the valve will
   * allow next. The arithmetic runs on the server in POST /api/attribute, for
   * the same reason every other write does: the round is server state, so the
   * ledger has to still read the new number after a refresh. Nothing here
   * recomputes a percentage, and nothing here decides a badge. The thesis rows
   * come back from the store and ThesisLedger derives the badge from valveFor().
   */
  async function closeAtStop(p: Position) {
    setPending(p.id);
    setError(null);
    setSelectedThesis(p.thesisId);

    try {
      const res = await fetch("/api/attribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Same guard as a decision: a double click must not pay the same closed
        // trade onto the ledger twice.
        body: JSON.stringify({
          positionId: p.id,
          exitPrice: p.stopLoss,
          idempotencyKey: `close-${p.id}-${round.updatedAt}`,
        }),
      });
      const payload = (await res.json()) as ApiResponse<AttributePayload>;

      if (!payload.ok) {
        applyFailure(payload);
        return;
      }

      setRound(payload.data.round);
    } catch {
      setError("The position could not be closed. Nothing was written to the ledger.");
    } finally {
      setPending(null);
    }
  }

  /** Back to the opening frame, server side, so the take can be retaken. */
  async function reset() {
    setPending("reset");
    setReloading(true);
    setError(null);
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const payload = (await res.json()) as ApiResponse<RoundPayload>;
      if (!payload.ok) {
        applyFailure(payload);
        return;
      }
      setRound(payload.data.round);
      setSelectedThesis("TH-SQZ-LONG");
    } catch {
      setError("The round could not be reset. The server did not answer.");
    } finally {
      setPending(null);
      setReloading(false);
    }
  }

  // The reset round trip is the only moment the console has no trustworthy
  // round to draw, so it is the only moment the skeleton shows.
  if (reloading && pending === "reset") return <ConsoleSkeleton />;

  return (
    <div className="space-y-4">
      {/* Account strip */}
      <Card
        as="div"
        className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 font-mono text-xs"
      >
        <span className="text-mut">
          UID <span className="text-ink">{round.account.uid}</span>
        </span>
        <span className="text-mut">
          Side <span className="text-acc">{round.account.side}</span>
        </span>
        <span className="text-mut">
          Round{" "}
          <span className="text-ink">
            {round.account.round} / {round.account.totalRounds}
          </span>
        </span>
        <span className="text-mut">
          Equity <span className="text-ink">{round.account.equityUsdt.toFixed(2)} USDT</span>
        </span>
        <span className="text-mut">
          Free <span className="text-ink">{round.account.availableUsdt.toFixed(2)} USDT</span>
        </span>
        <span className="text-mut">
          Queue{" "}
          <span className={round.queueDepth > 0 ? "text-warn" : "text-ok"}>
            {round.queueDepth > 0
              ? `${round.queueDepth} queued for allowlist`
              : "all receipts accepted"}
          </span>
        </span>
        <span className="ml-auto text-mut">
          Model path{" "}
          <span className="text-ink">{modelPath ? SOURCE_LABEL[modelPath] : "idle"}</span>
        </span>
        <Button variant="outline" size="sm" onClick={reset} disabled={pending !== null}>
          Reset round
        </Button>
      </Card>

      {/* Market strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        {round.markets.map((m) => (
          <Card as="div" key={m.symbol} className="px-4 py-3">
            <p className="font-mono text-[11px] text-mut">{m.symbol}</p>
            <p className="mt-1 font-mono text-xl tabular-nums">{price(m.lastPrice)}</p>
            <div className="mt-1 flex flex-wrap gap-x-3 font-mono text-[11px]">
              <span className={m.change24hPct < 0 ? "text-bad" : "text-ok"}>
                {pct(m.change24hPct)} 24h
              </span>
              <span className={m.fundingRatePct < 0 ? "text-warn" : "text-mut"}>
                fund {m.fundingRatePct.toFixed(4)}%
              </span>
              <span className="text-mut">OI {pct(m.oiChange1hPct, 1)}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,380px)]">
        <ThesisLedger theses={round.theses} activeId={selectedThesis} onSelect={setSelectedThesis} />

        {/* Center: signal queue and the decision stream */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Signal queue</CardTitle>
              <span className="text-[11px] text-mut">{queue.length} waiting</span>
            </CardHeader>

            {queue.length === 0 ? (
              <SignalQueueEmptyState onReset={reset} busy={pending !== null} />
            ) : (
              <ul className="divide-y divide-line">
                {queue.map((s) => {
                  const t = round.theses.find((x) => x.id === s.thesisId);
                  const valve = t ? valveFor(t) : null;
                  return (
                    <li key={s.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-mut">
                        <span>{s.id}</span>
                        <span>{s.symbol}</span>
                        <span className="uppercase">{s.suggestedSide}</span>
                        <span className="ml-auto" title={s.thesisId}>
                          {s.thesisId}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed">{s.headline}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => evaluate(s)}
                          disabled={pending !== null}
                        >
                          {pending === s.id ? "Running the loop…" : "Run decision loop"}
                        </Button>
                        {valve ? (
                          <span className="font-mono text-[11px] text-mut">
                            valve {valve.multiplier.toFixed(2)}x, {valve.state}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {error ? (
            <ConsoleErrorState message={error} onRetry={refresh} busy={reloading} />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Decisions this round</CardTitle>
            </CardHeader>

            {round.decisions.length === 0 ? (
              <div className="space-y-2 px-4 py-6">
                <p className="text-sm leading-relaxed text-mut">
                  Nothing yet. Run the SOL signal first: its thesis ledger is under water, so the
                  valve refuses the agent&apos;s own order and writes the refusal to WEEX.
                </p>
                <p className="font-mono text-[11px] text-mut">
                  POST /api/decide, then the verdict pill lands here
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {round.decisions.map((d, i) => (
                  <li key={`${d.signalId}-${i}`} className="space-y-2 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={VERDICT_VARIANT[d.verdict]}>
                        {VERDICT_LABEL[d.verdict]}
                      </Badge>
                      <span className="font-mono text-[11px] text-mut">
                        {d.symbol} {d.side} · {d.thesisId} · valve {d.sizeMultiplier.toFixed(2)}x
                      </span>
                      <span className="ml-auto font-mono text-[11px] text-mut">
                        {SOURCE_LABEL[d.source]}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-ink/85">{d.reason}</p>

                    {d.verdict === "rejected" ? (
                      <p className="rounded border border-bad/30 bg-bad/5 px-2 py-1.5 font-mono text-[11px] text-bad">
                        0.00 USDT deployed. No order sent to the exchange. The refusal itself was
                        written to uploadAiLog.
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded border border-line bg-panel2 px-2 py-1.5 font-mono text-[11px]">
                          <p className="text-mut">shadow fill (sim)</p>
                          <p className="break-all text-ink">
                            {d.shadowFill
                              ? `${d.shadowFill.price.toFixed(2)} · ${d.shadowFill.orderId}`
                              : "not run"}
                          </p>
                        </div>
                        <div className="rounded border border-line bg-panel2 px-2 py-1.5 font-mono text-[11px]">
                          <p className="text-mut">live fill</p>
                          <p className="break-all text-ink">
                            {d.liveFill
                              ? `${d.liveFill.price.toFixed(2)} · ${d.liveFill.orderId}`
                              : "not run"}
                          </p>
                        </div>
                        <div className="rounded border border-line bg-panel2 px-2 py-1.5 font-mono text-[11px] sm:col-span-2">
                          <span className="text-mut">notional</span>{" "}
                          <span className="text-ink">{d.notionalUsdt.toFixed(2)} USDT</span>
                          <span className="ml-3 text-mut">TP</span>{" "}
                          <span className="text-ok">{d.takeProfit.toFixed(2)}</span>
                          <span className="ml-3 text-mut">SL</span>{" "}
                          <span className="text-bad">{d.stopLoss.toFixed(2)}</span>
                          <span className="ml-3 text-mut">exchange side</span>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open positions</CardTitle>
              <span className="text-[11px] text-mut">
                every entry carries exchange-side TP/SL. Closing one writes its result back to its
                thesis.
              </span>
            </CardHeader>

            {round.positions.length === 0 ? (
              <div className="space-y-2 px-4 py-6">
                <p className="text-sm leading-relaxed text-mut">
                  Nothing open. Every position this round has been closed and its result written
                  back to the thesis that opened it. Run a signal above to open another one, or
                  press Reset round to start the sequence again.
                </p>
                <p className="font-mono text-[11px] text-mut">
                  POST /api/attribute wrote the last close back to its thesis
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[48rem] text-left font-mono text-[11px]">
                  <thead className="text-mut">
                    <tr className="border-b border-line">
                      <th className="px-4 py-2 font-normal">position</th>
                      <th className="px-4 py-2 font-normal">thesis</th>
                      <th className="px-4 py-2 font-normal">entry</th>
                      <th className="px-4 py-2 font-normal">TP</th>
                      <th className="px-4 py-2 font-normal">SL</th>
                      <th className="px-4 py-2 font-normal">uPnL</th>
                      <th className="px-4 py-2 font-normal">opened</th>
                      <th className="px-4 py-2 font-normal">attribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {round.positions.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2" title={p.id}>
                          <span className="text-ink">{p.symbol}</span>{" "}
                          <span className={p.side === "long" ? "text-ok" : "text-bad"}>
                            {p.side}
                          </span>{" "}
                          <span className="text-mut">{p.leverage}x</span>
                        </td>
                        <td className="px-4 py-2 text-mut" title={p.thesisId}>
                          {p.thesisId}
                        </td>
                        <td className="px-4 py-2 text-ink">{p.entryPrice.toFixed(2)}</td>
                        <td className="px-4 py-2 text-ok">{p.takeProfit.toFixed(2)}</td>
                        <td className="px-4 py-2 text-bad">{p.stopLoss.toFixed(2)}</td>
                        <td
                          className={`px-4 py-2 ${p.unrealizedPnlUsdt < 0 ? "text-bad" : "text-ok"}`}
                        >
                          {usdt(p.unrealizedPnlUsdt)}
                        </td>
                        <td className="px-4 py-2 text-mut">{stamp(p.openedAt)}</td>
                        <td className="px-4 py-2">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => closeAtStop(p)}
                            disabled={pending !== null}
                            title={`Close ${p.id} at ${p.stopLoss.toFixed(2)} and write the result back to ${p.thesisId}`}
                          >
                            {pending === p.id ? "Closing…" : "Close at stop"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <DecisionLog logs={round.logs} queueDepth={round.queueDepth} />
      </div>
    </div>
  );
}
