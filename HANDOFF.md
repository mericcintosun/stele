# Stele: build handoff

You are picking up a warm scaffold. Read this file top to bottom before touching code. It is the only context you get.

---

## 1. Context

**Product:** Stele

**One liner:** A WEEX perpetual futures agent that ties every order to a named thesis, keeps a realized profit and loss ledger for each one, and cuts the capital of any thesis that is losing money.

**Plain pitch:** Open the screen and you see one list: the reasons the agent used to open trades, and what each one has made or lost so far. When the agent proposes a new trade it puts the reason and that reason's history side by side. A losing reason gets a smaller order. A reason that keeps losing gets no order at all. You watch what was tried, what was dropped, and why, on a single screen.

**Hackathon:** WEEX AI Wars II: Humans vs AI (DoraHacks, organized by WEEX LABs). https://dorahacks.io/hackathon/weex-ai-wars-2-tw

**Deadline:** 2026-09-02 15:59 UTC. Prize pool up to 200,000 USDT.

**Target track:** AI Team (main placement). Secondary lines that come off the same build: the AI model token allocation (100 million tokens, AI side only, awarded on proof of real model usage), the early bird pool, and the new user pool.

**Verified competition facts. Do not contradict these:**

- The competition runs **five consecutive weekly live trading rounds**.
- There is **no classic hackathon submission**. Ranking is decided by real futures trading performance. No project presentation, no demo video, no repo is required by the organizers. (We still record a 90 second demo and keep the README sharp: it is what the AI agent partner application and the model token allocation are judged on, and it costs an hour.)
- Evaluation is multi dimensional: **return performance, risk control, strategy stability**, weighted together. The percentage weights are not published anywhere. Do not invent them.
- Prize split as published: the winning side takes 70% of the pool, and 30% of each round's pool is distributed to the losing side. Separate pools of 20,000 USDT (new users) and 52,000 USDT (early registration) are announced but their relationship to the main pool is not confirmed.
- **AI Team and Human Team are mutually exclusive.** The side is chosen before the competition starts and cannot be changed after it begins. We are on AI Team.
- Required for the AI side: a WEEX account, configured WEEX API keys, the official Trader Skill integration, and a separate Google Form application to join as an AI agent partner.
- `POST /capi/v3/order/uploadAiLog` is verified. Required fields: `stage`, `model`, `input`, `output`, `explanation` (max 1000 characters). Optional `orderId` (Long). **Only allowlisted UIDs may post.**
- Verified disqualification language: a team that cannot present valid evidence of AI participation is removed from the ranking and disqualified. Our ledger is that evidence.
- Prohibited: wash trading, self dealing, account manipulation, and similar.

**Verified unknowns. If a decision depends on one of these, ask the human, do not guess:**

- Exact round start and end dates. The DoraHacks detail page still says timing will be announced.
- The weights of the three ranking criteria.
- How many participants are paid, and how the within-side distribution works.
- **Who funds the starting capital and what the leverage cap is.** In Season 1 the organizer deposited 1,000 USDT with leverage capped at 20x. That has not been confirmed for AI Wars II. Until it is, real money risk is open ended: keep per-thesis quota pinned to a small percentage of account equity and participate with the minimum amount.
- The content and closing date of the AI agent partner Google Form.

---

## 2. Current state

This repo is a Next.js console over the decision loop. It compiles and runs with zero environment variables.

Layout after Phase 1. Three page routes, three API routes.

