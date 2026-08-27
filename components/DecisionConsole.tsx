"use client";

import { useState } from "react";
import DecisionLog from "@/components/DecisionLog";
import ThesisLedger from "@/components/ThesisLedger";
import { pct, stamp, usdt } from "@/lib/format";
import type {
  AiLogRecord,
  ApiResponse,
  ConsoleSnapshot,
  Decision,
  MarketRow,
  Position,
  Signal,
  Thesis,
} from "@/lib/types";
import { valveFor } from "@/lib/valve";

interface Props {
  /** Comes from getAdapter().snapshot(). The console never reads a seed literal. */
  account: ConsoleSnapshot["account"];
  theses: Thesis[];
  positions: Position[];
  markets: MarketRow[];
  signals: Signal[];
  logs: AiLogRecord[];
}

const VERDICT_STYLE: Record<Decision["verdict"], string> = {
  approved: "border-acc/50 bg-acc/10 text-acc",
  reduced: "border-warn/50 bg-warn/10 text-warn",
  rejected: "border-bad/50 bg-bad/10 text-bad",
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

export default function DecisionConsole(props: Props) {
  const [theses, setTheses] = useState<Thesis[]>(props.theses);
  const [positions, setPositions] = useState<Position[]>(props.positions);
  const [logs, setLogs] = useState<AiLogRecord[]>(props.logs);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [handled, setHandled] = useState<string[]>([]);
  const [selectedThesis, setSelectedThesis] = useState<string | null>("TH-SQZ-LONG");
  const [pending, setPending] = useState<string | null>(null);
  const [modelPath, setModelPath] = useState<Decision["source"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function evaluate(signal: Signal) {
    setPending(signal.id);
    setError(null);
    setSelectedThesis(signal.thesisId);

    try {
      const res = await fetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalId: signal.id }),
      });
      const payload = (await res.json()) as ApiResponse<{
        decision: Decision;
        wiring: { modelPath: Decision["source"] };
      }>;

      if (!payload.ok) throw new Error(payload.error);
      if (!res.ok) throw new Error(`decide failed with ${res.status}`);

      const d = payload.data.decision;

      setDecisions((prev) => [d, ...prev]);
      setLogs((prev) => [d.aiLog, ...prev]);
      setHandled((prev) => [...prev, signal.id]);
      setModelPath(payload.data.wiring.modelPath);

      // The ledger is the memory. Spending quota is the only thing an accepted
      // order changes until the position closes and PnL is written back.
      setTheses((prev) =>
        prev.map((t) =>
          t.id === d.thesisId
            ? { ...t, quotaUsedUsdt: Math.round((t.quotaUsedUsdt + d.notionalUsdt) * 10) / 10 }
            : t,
        ),
      );

      if (d.verdict !== "rejected" && d.liveFill) {
        setPositions((prev) => [
          {
            id: `POS-${d.liveFill!.orderId.slice(-4)}`,
            symbol: d.symbol,
            side: d.side,
            thesisId: d.thesisId,
            entryPrice: d.liveFill!.price,
            markPrice: d.liveFill!.price,
            sizeContracts: Math.round((d.notionalUsdt / d.entryPrice) * 10_000) / 10_000,
            notionalUsdt: d.notionalUsdt,
            leverage: 5,
            takeProfit: d.takeProfit,
            stopLoss: d.stopLoss,
            unrealizedPnlUsdt: 0,
            openedAt: d.liveFill!.filledAt,
          },
          ...prev,
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "decision failed");
    } finally {
      setPending(null);
    }
  }

  function reset() {
    setTheses(props.theses);
    setPositions(props.positions);
    setLogs(props.logs);
    setDecisions([]);
    setHandled([]);
    setModelPath(null);
    setError(null);
  }

  const queue = props.signals.filter((s) => !handled.includes(s.id));

  return (
    <div className="space-y-4">
      {/* Account strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-panel px-4 py-3 font-mono text-xs">
        <span className="text-mut">
          UID <span className="text-ink">{props.account.uid}</span>
        </span>
        <span className="text-mut">
          Side <span className="text-acc">{props.account.side}</span>
        </span>
        <span className="text-mut">
          Round{" "}
          <span className="text-ink">
            {props.account.round} / {props.account.totalRounds}
          </span>
        </span>
        <span className="text-mut">
          Equity <span className="text-ink">{props.account.equityUsdt.toFixed(2)} USDT</span>
        </span>
        <span className="text-mut">
          Free <span className="text-ink">{props.account.availableUsdt.toFixed(2)} USDT</span>
        </span>
        <span className="ml-auto text-mut">
          Model path{" "}
          <span className="text-ink">{modelPath ? SOURCE_LABEL[modelPath] : "idle"}</span>
        </span>
        <button
          type="button"
          onClick={reset}
          className="rounded border border-line px-2 py-1 text-[11px] text-mut transition-colors hover:border-acc/50 hover:text-acc"
        >
          Reset round
        </button>
      </div>

      {/* Market strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        {props.markets.map((m) => (
          <div key={m.symbol} className="rounded-xl border border-line bg-panel px-4 py-3">
            <p className="font-mono text-[11px] text-mut">{m.symbol}</p>
            <p className="mt-1 font-mono text-xl tabular-nums">{price(m.lastPrice)}</p>
            <div className="mt-1 flex gap-3 font-mono text-[11px]">
              <span className={m.change24hPct < 0 ? "text-bad" : "text-ok"}>
                {pct(m.change24hPct)} 24h
              </span>
              <span className={m.fundingRatePct < 0 ? "text-warn" : "text-mut"}>
                fund {m.fundingRatePct.toFixed(4)}%
              </span>
              <span className="text-mut">OI {pct(m.oiChange1hPct, 1)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,380px)]">
        <ThesisLedger theses={theses} activeId={selectedThesis} onSelect={setSelectedThesis} />

        {/* Center: signal queue and the decision stream */}
        <div className="space-y-4">
          <section className="rounded-xl border border-line bg-panel">
            <header className="flex items-baseline justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold tracking-tight">Signal queue</h2>
              <span className="text-[11px] text-mut">{queue.length} waiting</span>
            </header>

            {queue.length === 0 ? (
              <p className="px-4 py-6 text-sm text-mut">
                Queue drained. Reset the round to run the sequence again.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {queue.map((s) => {
                  const t = theses.find((x) => x.id === s.thesisId);
                  const valve = t ? valveFor(t) : null;
                  return (
                    <li key={s.id} className="px-4 py-3">
                      <div className="flex items-center gap-2 font-mono text-[11px] text-mut">
                        <span>{s.id}</span>
                        <span>{s.symbol}</span>
                        <span className="uppercase">{s.suggestedSide}</span>
                        <span className="ml-auto">{s.thesisId}</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed">{s.headline}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => evaluate(s)}
                          disabled={pending !== null}
                          className="rounded-lg bg-acc px-3 py-1.5 text-xs font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
                        >
                          {pending === s.id ? "Running the loop…" : "Run decision loop"}
                        </button>
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
          </section>

          {error ? (
            <p className="rounded-lg border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
              {error}
            </p>
          ) : null}

          <section className="rounded-xl border border-line bg-panel">
            <header className="border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold tracking-tight">Decisions this session</h2>
            </header>

            {decisions.length === 0 ? (
              <p className="px-4 py-6 text-sm text-mut">
                Nothing yet. Run the SOL signal first: its thesis ledger is under water, so the
                valve refuses the agent&apos;s own order and writes the refusal to WEEX.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {decisions.map((d, i) => (
                  <li key={`${d.signalId}-${i}`} className="space-y-2 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide ${VERDICT_STYLE[d.verdict]}`}
                      >
                        {VERDICT_LABEL[d.verdict]}
                      </span>
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
                          <p className="text-ink">
                            {d.shadowFill
                              ? `${d.shadowFill.price.toFixed(2)} · ${d.shadowFill.orderId}`
                              : "not run"}
                          </p>
                        </div>
                        <div className="rounded border border-line bg-panel2 px-2 py-1.5 font-mono text-[11px]">
                          <p className="text-mut">live fill</p>
                          <p className="text-ink">
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
          </section>

          <section className="rounded-xl border border-line bg-panel">
            <header className="flex items-baseline justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold tracking-tight">Open positions</h2>
              <span className="text-[11px] text-mut">every entry carries exchange-side TP/SL</span>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left font-mono text-[11px]">
                <thead className="text-mut">
                  <tr className="border-b border-line">
                    <th className="px-4 py-2 font-normal">position</th>
                    <th className="px-4 py-2 font-normal">thesis</th>
                    <th className="px-4 py-2 font-normal">entry</th>
                    <th className="px-4 py-2 font-normal">TP</th>
                    <th className="px-4 py-2 font-normal">SL</th>
                    <th className="px-4 py-2 font-normal">uPnL</th>
                    <th className="px-4 py-2 font-normal">opened</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {positions.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2">
                        <span className="text-ink">{p.symbol}</span>{" "}
                        <span className={p.side === "long" ? "text-ok" : "text-bad"}>{p.side}</span>{" "}
                        <span className="text-mut">{p.leverage}x</span>
                      </td>
                      <td className="px-4 py-2 text-mut">{p.thesisId}</td>
                      <td className="px-4 py-2 text-ink">{p.entryPrice.toFixed(2)}</td>
                      <td className="px-4 py-2 text-ok">{p.takeProfit.toFixed(2)}</td>
                      <td className="px-4 py-2 text-bad">{p.stopLoss.toFixed(2)}</td>
                      <td
                        className={`px-4 py-2 ${p.unrealizedPnlUsdt < 0 ? "text-bad" : "text-ok"}`}
                      >
                        {usdt(p.unrealizedPnlUsdt)}
                      </td>
                      <td className="px-4 py-2 text-mut">{stamp(p.openedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <DecisionLog logs={logs} />
      </div>
    </div>
  );
}
