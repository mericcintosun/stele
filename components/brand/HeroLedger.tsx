// Hero product preview: the thesis ledger, rendered with the exact seed
// numbers the console shows. Decorative composition, truthful content; a
// stranger reads the mechanism (per-thesis PnL, a halted line at the bottom)
// before scrolling.

const ROWS = [
  {
    name: "Open Interest Breakout",
    id: "TH-OI-BREAK",
    pct: "+3.21%",
    usdt: "+38.60 USDT",
    closed: "7/11 closed",
    valve: "1.25x",
    state: "ACTIVE" as const,
    bar: 62,
  },
  {
    name: "Basis Reversion",
    id: "TH-BASIS-REV",
    pct: "+1.62%",
    usdt: "+17.90 USDT",
    closed: "6/9 closed",
    valve: "1.00x",
    state: "ACTIVE" as const,
    bar: 40,
  },
  {
    name: "Crowded Short Squeeze",
    id: "TH-SQZ-LONG",
    pct: "-2.14%",
    usdt: "-21.40 USDT",
    closed: "3/7 closed",
    valve: "0.00x",
    state: "HALTED" as const,
    bar: 34,
  },
];

export default function HeroLedger() {
  return (
    <div className="relative" aria-hidden="true">
      {/* Arka katman: derinlik için ikinci bir kart silueti */}
      <div className="absolute -right-3 -top-3 h-full w-full rounded-2xl border border-line/60 bg-panel/40" />

      <div className="relative rounded-2xl border border-line bg-panel shadow-[0_24px_80px_-32px_rgba(94,234,212,0.25)]">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-sm font-semibold">Thesis ledger</span>
          <span className="font-mono text-[11px] text-mut">round 2 / 5</span>
        </div>

        <ul className="divide-y divide-line">
          {ROWS.map((r) => (
            <li key={r.id} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{r.name}</p>
                  <p className="font-mono text-[11px] text-mut">{r.id}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] ${
                    r.state === "HALTED"
                      ? "border-bad/40 bg-bad/10 text-bad"
                      : "border-ok/40 bg-ok/10 text-ok"
                  }`}
                >
                  {r.state}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3 font-mono text-xs">
                <span className={r.pct.startsWith("-") ? "text-bad" : "text-ok"}>{r.pct}</span>
                <span className="text-mut">{r.usdt}</span>
                <span className="text-mut">{r.closed}</span>
                <span className="ml-auto text-mut">valve {r.valve}</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-panel2">
                <div
                  className={`h-full rounded-full ${r.state === "HALTED" ? "bg-bad/70" : "bg-acc/80"}`}
                  style={{ width: `${r.bar}%` }}
                />
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded border border-acc/40 bg-acc/10 px-1.5 py-0.5 font-mono text-[10px] text-acc">
              ATTRIBUTION
            </span>
            <span className="font-mono text-[11px] text-mut">POST /capi/v3/order/uploadAiLog</span>
          </div>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-mut">
            TH-SQZ-LONG at -2.14% over 7 closed trades. Next matching signal gets size 0.00x:
            <span className="text-ink"> the agent refuses its own order</span> and posts the refusal.
          </p>
        </div>
      </div>
    </div>
  );
}
