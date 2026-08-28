"use client";

// "The loop, four steps" artık interaktif bir stepper: solda tıklanabilir
// adımlar, sağda seçilen adımın anlatımı ve o adıma ait mono iz satırı.
// İçerik page.tsx'teki statik kartlarla aynı iddialar; hiçbir claim değişmedi.

import { useState } from "react";

const STEPS = [
  {
    step: "01",
    title: "Every order belongs to a written thesis",
    body: "Six theses, each with a name and an entry condition written before the round starts. A signal that matches none of them never becomes an order.",
    trace: 'signal SIG-9104 matched thesis TH-SQZ-LONG ("Crowded Short Squeeze")',
  },
  {
    step: "02",
    title: "The same decision goes to the compliance endpoint",
    body: "stage, model, input, output and a 1000 character explanation are posted to /capi/v3/order/uploadAiLog. The returned orderId pairs the fill with the thesis.",
    trace: 'POST /capi/v3/order/uploadAiLog -> {"code":"00000","orderId":1102938471}',
  },
  {
    step: "03",
    title: "Closed PnL is written back to the thesis",
    body: "When a position closes, its realized result lands on the thesis that opened it. Press Close at stop on the console and watch one thesis change state. That ledger is the only thing carried from round to round.",
    trace: "POS-4459 closed: -4.0 USDT -> TH-SQZ-LONG ledger -1.74% -> -2.14%",
  },
  {
    step: "04",
    title: "The next order is sized from that ledger",
    body: "Not from total account performance. A thesis under the halt line goes to zero capital and the agent refuses its own order, then posts the refusal too.",
    trace: "TH-SQZ-LONG below halt line -2.0% -> valve 0.00x -> order refused, refusal posted",
  },
];

export default function LoopSteps() {
  const [active, setActive] = useState(0);
  const s = STEPS[active];

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
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
        className="anim-fade-up rounded-xl border border-line bg-panel p-6"
        role="tabpanel"
      >
        <p className="font-mono text-xs text-acc">{s.step}</p>
        <h3 className="mt-2 text-lg font-semibold text-ink">{s.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-mut">{s.body}</p>
        <p className="mt-4 overflow-x-auto rounded-lg border border-line bg-panel2 px-3 py-2 font-mono text-[11px] leading-relaxed text-acc/90">
          {s.trace}
        </p>
      </div>
    </div>
  );
}
