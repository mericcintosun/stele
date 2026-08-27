"use client";

import { pct, stamp, usdt, type Thesis } from "@/lib/data";
import { valveFor } from "@/lib/valve";

const STATE_STYLE: Record<string, string> = {
  active: "border-ok/40 bg-ok/10 text-ok",
  throttled: "border-warn/40 bg-warn/10 text-warn",
  halted: "border-bad/40 bg-bad/10 text-bad",
};

export default function ThesisLedger({
  theses,
  activeId,
  onSelect,
}: {
  theses: Thesis[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="rounded-xl border border-line bg-panel">
      <header className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">Thesis ledger</h2>
        <span className="text-[11px] text-mut">{theses.length} written before the round</span>
      </header>

      <ul className="divide-y divide-line">
        {theses.map((t) => {
          const valve = valveFor(t);
          const selected = t.id === activeId;
          const halted = valve.state === "halted";
          const quotaPct = Math.min(100, (t.quotaUsedUsdt / t.quotaUsdt) * 100);

          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onSelect(t.id)}
                className={`w-full px-4 py-3 text-left transition-colors ${
                  selected ? "bg-panel2" : "hover:bg-panel2/60"
                } ${halted ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-mut">{t.id}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATE_STYLE[valve.state]}`}
                  >
                    {valve.state}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-4 font-mono text-xs">
                  <span className={t.realizedPnlPct < 0 ? "text-bad" : "text-ok"}>
                    {pct(t.realizedPnlPct)}
                  </span>
                  <span className="text-mut">{usdt(t.realizedPnlUsdt)} USDT</span>
                  <span className="text-mut">
                    {t.wins}/{t.trades} closed
                  </span>
                  <span className="ml-auto text-mut">{valve.multiplier.toFixed(2)}x</span>
                </div>

                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className={`h-full ${halted ? "bg-bad" : valve.state === "throttled" ? "bg-warn" : "bg-acc"}`}
                    style={{ width: `${quotaPct}%` }}
                  />
                </div>

                {selected ? (
                  <div className="mt-3 space-y-2 border-t border-line pt-3">
                    <p className="text-xs leading-relaxed text-mut">{t.precondition}</p>
                    <p className="text-[11px] text-mut">
                      Quota {t.quotaUsedUsdt.toFixed(1)} / {t.quotaUsdt.toFixed(0)} USDT, max
                      drawdown {t.maxDrawdownPct.toFixed(1)}%, last traded {stamp(t.lastTradedAt)}.
                    </p>
                    <p className="text-[11px] leading-relaxed text-ink/80">{valve.reason}</p>
                  </div>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
