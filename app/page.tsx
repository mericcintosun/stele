import Link from "next/link";

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
    <div className="space-y-16">
      {/* Hero */}
      <header className="space-y-5 pt-4">
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-acc/40 bg-acc/10 px-2.5 py-1 font-mono text-[11px] text-acc">
            WEEX AI Wars II · AI Team
          </span>
          <span className="font-mono text-[11px] text-mut">5 live weekly rounds</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Stele
          <span className="ml-3 align-middle font-mono text-sm font-normal text-mut">
            /capi/v3/order/uploadAiLog
          </span>
        </h1>

        <p className="max-w-3xl text-lg leading-relaxed text-ink/90">
          A WEEX perpetual futures agent that ties every order to a named thesis, keeps a realized
          profit and loss ledger for each one, and cuts the capital of any thesis that is losing
          money.
        </p>

        <p className="max-w-3xl leading-relaxed text-mut">
          Open the screen and you see one list: the reasons the agent used to open trades, and what
          each one has made or lost so far. When the agent proposes a new trade it puts the reason
          and that reason&apos;s history side by side. A losing reason gets a smaller order. A
          reason that keeps losing gets no order at all. You watch what was tried, what was dropped,
          and why, on a single screen.
        </p>

        <p className="max-w-3xl leading-relaxed text-ink/90">
          The walk takes ninety seconds. Open the console and press Run decision loop on the SOL
          signal: its thesis is 2.14% under water over seven closed trades, so the agent refuses its
          own order and posts the refusal to the exchange.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Link
            href="/console"
            className="inline-flex min-h-11 items-center rounded-lg bg-acc px-5 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
          >
            Watch the agent refuse its own order
          </Link>
          <Link
            href="/evidence"
            className="inline-flex min-h-11 items-center px-2 text-sm text-mut transition-colors hover:text-acc"
          >
            Read the evidence trail
          </Link>
          <Link
            href="#loop"
            className="inline-flex min-h-11 items-center px-2 text-sm text-mut transition-colors hover:text-acc"
          >
            How the loop works
          </Link>
        </div>
      </header>

      {/* Problem */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-line bg-panel p-6">
          <h2 className="text-lg font-semibold tracking-tight">The failure mode</h2>
          <p className="leading-relaxed text-mut">
            WEEX published the postmortem themselves after Season 1:{" "}
            <span className="text-ink">80% win rate to 40% drawdown</span>. Agents with good hit
            rates still finished the round deep in drawdown. The cause repeats: the agent keeps
            reproducing the same broken reason all week, because it has no record of which reason is
            losing money. It only has a total.
          </p>
          <p className="leading-relaxed text-mut">
            Ranking here is not return alone. It weighs return, risk control and strategy stability
            together, across five consecutive weekly rounds. An agent that cannot name its worst
            idea cannot stop repeating it in round five.
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-acc/30 bg-panel p-6">
          <h2 className="text-lg font-semibold tracking-tight text-acc">The mechanism</h2>
          <p className="leading-relaxed text-mut">
            WEEX already requires every AI participant to post decision logs to{" "}
            <span className="font-mono text-xs text-ink">/capi/v3/order/uploadAiLog</span>, and
            disqualifies teams that cannot produce valid evidence of AI participation. Most teams
            treat that as paperwork.
          </p>
          <p className="leading-relaxed text-mut">
            Stele treats it as the memory. The same write that satisfies the compliance gate is the
            thesis ledger, and the ledger is what sizes the next order. The weakest link in the
            field becomes the load bearing part of the agent.
          </p>
        </div>
      </section>

      {/* How it works. The hero's "How the loop works" link lands here. */}
      <section id="loop" className="scroll-mt-8 space-y-5">
        <h2 className="text-xl font-semibold tracking-tight">The loop, four steps</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.step} className="rounded-xl border border-line bg-panel p-5">
              <span className="font-mono text-xs text-acc">{s.step}</span>
              <h3 className="mt-2 font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mut">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Judging criteria mapping */}
      <section className="space-y-5">
        <h2 className="text-xl font-semibold tracking-tight">Against the three ranking criteria</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-panel p-5">
            <h3 className="font-semibold">Return performance</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-mut">
              The valve drops a losing reason mid week rather than at the end of the round, so the
              remaining days trade only on the theses that still work.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-5">
            <h3 className="font-semibold">Risk control</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-mut">
              Every entry ships with exchange-side take profit and stop loss, so a position stays
              protected if the agent process dies. A cumulative per-thesis quota caps exposure
              independently of leverage.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-5">
            <h3 className="font-semibold">Strategy stability</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-mut">
              The thesis ledger is the only state carried between rounds. Round five cannot repeat
              round one&apos;s mistake, because round one wrote down which reason killed it.
            </p>
          </div>
        </div>
      </section>

      {/* Differentiation */}
      <section className="space-y-5">
        <h2 className="text-xl font-semibold tracking-tight">What is already out there</h2>
        <div className="overflow-x-auto rounded-xl border border-line bg-panel">
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
        </div>
      </section>

      <footer className="border-t border-line pt-6 pb-10 text-xs text-mut">
        <p>
          Stele runs against WEEX OpenAPI v3. Without credentials the console runs on seed data and
          the shadow venue, so the loop is inspectable before the API allowlist clears. Set the WEEX
          keys and it signs and sends the same calls.
        </p>
      </footer>
    </div>
  );
}
