"use client";

// The hero product preview, and it is live: a slight 3D tilt on mouse move, rows
// that link into the console, PnL bars that fill on mount, a pulsing HALTED row.
//
// The numbers are not written here. Every figure is read from lib/data/seed.ts,
// the same rows /console renders, and sized by valveFor() in lib/valve.ts, so
// the hero cannot drift from the console when the seed changes. The composition
// is decoration; the content is data.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { account, thesisById } from "@/lib/data/seed";
import { pct, usdt } from "@/lib/format";
import { valveFor } from "@/lib/valve";

// The three theses the hero shows, in this order: one at full size, one at base
// size, one past the halt line. `bar` is presentational only, a fixed share of
// the card width per row. It is not a figure from the seed and nothing reads it
// as data.
const SHOWN = [
  { id: "TH-OI-BREAK", bar: 62 },
  { id: "TH-BASIS-REV", bar: 40 },
  { id: "TH-SQZ-LONG", bar: 34 },
];

interface Row {
  id: string;
  name: string;
  trades: number;
  pct: string;
  negative: boolean;
  usdt: string;
  closed: string;
  valve: string;
  state: string;
  halted: boolean;
  throttled: boolean;
  bar: number;
}

// flatMap rather than map, so a thesis id that no longer exists in the seed
// drops its row instead of rendering `undefined` into the card.
const ROWS: Row[] = SHOWN.flatMap(({ id, bar }) => {
  const t = thesisById(id);
  if (!t) return [];
  const v = valveFor(t);
  return [
    {
      id: t.id,
      name: t.name,
      trades: t.trades,
      pct: pct(t.realizedPnlPct),
      negative: t.realizedPnlPct < 0,
      usdt: `${usdt(t.realizedPnlUsdt)} USDT`,
      closed: `${t.wins}/${t.trades} closed`,
      valve: `${v.multiplier.toFixed(2)}x`,
      state: v.state.toUpperCase(),
      halted: v.state === "halted",
      throttled: v.state === "throttled",
      bar,
    },
  ];
});

const HALTED = ROWS.find((r) => r.halted);

export default function HeroLedger() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Let the bars fill from 0 to their target. Under reduced motion the
    // transition is already switched off in globals.css.
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  function onMove(e: React.MouseEvent) {
    const el = wrapRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: py * -5, y: px * 6 });
  }

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{ perspective: "1100px" }}
      className="relative"
    >
      <div
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        className="relative rounded-2xl border border-line bg-panel shadow-[0_24px_80px_-32px_rgba(94,234,212,0.28)] transition-transform duration-200 ease-out"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-sm font-semibold">Thesis ledger</span>
          <span className="font-mono text-[11px] text-mut">
            round {account.round} / {account.totalRounds}
          </span>
        </div>

        <ul>
          {ROWS.map((r, i) => (
            <li key={r.id} className={i > 0 ? "border-t border-line" : ""}>
              <Link
                href="/console"
                title="Open in the console"
                className="group block px-4 py-3 transition-colors hover:bg-panel2/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink transition-transform duration-200 group-hover:translate-x-0.5">
                      {r.name}
                      <span className="ml-2 inline-block translate-x-[-4px] text-xs text-acc opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                        →
                      </span>
                    </p>
                    <p className="font-mono text-[11px] text-mut">{r.id}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] ${
                      r.halted
                        ? "anim-glow border-bad/40 bg-bad/10 text-bad"
                        : r.throttled
                          ? "border-warn/40 bg-warn/10 text-warn"
                          : "border-ok/40 bg-ok/10 text-ok"
                    }`}
                  >
                    {r.state}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3 font-mono text-xs">
                  <span className={r.negative ? "text-bad" : "text-ok"}>{r.pct}</span>
                  <span className="text-mut">{r.usdt}</span>
                  <span className="text-mut">{r.closed}</span>
                  <span className="ml-auto text-mut">valve {r.valve}</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-panel2">
                  <div
                    className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                      r.halted ? "bg-bad/70" : "bg-acc/80"
                    }`}
                    style={{ width: mounted ? `${r.bar}%` : "0%", transitionDelay: `${i * 140}ms` }}
                  />
                </div>
              </Link>
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
          <p className="anim-caret mt-2 font-mono text-[11px] leading-relaxed text-mut">
            {HALTED ? (
              <>
                {HALTED.id} at {HALTED.pct} over {HALTED.trades} closed trades. Next matching signal
                gets size 0.00x:
                <span className="text-ink"> the agent refuses its own order</span> and posts the
                refusal.
              </>
            ) : (
              <>
                Every decision is posted to this endpoint, refusals included:
                <span className="text-ink"> the receipt is the ledger</span> that sizes the next
                order.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