```
DEMO.md                 The 90 second shot list, six steps, each naming its route file.
CLAUDE.md               Build commands, stack pitfalls, Vercel guardrails, never-touch list.
app/
  layout.tsx            Title template "%s | Stele", header + SiteNav, dark shell.
  page.tsx              Landing only. Problem, mechanism, the four step loop, the
                        three ranking criteria, the competitor table, and a link
                        to /console. No console render, no seed import.
  icon.svg              Monochrome slab mark. The one file allowed a literal color.
  globals.css           Tailwind v4 @theme tokens. All color lives here.
  console/page.tsx      THE DEMO START ROUTE. Server. await getAdapter().snapshot()
                        into <DecisionConsole>. Never imports the seed directly.
  console/loading.tsx   Skeleton panels.
  log/page.tsx          Server. The full uploadAiLog audit trail, queue depth line,
                        empty state. Step 6 of DEMO.md.
  log/loading.tsx       Skeleton panels.
  api/decide/route.ts   THE CONTROL LOOP. POST { signalId } runs: thesis lookup ->
                        valve -> model chain -> uploadAiLog -> sim shadow fill ->
                        live fill. Node runtime, force-dynamic. Returns ApiResponse.
  api/ledger/route.ts   GET. ApiResponse<{ theses }> from getAdapter().theses().
  api/log/route.ts      GET. ApiResponse<{ logs, queueDepth }>.
  error.tsx             Names the product, retry button, link to /console. Prints
                        nothing from error.message.
  not-found.tsx         Names the product, link to /console.
components/
  SiteNav.tsx           Client. usePathname, links / /console /log, aria-current.
  DecisionConsole.tsx   Client. Holds all session state, calls /api/decide, renders
                        the account strip, market strip, signal queue, decision
                        stream and the positions table. account comes in as a prop.
  ThesisLedger.tsx      Client. Six theses, ledger row each, valve state badge,
                        quota bar, expandable precondition.
  DecisionLog.tsx       Client. The uploadAiLog stream with stage/model/input/
                        output/explanation and the WEEX response or queue notice.
lib/
  types.ts              Every type, no values. Plus ApiResponse<T> and ConsoleSnapshot.
  format.ts             usdt(), pct(), stamp(), MONTHS. Locale free on purpose.
  data/seed.json        The seed values as pure data. Fixed ids, no clock, no random.
  data/seed.ts          seed.json with its types back on, plus thesisById(),
                        signalById(), marketFor().
  data.ts               Tombstone. No exports, nothing imports it. Should be git rm'd.
  adapter.ts            THE SWAP SEAM. getAdapter() reads ADAPTER_MODE, returns
                        fakeAdapter (seed) unless the value is exactly "real".
  valve.ts              PURE. Thresholds, valveFor(), sizeOrder(), bracketFor(),
                        verdictFor(). No I/O. This is the mechanism.
  weex.ts               WEEX OpenAPI v3 client. Server only.
  agent.ts              The three link model chain. Server only.
scripts/
  seed.mjs              npm run seed. Validates seed.json invariants, writes
                        public/seed-manifest.json. Deterministic.
```

### What is real

- **`lib/weex.ts` is a real signed client.** `request()` builds `ACCESS-KEY` / `ACCESS-SIGN` / `ACCESS-TIMESTAMP` / `ACCESS-PASSPHRASE` headers with `createHmac("sha256", secret)` over `timestamp + method + requestPath + body`, base64. `placeOrder`, `uploadAiLog` and `lastPrice` all send real HTTPS when `hasCredentials()` is true. `pathFor()` rewrites `/capi/v3/` to `/capi/v3/sim/` on the sim venue, which is the whole live/shadow switch.
- **`lib/agent.ts` is a real model chain.** `viaAnthropic()` calls `client.messages.create` with a `record_decision` tool and `tool_choice`. `viaClaudeCli()` spawns `claude -p --output-format text --model haiku` with the prompt on stdin, availability cached from `claude --version`. `viaMock()` is the deterministic floor.
- **`lib/valve.ts` is the finished mechanism.** Halt at -2.0% ledger, throttle at -0.5% or 5% max drawdown, cold start at 0.5x under 6 closed trades, quota clamp, 2% stop with a 2:1 target. Nothing here is stubbed.
- **`app/api/decide/route.ts` wires all of the above together for real**, including the branch where a rejection still posts to `uploadAiLog`.

### What is mocked, and exactly where

- **`lib/data/seed.json` behind `lib/adapter.ts`** is the entire persistence layer. Thesis ledgers, positions, market rows, signals and prior logs are hand written seed values. There is no database. `realAdapter` is declared and currently delegates to the seed.
- **`placeOrder()` in `lib/weex.ts`**, inside `if (!hasCredentials())`: returns a deterministic mock fill with fixed slippage (4bp sim, 7bp live) instead of calling WEEX. Marked in place. The live branch below it is complete.
- **`uploadAiLog()` in `lib/weex.ts`**, inside `if (!hasCredentials())`: returns `{ accepted: false, queued: true }` instead of posting. This is the correct behavior for an un-allowlisted UID too, so it doubles as the queue path.
- **`lastPrice()` in `lib/weex.ts`**: returns the caller's fallback when there are no credentials.
- **`viaMock()` in `lib/agent.ts`**: the offline explanation writer.
- **No attribution job exists.** Nothing reads closed fills and writes realized PnL back to a thesis. The console fakes forward motion by spending quota in `DecisionConsole.evaluate()`. This is the single biggest gap and it is item 1 in the mission.

### Order type note

