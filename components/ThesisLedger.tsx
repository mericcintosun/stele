"use client";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { pct, stamp, usdt } from "@/lib/format";
import type { Thesis } from "@/lib/types";
import { valveFor } from "@/lib/valve";

/** The valve state pill. Same three colors the old STATE_STYLE map carried. */
const STATE_VARIANT: Record<string, BadgeVariant> = {
  active: "ok",
  throttled: "warn",
  halted: "bad",
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
    <Card>
      <CardHeader>
        <CardTitle>Thesis ledger</CardTitle>
        <span className="text-[11px] text-mut">{theses.length} written before the round</span>
      </CardHeader>

      <ul className="divide-y divide-line">
        {theses.map((t) => {
          const valve = valveFor(t);
          const selected = t.id === activeId;
          const halted = valve.state === "halted";
          const quotaPct = Math.min(100, (t.quotaUsedUsdt / t.quotaUsdt) * 100);

          return (
            <li key={t.id}>
              {/* The one bare button left outside components/ui: a full width
                  ledger row, not a control with a label. Its classes go through
                  cn() and it carries the same focus ring the Button primitive
                  does. */}
              <button
                type="button"
                onClick={() => onSelect(t.id)}
                aria-pressed={selected}
                className={cn(
                  "min-h-11 w-full px-4 py-3 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc focus-visible:ring-inset",
                  selected ? "bg-panel2" : "hover:bg-panel2/60",
                  halted && "opacity-60",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" title={t.name}>
                      {t.name}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-mut" title={t.id}>
                      {t.id}
                    </p>
                  </div>
                  <Badge
                    variant={STATE_VARIANT[valve.state] ?? "neutral"}
                    shape="pill"
                    className="uppercase"
                  >
                    {valve.state}
                  </Badge>
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
                    className={cn(
                      "h-full",
                      halted ? "bg-bad" : valve.state === "throttled" ? "bg-warn" : "bg-acc",
                    )}
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
    </Card>
  );
}
