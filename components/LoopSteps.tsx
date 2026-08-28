"use client";

// Loop artık görsel anlatıyor: her adımın Meshy üretimi taş-devre görseli
// panelin yarısını kaplar, metin TEK cümledir, altta mono iz satırı durur.
// İçerik iddiaları değişmedi, yalnızca yoğunluk düştü.

import Image from "next/image";
import { useState } from "react";

const STEPS = [
  {
    step: "01",
    title: "A written thesis",
    body: "Six named theses are written before the round; a signal that matches none of them never becomes an order.",
    trace: 'SIG-9104 matched TH-SQZ-LONG ("Crowded Short Squeeze")',
    img: "/brand/loop-thesis.png",
  },
  {
    step: "02",
    title: "Posted as evidence",
    body: "Every decision goes to uploadAiLog; the returned orderId pairs the fill with its thesis.",
    trace: 'POST /capi/v3/order/uploadAiLog -> {"code":"00000","orderId":1102938471}',
    img: "/brand/loop-endpoint.png",
  },
  {
    step: "03",
    title: "PnL writes back",
    body: "Closed PnL lands on the thesis that opened it; that ledger is all that carries between rounds.",
    trace: "POS-4459 closed: -4.0 USDT -> TH-SQZ-LONG -1.74% -> -2.14%",
    img: "/brand/loop-ledger.png",
  },
  {
    step: "04",
    title: "The valve decides",
    body: "A thesis under the halt line gets zero capital: the agent refuses its own order and posts the refusal.",
    trace: "TH-SQZ-LONG below -2.0% -> valve 0.00x -> order refused",
    img: "/brand/loop-valve.png",
  },
];

export default function LoopSteps() {
  const [active, setActive] = useState(0);
  const s = STEPS[active];

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="flex flex-col gap-1.5" role="tablist" aria-label="The loop, four steps">
        {STEPS.map((x, i) => (
          <button
            key={x.step}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc ${
              i === active
                ? "border-acc/50 bg-acc/10"
                : "border-line bg-panel hover:border-acc/30 hover:bg-panel2/60"
            }`}
          >
            <span className={`font-mono text-xs ${i === active ? "text-acc" : "text-mut"}`}>{x.step}</span>
            <span className={`text-sm font-medium ${i === active ? "text-ink" : "text-mut"}`}>{x.title}</span>
          </button>
        ))}
      </div>

      <div
        key={s.step}
        role="tabpanel"
        className="anim-fade-up overflow-hidden rounded-xl border border-line bg-panel"
      >
        <div className="grid items-center sm:grid-cols-[240px_minmax(0,1fr)]">
          <Image
            src={s.img}
            alt=""
            aria-hidden
            width={480}
            height={480}
            className="h-48 w-full object-cover sm:h-full sm:min-h-[240px]"
          />
          <div className="p-6">
            <p className="font-mono text-xs text-acc">{s.step}</p>
            <h3 className="mt-1.5 text-lg font-semibold text-ink">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mut">{s.body}</p>
            <p className="mt-4 overflow-x-auto rounded-lg border border-line bg-panel2 px-3 py-2 font-mono text-[11px] leading-relaxed text-acc/90">
              {s.trace}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