`placeOrder()` sends `type: 1` for open long and `type: 2` for open short with `match_price: 1`, plus `preset_take_profit_price` and `preset_stop_loss_price`. **Verify these field names against the live WEEX contract order doc before the first real order.** If they differ, that one function is the only thing that changes.

---

## 3. Mission

Roughly 12 hours of feature work, then 2 hours of submission work. Build in this order. Each item says what "done" looks like on screen.

### Hour 0 to 1: infrastructure and the API checklist (1h)

Not code in this repo. Stand up the VPS with a static IP, submit the IP and UID to the WEEX allowlist, and walk the 11 step API checklist against sim: query balance, set leverage, read price, place an order, close it, minimum 10 USDT trade size. **Do this first.** The allowlist is approved by hand by WEEX staff and the deadline is close. Every hour of delay here is an hour the live path does not exist.

**Done looks like:** a sim order placed and closed from the VPS, and the allowlist request submitted with a timestamp.

### Hour 1 to 3.5: the uploadAiLog pipeline, persisted (2.5h)

`lib/weex.ts` already formats and sends the record. What is missing is durability. Add a queue table, write every record to it before attempting the POST, mark it sent on `code: "00000"`, replay unsent records in `postedAt` order on a timer. Surface the queue depth in the console header.

**Done looks like:** kill the network mid decision, the console shows `3 queued for allowlist`, restore the network, the counter drains to zero and the WEEX response lines appear in the log stream.

### Hour 3.5 to 6.5: the thesis ledger and order attribution (3h)

Replace `lib/data.ts` as the source of truth with SQLite (or Postgres if you would rather deploy the whole thing on Vercel; the console is stateless either way). Schema: `theses`, `orders` (with `thesis_id` and `client_oid`), `fills`, `log_queue`. Then write the attribution job: poll closed positions from WEEX, match on `client_oid`, add realized PnL to the owning thesis, recompute `realizedPnlPct` and `maxDrawdownPct`.

**Done looks like:** close a sim position at a loss, and within one poll cycle the matching thesis row in the left panel moves down and its valve badge changes state without a page reload.

### Hour 6.5 to 7: break, then one full end to end round on sim

### Hour 7 to 10: the capital valve on live wiring (3h)

`lib/valve.ts` is already written. This block is making it operate on real ledger numbers rather than seed values, and enforcing the two risk pieces at the exchange: preset TP and SL on every entry (verify they actually rest on WEEX by reading the order back), and the cumulative per-thesis quota checked against real spent notional.

**Done looks like:** a thesis whose real ledger has crossed -2.0% produces a red REFUSED row, zero USDT deployed, no order at the exchange, and a `stage: "rejection"` record accepted by uploadAiLog.

### Hour 10 to 12.5: the decision console on live data (2.5h)

The console UI already exists. Point it at the database, add polling or SSE so price, positions and the ledger refresh without interaction, and keep the single screen rule: price, open positions, thesis ledger and the log stream all visible at once with no scrolling explanation.

**Done looks like:** the page loads cold and a stranger understands the agent's state in under ten seconds.

### Hour 12.5 to 13.5: rehearse the wow moment

**Schedule this explicitly. Do not skip it.** On the sim venue, deliberately drive one thesis into loss until its ledger crosses the halt line. Then run a signal that matches it and capture the sequence: valve multiplier drops to 0.00x, the red REFUSED row appears, the refusal posts to `uploadAiLog`, and the WEEX response lands on screen. Repeat until it runs clean in one take. The exchange issuing a receipt for the bot saying no is the single strongest thing we have. It cannot be a maybe.

### Hour 13.5 to 16: submission work

- 13:30 to 14:30: README final pass (English) and the WEEX AI agent partner Google Form.
- 14:30 to 15:15: the 90 second screen recording, one take, English voiceover.
- 15:15 to 16:00: buffer. If the allowlist approval has not landed, spend it staying on sim and defer the live cutover.

### The 90 second demo, shot list

- **0 to 15s:** single screen. Six theses and their realized PnL on the left, `cmt_solusdt` price in the middle, open positions on the right. "This agent allocates capital to its reasons, not to itself."
- **15 to 45s:** a signal arrives. The agent picks the thesis, the name and precondition highlight, the uploadAiLog body fills in on the right (stage, model, input, output, explanation), the WEEX response appears. The order goes out and exchange-side TP/SL join the list.
- **45 to 60s:** the same decision ran on `/capi/v3/sim` first. Shadow fill and live fill side by side. "Every decision runs on simulation first, then live."
- **60 to 75s:** second signal, thesis is the negative funding plus rising open interest one. Ledger row reads 7 trades, -2.1%. Valve multiplier drops to 0.0. Red REFUSED row appears.
- **75 to 90s:** the refusal is written to uploadAiLog, WEEX responds on screen. Camera returns to the ledger: that thesis is grey now, its capital closed. "It does not repeat round one's mistake in round five, because it wrote down which reason killed it."

