// /
//
// The landing page. It has one job: get a stranger to DEMO.md step 4, which is
// the agent refusing its own order. So there is exactly one primary action in
// the hero, it points at /console, and everything else on the page is a
// secondary link.
//
// Every factual sentence here is a verified competition claim or a statement
// about a file in this repo. The layout changed in Phase 8; the claims did not.

import Image from "next/image";
import Link from "next/link";
import LedgerPattern from "@/components/brand/LedgerPattern";
import HeroLedger from "@/components/brand/HeroLedger";
import LoopSteps from "@/components/LoopSteps";
import Reveal from "@/components/Reveal";
import CopyChip from "@/components/CopyChip";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

const REPO_URL = "https://github.com/mericcintosun/stele";
const HACKATHON_URL = "https://dorahacks.io/hackathon/weex-ai-wars-2-tw";
const DEMO_URL = "https://github.com/mericcintosun/stele/blob/main/DEMO.md";

const CRITERIA = [
  {
    title: "Return performance",
    short: "The valve drops a losing reason mid week, so the remaining days trade only on what still works.",
  },
  {
    title: "Risk control",
    short: "Every entry ships with exchange-side TP and SL, and a per-thesis quota caps exposure.",
  },
  {
    title: "Strategy stability",
    short: "Round five cannot repeat round one's mistake; the ledger remembers which reason lost.",
  },
];

const COMPARISON = [
  {
    name: "TradingAgents",
    what: "Role based agents argue and reach a decision.",
    gap: "The reasoning is a one-off text. Closed PnL never returns to it, so nothing is learned about which reason lost money.",
  },
  {
    name: "HKUDS/AI-Trader",
    what: "End to end automated execution.",
    gap: "Capital sits in a single agent-level pool. One bad idea drains the whole account instead of just its own line.",
  },
  {
    name: "Agentic Trading Lab",
    what: "Keeps decision logs for review and backtesting.",
    gap: "The log is an observation surface. In Stele the log is inside the control loop and written to the exchange itself.",
  },
];

