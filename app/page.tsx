// /
//
// The landing page. It has one job: get a stranger to DEMO.md step 4, which is
// the agent refusing its own order. So there is exactly one primary action in
// the hero, it points at /console, and everything else on the page is a
// secondary link.
//
// Every factual sentence here is a verified competition claim or a statement
// about a file in this repo. The layout changed in Phase 8; the claims did not.

import Link from "next/link";
import LedgerPattern from "@/components/brand/LedgerPattern";
import HeroLedger from "@/components/brand/HeroLedger";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

const REPO_URL = "https://github.com/mericcintosun/stele";
const HACKATHON_URL = "https://dorahacks.io/hackathon/weex-ai-wars-2-tw";
const DEMO_URL = "https://github.com/mericcintosun/stele/blob/main/DEMO.md";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Every order belongs to a written thesis",
    body: "Six theses, each with a name and an entry condition written before the round starts. A signal that matches none of them never becomes an order.",
  },
  {
    step: "02",
    title: "The same decision goes to the compliance endpoint",
    body: "stage, model, input, output and a 1000 character explanation are posted to /capi/v3/order/uploadAiLog. The returned orderId pairs the fill with the thesis.",
  },
  {
    step: "03",
    title: "Closed PnL is written back to the thesis",
    body: "When a position closes, its realized result lands on the thesis that opened it. Press Close at stop on the console and watch one thesis change state. That ledger is the only thing carried from round to round.",
  },
  {
    step: "04",
    title: "The next order is sized from that ledger",
    body: "Not from total account performance. A thesis under the halt line goes to zero capital and the agent refuses its own order, then posts the refusal too.",
  },
];

const CRITERIA = [
  {
    title: "Return performance",
    body: "The valve drops a losing reason mid week rather than at the end of the round, so the remaining days trade only on the theses that still work.",
  },
  {
    title: "Risk control",
    body: "Every entry ships with exchange-side take profit and stop loss, so a position stays protected if the agent process dies. A cumulative per-thesis quota caps exposure independently of leverage.",
  },
  {
    title: "Strategy stability",
    body: "The thesis ledger is the only state carried between rounds. Round five cannot repeat round one's mistake, because round one wrote down which reason killed it.",
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
      {/* Hero. İki kolon: solda iddia ve tek birincil aksiyon, sağda ürünün
          kendisi (konsolun gerçek seed sayılarıyla ledger önizlemesi). Desen
          yalnızca sağ yarıda ve maskeli: metnin altından çizgi geçmez. */}
      <header className="relative isolate overflow-hidden rounded-2xl border border-line bg-panel/40 px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
        <LedgerPattern className="pointer-events-none absolute right-0 top-0 -z-10 hidden h-full w-1/2 text-acc opacity-60 [mask-image:linear-gradient(to_left,black,transparent)] lg:block" />

        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-14">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-acc/40 bg-acc/10 px-2.5 py-1 font-mono text-[11px] text-acc">
                WEEX AI Wars II · AI Team
              </span>
              <span className="font-mono text-[11px] text-mut">5 live weekly rounds</span>
            </div>

            <h1 className="type-display mt-6">
              Every order carries <span className="text-acc">its reason.</span>
            </h1>

            <p className="type-lead measure mt-5 text-ink/90">
              Stele is a WEEX perpetual futures agent that ties every order to a named thesis,
              keeps a realized PnL ledger for each one, and cuts the capital of any thesis that is
              losing money.
            </p>

            <p className="type-body measure mt-4 text-mut">
              The walk takes ninety seconds: press Run decision loop on the SOL signal and watch
              the agent refuse its own order, then post the refusal to the exchange.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href="/console" className={buttonClass({ variant: "primary", size: "md" })}>
                Watch the agent refuse its own order
              </Link>
              <Link
                href="#loop"
                className="inline-flex min-h-11 items-center rounded-lg px-1 text-sm text-mut transition-colors hover:text-acc focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc"
              >
                How the loop works
              </Link>
            </div>

            <dl className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-5 font-mono text-[11px] text-mut">
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

          <HeroLedger />
        </div>
      </header>

      {/* Section 1: the failure mode and the mechanism */}
      <section className="space-y-6">
        <p className="type-body measure text-mut">
          Open the screen and you see one list: the reasons the agent used to open trades, and what
          each one has made or lost so far. A losing reason gets a smaller order. A reason that
          keeps losing gets no order at all.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardBody pad="lg" className="space-y-3">
            <CardTitle size="md">The failure mode</CardTitle>
            <p className="type-body text-mut">
              WEEX published the postmortem themselves after Season 1:{" "}
              <span className="text-ink">80% win rate to 40% drawdown</span>. Agents with good hit
              rates still finished the round deep in drawdown. The cause repeats: the agent keeps
              reproducing the same broken reason all week, because it has no record of which reason
              is losing money. It only has a total.
            </p>
            <p className="type-body text-mut">
              Ranking here is not return alone. It weighs return, risk control and strategy
              stability together, across five consecutive weekly rounds. An agent that cannot name
              its worst idea cannot stop repeating it in round five.
            </p>
          </CardBody>
        </Card>

        <Card tone="accent">
          <CardBody pad="lg" className="space-y-3">
            <CardTitle size="md" className="text-acc">
              The mechanism
            </CardTitle>
            <p className="type-body text-mut">
              WEEX already requires every AI participant to post decision logs to{" "}
              <span className="font-mono text-xs text-ink">/capi/v3/order/uploadAiLog</span>, and
              disqualifies teams that cannot produce valid evidence of AI participation. Most teams
              treat that as paperwork.
            </p>
            <p className="type-body text-mut">
              Stele treats it as the memory. The same write that satisfies the compliance gate is
              the thesis ledger, and the ledger is what sizes the next order. The weakest link in
              the field becomes the load bearing part of the agent.
            </p>
          </CardBody>
        </Card>
        </div>
      </section>

      {/* Section 2: the loop. The hero's "How the loop works" link lands here. */}
      <section id="loop" className="scroll-mt-24 space-y-6">
        <h2 className="type-h2">The loop, four steps</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {HOW_IT_WORKS.map((s) => (
            <Card key={s.step}>
              <CardBody pad="md">
                <span className="font-mono text-xs text-acc">{s.step}</span>
                <CardTitle level={3} className="mt-2">
                  {s.title}
                </CardTitle>
                <p className="mt-1.5 text-sm leading-relaxed text-mut">{s.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 3: the three ranking criteria, then the field */}
      <section className="space-y-10">
        <div className="space-y-6">
          <h2 className="type-h2">Against the three ranking criteria</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {CRITERIA.map((c) => (
              <Card key={c.title}>
                <CardBody pad="md">
                  <CardTitle level={3}>{c.title}</CardTitle>
                  <p className="mt-1.5 text-sm leading-relaxed text-mut">{c.body}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="type-h2">What is already out there</h2>
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
                  <tr key={c.name}>
                    <td className="px-5 py-3 font-medium">{c.name}</td>
                    <td className="px-5 py-3 text-mut">{c.what}</td>
                    <td className="px-5 py-3 text-mut">{c.gap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
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
          Stele runs against WEEX OpenAPI v3. Without credentials the console runs on seed data and
          the shadow venue, so the loop is inspectable before the API allowlist clears. Set the WEEX
          keys and it signs and sends the same calls.
        </p>

        <p className="text-xs text-mut">MIT licensed. Stele contributors.</p>
      </footer>
    </div>
  );
}