### Known risks and the mitigation already in the code

- **Allowlist approval is manual and slow.** Everything runs on `/capi/v3/sim` today. Going live is one env var (`WEEX_VENUE=live`). Keep it that way. Never scatter a second path prefix through the code.
- **Cold start.** In round one no thesis has a ledger, so the valve cuts nothing. Mitigated by `VALVE.warmupMultiplier` holding size at 0.5x under 6 closed trades. Also pre-fill the ledger with sim shadow trades before round one starts.
- **uploadAiLog only accepts allowlisted UIDs**, so the log path cannot be tested end to end until approval. Mitigated by the local queue. Do not remove it after approval lands; it is also the retry path.
- **Starting capital and leverage cap are unconfirmed.** Keep per-thesis quota at a small percentage of account equity until the capital page is clear.

---

## 4. Constraints

**Stack, non negotiable:**

- Next.js 15 App Router, TypeScript strict, Tailwind CSS v4. No `tailwind.config.js`, no `@tailwind base` directives. Colors go in the `@theme` block in `app/globals.css` and nowhere else.
- Deploys to Vercel. No custom server, no runtime filesystem writes, no long lived process in this repo. If the agent loop needs a daemon (it does, for the round timer and the attribution poller), that lives on the VPS and this console reads its database.
- Any component using `useState`, `useEffect` or an event handler starts with `"use client"`.
- Route handler `params` and `searchParams` are Promises in Next 15. Await them.
- `node:crypto` and `node:child_process` imports mean the route needs `export const runtime = "nodejs"`. It has it. Keep it.

**Writing style for anything a human reads (UI copy, README, commit messages):**

- No em dashes, no en dashes, no double hyphens used as a dash. Comma, period, colon or parentheses.
- Banned: seamless, leverage (as a verb), empower, revolutionize, streamline, game-changer, cutting-edge, delve, robust, unlock, elevate, harness, effortless, "in today's world", "it's not just X, it's Y".
- Vary sentence length. Use concrete numbers. Write like a builder, not like marketing. Judges read the README as human writing.

**Scope discipline:**

- If something threatens the deadline, cut scope, do not polish. A working refusal on sim beats a beautiful console with a broken loop.
- The valve is the product. If you are ever choosing between making the valve real and making anything else nicer, make the valve real.
- Do not add a UI kit, a state library, or an ORM you do not need.

**Keep `npm run build` passing after every change.** No exceptions. There is no lint script and no test suite, so the build is the only gate.

---

## 5. Definition of done

- [ ] Deployed on Vercel and the URL loads cold without errors.
- [ ] README demo links filled in: the Vercel URL and the video URL replacing `<ADD_VIDEO_URL>`.
- [ ] The 90 second flow above runs end to end against seed or sim data, in one take, with no setup narration.
- [ ] The wow moment is rehearsed: valve to 0.00x, red REFUSED row, refusal accepted by `uploadAiLog`, WEEX response visible on screen.
- [ ] `ANTHROPIC_API_KEY` is set for the recording, so the console header reads "Anthropic API" and not "offline stub".
- [ ] WEEX API keys configured, allowlist request submitted, the 11 step API checklist passed on sim.
- [ ] The AI agent partner Google Form is submitted.
- [ ] `npm run build` passes.

---

## Phase 1 log

**Goal.** Make the whole 90 second demo path clickable on fake data from a single start route
(`/console`), and put the four seams Phase 2 has to swap in place so they never move again: the type
contract, the seed as data, the adapter, and one API response shape.

**Status.** All five slices landed. Nothing was cut. Unverified: every item that needs a command
(`npm install`, `npm run build`, `npm run seed` twice, the Vercel deploy). The Phase 1 agent had
Write, Edit, Read, Glob and Grep only and could run none of them.

### Decisions

- **`lib/data.ts` split into four files.** It was types, seed values, lookups and formatters in one
  module, imported by seven files, three of them client components. That meant every client bundle
  pulled the entire seed in just to get `stamp()`. It is now `lib/types.ts` (types, no values),
  `lib/format.ts` (three functions), `lib/data/seed.json` (values as data) and `lib/data/seed.ts`
  (values with their types back on, plus the three lookups). Seed values live in JSON so
  `scripts/seed.mjs` can validate them with no TypeScript step, and so Phase 2 can diff a real
  ledger export against them.