export default function Home() {
  return (
    <div className="space-y-20 sm:space-y-24">
      {/* Hero. Sahne: solda iddia + tek birincil aksiyon (sıralı fade-up),
          sağda kompoze sahne: Meshy anıtı tam görünür yüzer, ledger kartı
          anıtın sol altına biner (obje + yüzen UI). */}
      <header className="relative isolate overflow-hidden rounded-2xl border border-line bg-panel/40 px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
        <LedgerPattern className="pointer-events-none absolute right-0 top-0 -z-20 hidden h-full w-1/2 text-acc opacity-40 [mask-image:linear-gradient(to_left,black,transparent)] lg:block" />

        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)]">
          <div>
            <div className="anim-fade-up flex flex-wrap items-center gap-3" style={{ ["--d" as string]: "0ms" }}>
              <span className="rounded-full border border-acc/40 bg-acc/10 px-2.5 py-1 font-mono text-[11px] text-acc">
                WEEX AI Wars II · AI Team
              </span>
              <span className="font-mono text-[11px] text-mut">5 live weekly rounds</span>
            </div>

            <h1 className="type-display anim-fade-up mt-6" style={{ ["--d" as string]: "90ms" }}>
              Every order carries <span className="text-acc">its reason.</span>
            </h1>

            <p className="type-lead measure anim-fade-up mt-5 text-ink/90" style={{ ["--d" as string]: "180ms" }}>
              Stele is a WEEX perpetual futures agent that ties every order to a named thesis,
              keeps a realized PnL ledger for each one, and cuts the capital of any thesis that is
              losing money.
            </p>

            <div className="anim-fade-up mt-8 flex flex-wrap items-center gap-x-5 gap-y-3" style={{ ["--d" as string]: "280ms" }}>
              <Link href="/console" className={`group ${buttonClass({ variant: "primary", size: "md" })}`}>
                Watch the agent refuse its own order
                <span className="ml-1.5 inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="#loop"
                className="inline-flex min-h-11 items-center rounded-lg px-1 text-sm text-mut transition-colors hover:text-acc focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc"
              >
                How the loop works
              </Link>
            </div>

            <dl className="anim-fade-up mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-5 font-mono text-[11px] text-mut" style={{ ["--d" as string]: "420ms" }}>
              <div className="flex items-baseline gap-1.5">
                <dt>rounds</dt>
                <dd className="text-ink">5</dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt>theses</dt>
                <dd className="text-ink">6</dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt>halt line</dt>
                <dd className="text-bad">-2.0%</dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt>evidence</dt>
                <dd className="text-ink">uploadAiLog</dd>
              </div>
            </dl>
          </div>

          <div className="anim-fade-up relative mx-auto w-full max-w-[420px] lg:h-[560px] lg:max-w-none" style={{ ["--d" as string]: "200ms" }}>
            {/* Meshy anıtı: sahnenin sağında TAM görünür, yavaşça yüzer */}
            <Image
              src="/brand/stele-monument.png"
              alt=""
              aria-hidden
              width={520}
              height={520}
              priority
              className="anim-float pointer-events-none absolute -right-6 top-1/2 -z-10 hidden w-[360px] max-w-none -translate-y-1/2 [mask-image:radial-gradient(closest-side,black_70%,transparent_100%)] lg:block"
            />
            {/* Ledger kartı anıtın sol altına biner */}
            <div className="lg:absolute lg:bottom-4 lg:left-0 lg:w-[400px]">
              <HeroLedger />
            </div>
          </div>
        </div>
      </header>

      {/* Section 1: the failure mode and the mechanism */}
      <section className="space-y-6">
        <Reveal>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-line bg-panel p-6">
              <p className="font-mono text-4xl font-bold tracking-tight text-ink">
                80% <span className="text-bad">→ 40%</span>
              </p>
              <p className="mt-2 text-sm text-mut">
                Season 1: win rate to drawdown. Agents repeat a broken reason all week because they
                only have a total, not a per-reason ledger.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-panel p-6">
              <p className="font-mono text-4xl font-bold tracking-tight text-bad">-2.0%</p>
              <p className="mt-2 text-sm text-mut">
                The halt line. A thesis this deep in its own realized PnL gets zero capital until
                the round rolls.
              </p>
            </div>
            <div className="rounded-2xl border border-acc/40 bg-acc/10 p-6">
              <p className="font-mono text-2xl font-bold tracking-tight text-acc">uploadAiLog</p>
              <p className="mt-2 text-sm text-mut">
                The compliance write everyone treats as paperwork is Stele&apos;s memory: the same
                post is the thesis ledger that sizes the next order.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Section 2: the loop. The hero's "How the loop works" link lands here. */}
      <section id="loop" className="scroll-mt-24 space-y-6">
        <h2 className="type-h2">The loop, four steps</h2>
        <Reveal>
          <LoopSteps />
        </Reveal>
      </section>

      {/* Section 3: the three ranking criteria, then the field */}
      <section className="space-y-10">
        <div className="space-y-6">
          <h2 className="type-h2">Against the three ranking criteria</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {CRITERIA.map((c) => (
              <div key={c.title} className="rounded-2xl border border-line bg-panel p-5 transition-colors hover:border-acc/30">
                <p className="text-sm font-semibold text-ink">{c.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-mut">{c.short}</p>
              </div>
            ))}
          </div>
        </div>

        <details className="group">
          <summary className="flex cursor-pointer select-none items-center gap-2 text-mut transition-colors hover:text-ink [&::-webkit-details-marker]:hidden [&::marker]:content-none">
            <span className="text-xs transition-transform group-open:rotate-90">▸</span>
            <span className="text-sm font-medium">What is already out there, and what it misses</span>
          </summary>
          <div className="mt-4">
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-line text-mut">
                <tr>
                  <th className="px-5 py-3 font-normal">Project</th>
                  <th className="px-5 py-3 font-normal">What it does</th>
                  <th className="px-5 py-3 font-normal">What it does not do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {COMPARISON.map((c) => (
                  <tr key={c.name} className="transition-colors hover:bg-panel2/50">
                    <td className="px-5 py-3 font-medium">{c.name}</td>
                    <td className="px-5 py-3 text-mut">{c.what}</td>
                    <td className="px-5 py-3 text-mut">{c.gap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          </div>
        </details>
      </section>

      <footer className="space-y-4 border-t border-line pt-8 pb-12">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <a
            href={REPO_URL}
            className="inline-flex min-h-11 items-center rounded-lg text-acc transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc"
          >
            Repository
          </a>
          <a
            href={HACKATHON_URL}
            className="inline-flex min-h-11 items-center rounded-lg text-mut transition-colors hover:text-acc focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc"
          >
            WEEX AI Wars II on DoraHacks
          </a>
          <a
            href={DEMO_URL}
            className="inline-flex min-h-11 items-center rounded-lg text-mut transition-colors hover:text-acc focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc"
          >
            DEMO.md, the six steps
          </a>
          <Link
            href="/console"
            className="inline-flex min-h-11 items-center rounded-lg text-mut transition-colors hover:text-acc focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc"
          >
            Decision console
          </Link>
          <Link
            href="/evidence"
            className="inline-flex min-h-11 items-center rounded-lg text-mut transition-colors hover:text-acc focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc"
          >
            Evidence trail
          </Link>
        </div>

        <p className="measure text-xs leading-relaxed text-mut">
          Without WEEX credentials the console runs the same loop on seed data; set the keys and it
          signs the same calls.
        </p>

        <p className="text-xs text-mut">MIT licensed. Stele contributors.</p>
      </footer>
    </div>
  );
}
