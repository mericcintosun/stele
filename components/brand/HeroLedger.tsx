"use client";

// Hero ürün önizlemesi, artık canlı: fareyle hafif 3D tilt, satırlar konsola
// tıklanabilir link, PnL barları yüklenince doluyor, HALTED satırı nabız
// atıyor. Sayılar konsolun gerçek seed verisi; kompozisyon dekor, içerik değil.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Barlar 0'dan hedefe dolsun; reduced-motion'da transition zaten kapalı
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
          <span className="font-mono text-[11px] text-mut">round 2 / 5</span>
        </div>

        <ul>
          {ROWS.map((r, i) => (
            <li key={r.id} className={i > 0 ? "border-t border-line" : ""}>
              <Link
                href="/console"
                title="Konsolda aç"
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
                      r.state === "HALTED"
                        ? "anim-glow border-bad/40 bg-bad/10 text-bad"
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
                    className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                      r.state === "HALTED" ? "bg-bad/70" : "bg-acc/80"
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
            TH-SQZ-LONG at -2.14% over 7 closed trades. Next matching signal gets size 0.00x:
            <span className="text-ink"> the agent refuses its own order</span> and posts the refusal.
          </p>
        </div>
      </div>
    </div>
  );
}