- **`ADAPTER_MODE` defaults to fake, and anything other than the exact string `"real"` is fake.**
  The Vercel deploy has to serve a working `/console` with no environment variables set at all,
  because that is what a judge opens cold and what the recording runs on. A typo in a dashboard
  variable must degrade to seeded data, not to a 500.
- **`realAdapter` is declared now and delegates to the seed.** Throwing "not implemented" would make
  `ADAPTER_MODE=real` a deploy-breaking switch before Phase 2 lands. Delegating keeps the seam
  visible and the site up.
- **`ApiResponse<T>` is a discriminated union, not a status code convention.** `/api/decide` keeps
  its 400 and 422 codes, but the body is now `{ ok: false, error }`, so the client narrows on
  `payload.ok` and surfaces the server's own message instead of `decide failed with 422`.
- **`ACCOUNT` became a prop on `DecisionConsole`.** The console is the one screen Phase 2 repoints at
  the real ledger. It must not read a seed literal, so `/console` passes
  `snapshot.account` down.
- **The console moved off `/` onto `/console`.** The landing page now links to it. A judge who lands
  on `/` reads the pitch; the demo starts one click away and the recording starts already there.
- **`lib/valve.ts` logic untouched.** Only line 12 changed, `"./data"` to `"./types"`.

### Failed attempts

None. Two things were caught by reading rather than by a build, and both are already fixed:

- `app/api/decide/route.ts` had `const body` for the parsed request and a second `const body` for
  the response envelope in the same function scope, which is a redeclaration error. The response one
  is now `ok`, the two early returns use `fail`.
- The `Wiring` interface in that route is declared but deliberately not exported. Next 15 rejects
  unexpected exports from a route module.

### Files changed

New: `DEMO.md`, `CLAUDE.md`, `lib/types.ts`, `lib/format.ts`, `lib/adapter.ts`,
`lib/data/seed.json`, `lib/data/seed.ts`, `scripts/seed.mjs`, `app/console/page.tsx`,
`app/console/loading.tsx`, `app/log/page.tsx`, `app/log/loading.tsx`, `app/api/ledger/route.ts`,
`app/api/log/route.ts`, `components/SiteNav.tsx`, `app/icon.svg`.

Edited: `README.md`, `HANDOFF.md`, `.env.example`, `package.json`, `app/page.tsx`,
`app/layout.tsx`, `app/error.tsx`, `app/not-found.tsx`, `app/api/decide/route.ts`,
`components/DecisionConsole.tsx`, `components/DecisionLog.tsx`, `components/ThesisLedger.tsx`,
`lib/valve.ts` (import line only), `lib/agent.ts` (import line only).

Tombstoned: `lib/data.ts`. It now holds a comment and `export {}`, nothing imports it. **The runner
should `git rm lib/data.ts`.** The Phase 1 agent had no shell and no delete tool.

### Commands run

None, the runner runs them.

### Open questions

- **Should `/console` poll?** It is `force-dynamic` and renders once per request. Phase 2 adds the
  attribution job, and at that point the ledger changes without a click. Safest default taken for
  now: no polling, no SSE, server render per navigation. Phase 2 owns that call.
- **Does the real ledger keep `quotaUsdt` per thesis per round, or cumulative across all five?**
  The seed treats it as per round (150 USDT each, six theses). `VALVE` reads it either way, but the
  SQLite schema has to pick one. Safest default assumed: per round, reset on rollover.
- **`app/api/ledger/route.ts` and `app/api/log/route.ts` are not consumed by any component yet.**
  Both pages read the adapter directly on the server. The routes exist so the Phase 2 polling client
  has a stable endpoint to hit. If Phase 2 decides on server actions instead, they can go.

### Next best step for Phase 2

Write `realAdapter` against SQLite, in this order: the `log_queue` table first, because
`uploadAiLog()` in `lib/weex.ts` already returns `{ queued: true }` for every un-allowlisted post and
those records are being dropped on the floor today. Then `theses` and `orders` with `client_oid`,
then the attribution job. The three adapter methods are the only functions that have to change; every
page, route and component above them already reads through the seam.

Before any of that, submit the UID plus static IP allowlist request if it is not already in. Approval
is manual and the deadline is 2026-09-02 15:59 UTC.
