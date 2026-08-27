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

Layout after Phase 2. Three page routes, four API routes.

```
DEMO.md                 The 90 second shot list, five steps, step 4 is the wow step.
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
  api/decide/route.ts   THE CONTROL LOOP. POST { signalId }, parsed with
                        DecideRequestSchema first, then: thesis lookup -> valve ->
                        model chain -> queue the log record -> uploadAiLog ->
                        sim shadow fill -> live fill -> spendQuota. Node runtime,
                        force-dynamic. Returns ApiResponse.
  api/queue/route.ts    GET { depth, records }. POST replays unsent records in
                        postedAt order and stops at the first refusal.
  api/ledger/route.ts   GET. ApiResponse<{ theses }> from getStore().listTheses().
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
  types.ts              Every type, no values. Plus ApiResponse<T>, ConsoleSnapshot
                        and ClosedFill.
  config.ts             EVERY CONSTANT. Hosts, v3 paths, timeouts, retry count,
                        model name, client_oid prefix, allowed symbols. A leaf:
                        it imports nothing.
  errors.ts             SteleErrorCode union, SteleError, fail(), STATUS_FOR.
  schemas.ts            zod at the edges: DecideRequestSchema, QueueReplayRequest
                        Schema, JudgementSchema, WeexEnvelopeSchema, FillSchema.
  format.ts             usdt(), pct(), stamp(), MONTHS. Locale free on purpose.
  cache.ts              hashInput() and a module scope Map, so two demo runs of
                        the same signal render the same explanation.
  observability.ts      trace(step, detail). One prefixed line per core step.
  attribution.ts        PURE. parseClientOid(), buildClientOid(),
                        applyFillToThesis(), attribute(). No I/O, no imports but
                        types, so node --test loads it with no bundler.
  data/seed.json        The seed values as pure data. Fixed ids, no clock, no random.
  data/seed.ts          seed.json with its types back on, plus thesisById(),
                        signalById(), marketFor().
  data.ts               Tombstone. No exports, nothing imports it. Should be git rm'd.
  adapter.ts            Tombstone. Replaced by lib/store. Should be git rm'd.
  store/types.ts        THE SWAP SEAM. The LedgerStore interface: reads, quota
                        spend, applyRealized, the log queue, syncAttribution.
  store/seed.ts         Seed implementation, module scope state, the permanent
                        fallback. ledgerState() is shared with the real store.
  store/weex-store.ts   Reads closed fills from WEEX and attributes them. Every
                        other method delegates to the seed store.
  store/index.ts        getStore(). The only module that reads ADAPTER_MODE.
  valve.ts              PURE. Thresholds, valveFor(), sizeOrder(), bracketFor(),
                        verdictFor(). No I/O. This is the mechanism.
  weex.ts               WEEX OpenAPI v3 client. Server only. withTimeout() wraps
                        every outbound call, plus closedFills() for attribution.
  agent.ts              The three link model chain. Server only. Zero prompt text.
prompts/
  decision-record.ts    The whole prompt, the system line and the tool name.
fixtures/
  judgement.json        The parse failure fallback for the model answer.
tests/
  valve.test.ts         Halt line, throttle line, warmup, quota clamp.
  attribution.test.ts   client_oid grammar, and a losing fill crossing the halt line.
  schemas.test.ts       Five fixed malformed inputs per edge schema.
scripts/
  seed.mjs              npm run seed. Validates seed.json invariants, writes
                        public/seed-manifest.json. Deterministic.
```

### What is real

- **`lib/weex.ts` is a real signed client.** `request()` builds `ACCESS-KEY` / `ACCESS-SIGN` / `ACCESS-TIMESTAMP` / `ACCESS-PASSPHRASE` headers with `createHmac("sha256", secret)` over `timestamp + method + requestPath + body`, base64. `placeOrder`, `uploadAiLog` and `lastPrice` all send real HTTPS when `hasCredentials()` is true. `pathFor()` rewrites `/capi/v3/` to `/capi/v3/sim/` on the sim venue, which is the whole live/shadow switch.
- **`lib/agent.ts` is a real model chain.** `viaAnthropic()` calls `client.messages.create` with a `record_decision` tool and `tool_choice`. `viaClaudeCli()` spawns `claude -p --output-format text --model haiku` with the prompt on stdin, availability cached from `claude --version`. `viaMock()` is the deterministic floor.
- **`lib/valve.ts` is the finished mechanism.** Halt at -2.0% ledger, throttle at -0.5% or 5% max drawdown, cold start at 0.5x under 6 closed trades, quota clamp, 2% stop with a 2:1 target. Nothing here is stubbed.
- **`app/api/decide/route.ts` wires all of the above together for real**, including the branch where a rejection still posts to `uploadAiLog`.
- **Attribution is real** (Phase 2). `lib/attribution.ts` parses the `client_oid` an order went out with, matches the closed fill to the thesis that opened it, adds the realized PnL, recomputes `realizedPnlPct` against deployed capital, increments trades and wins, and tracks the running peak to trough drawdown. A fill that does not parse to a known thesis is skipped, never guessed at, and a fill whose `orderId` was already counted is skipped, so the job is safe to run twice.
- **The uploadAiLog queue is real** (Phase 2). Every decision writes its record to the store before the POST is attempted, the record is marked sent only on `code: "00000"`, and `POST /api/queue` replays what is unsent in `postedAt` order, stopping at the first refusal.
- **Quota is spent server side** (Phase 2). `DecisionConsole` no longer moves the ledger with arithmetic of its own; it renders the thesis rows the decide route hands back.
- **The edges are validated** (Phase 2). Both mutating routes parse their body with a zod schema from `lib/schemas.ts` before any other logic, and every failure answers `{ ok: false, error, hint }` with a code from `lib/errors.ts`.

### What is mocked, and exactly where

- **`lib/data/seed.json` behind `lib/store/seed.ts` is still the persistence layer.** There is no database. State lives at module scope, so a decision moves the ledger for as long as that server instance stays warm and a cold instance starts from the seed values again. These `LedgerStore` methods read seed fixtures in both stores, `fake` and `real` alike: `listPositions`, `listMarkets`, `listSignals`, `getSignal`, `account`, and the four prior records in `listLogs`. `listTheses`, `getThesis`, `spendQuota`, `applyRealized`, `enqueueLog`, `markLogSent` and `queueDepth` operate on live state, seeded at boot.
- **`syncAttribution()` returns `{ applied: 0 }` on the seed store** by design. There is no exchange to read, and the seeded ledger is already the finished number. Only `ADAPTER_MODE=real` plus WEEX credentials reaches the real one.
- **The WEEX position history field names in `closedFills()` are unverified.** `PATH_FILLS` is `/capi/v3/position/history` and the normalizer reads the handful of spellings the v3 surface uses elsewhere. Every row is validated through `FillSchema` and a row that does not parse is dropped. Check this against the live doc before trusting the first real attribution.
- **`placeOrder()` in `lib/weex.ts`**, inside `if (!hasCredentials())`: returns a deterministic mock fill with fixed slippage (4bp sim, 7bp live) instead of calling WEEX. Marked in place. The live branch below it is complete.
- **`uploadAiLog()` in `lib/weex.ts`**, inside `if (!hasCredentials())`: returns `{ accepted: false, queued: true }` instead of posting. This is the correct behavior for an un-allowlisted UID too, so it doubles as the queue path.
- **`lastPrice()` in `lib/weex.ts`**: returns the caller's fallback when there are no credentials.
- **`viaMock()` in `lib/agent.ts`**: the offline explanation writer. `fixtures/judgement.json` sits above it, used only when the model answered but the answer failed `JudgementSchema`.

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

---

## Phase 2 log

**Goal.** Make one mechanism real: thesis attribution and the durable uploadAiLog queue, behind a
store adapter, with the seed kept as a permanent fallback. Closed fills coming back from WEEX are
matched to the thesis that opened them by `client_oid`, their realized PnL lands on that thesis
ledger, and `lib/valve.ts` sizes the next order from a number that was earned rather than typed into
a seed file.

**Status.** All five slices landed. Nothing was cut. Unverified: every item that needs a command
(`npm install`, `npm run build`, `npm test`, the Vercel deploy). The Phase 2 agent had Write, Edit,
Read, Glob and Grep only and could run none of them.

**The mechanism that went real:** attribution, plus the queue write that happens before the POST.
The wow step still runs on `ADAPTER_MODE=fake`, because the seeded `TH-SQZ-LONG` ledger already reads
-2.14% over 7 closed trades and the valve does the rest. No branch on the wow path needs
`ADAPTER_MODE=real`.

### Decisions

- **`zod` added, the one dependency authorized for this phase.** It is at the three edges only: the
  request bodies, the model answer, the WEEX envelope and the fill rows. Nothing else in the repo
  imports it.
- **`lib/adapter.ts` is now a tombstone.** The three method adapter could not express writes, and
  this phase needed four of them (spend quota, apply realized, enqueue, mark sent). The seam is
  `LedgerStore` in `lib/store/`, and `lib/store/index.ts` is the only module in the repo that reads
  `ADAPTER_MODE`. **The runner should `git rm lib/adapter.ts` and `git rm lib/data.ts`;** the agent
  has no shell and no delete tool.
- **The real store delegates everything except the ledger to the seed store, on purpose.** WEEX
  cannot answer "what are my six written theses" or "what is in the signal queue". A real store that
  returned empty lists for those would blank three panels the moment `ADAPTER_MODE=real` was set.
- **`lib/attribution.ts` has zero runtime imports, types only.** That is what lets `node --test` load
  it with no bundler and no environment. The cost is one duplicated literal: the `stele` client_oid
  prefix appears in `lib/config.ts` as `CLIENT_OID_PREFIX` and again in `attribution.ts` as a default
  parameter. Every call site in the app passes the config value in explicitly.
- **Tests build their import specifier at runtime.** Node needs the real `.ts` extension to load a
  sibling module, `tsconfig.json` is on the never-touch list and `allowImportingTsExtensions` is off
  there, so a static import ending in `.ts` would fail the build (TS error 5097). The test files
  build the specifier from a template literal and put the module type back on with a cast. If the
  never-touch list ever opens, set `allowImportingTsExtensions: true` and make these plain static
  imports.
- **The `ApiResponse` failure arm carries `{ error, hint }`.** The code is a `SteleErrorCode` union
  the console switches on, the hint is for a human. `components/DecisionConsole.tsx` maps each code
  to one line of copy and never reads message text.
- **Quota spending moved from the browser to the route.** `DecisionConsole.evaluate()` used to add
  the notional to the thesis row itself, which is exactly the fake forward motion this phase was
  meant to remove. The route calls `spendQuota()` and returns the thesis rows.
- **The queue replay stops at the first refusal.** Replaying record three while record two is still
  missing puts the evidence trail out of order, and the order is the part that makes it evidence.
- **`DEMO.md` was rewritten from six steps to the five step shot list** in section 3 above, with step
  4 marked as the wow step and each step naming the phase that made it real. The phase brief said the
  file did not exist; it did, from Phase 1.

### Failed attempts

None. The WEEX fills integration stayed inside its 45 minute fence: `closedFills()` is written,
normalizes the row spellings the v3 surface uses elsewhere and validates every row through
`FillSchema`, but the field names on `/capi/v3/position/history` are **unverified against the live
doc**. That is the one thing to check before trusting a real attribution run. It cannot break the
demo: with no credentials `closedFills()` returns `[]` and the seeded ledger stands.

### Files changed

New: `lib/config.ts`, `lib/errors.ts`, `lib/schemas.ts`, `lib/attribution.ts`, `lib/cache.ts`,
`lib/observability.ts`, `lib/store/types.ts`, `lib/store/seed.ts`, `lib/store/weex-store.ts`,
`lib/store/index.ts`, `app/api/queue/route.ts`, `prompts/decision-record.ts`,
`fixtures/judgement.json`, `tests/valve.test.ts`, `tests/attribution.test.ts`,
`tests/schemas.test.ts`, `.farm-commits.json`.

Edited: `lib/types.ts`, `lib/weex.ts`, `lib/agent.ts`, `app/console/page.tsx`, `app/log/page.tsx`,
`app/api/decide/route.ts`, `app/api/ledger/route.ts`, `app/api/log/route.ts`,
`components/DecisionConsole.tsx`, `components/DecisionLog.tsx`, `package.json`, `.env.example`,
`DEMO.md`, `README.md`, `HANDOFF.md`.

Tombstoned: `lib/adapter.ts` (joins `lib/data.ts`).

### Commands run

None, the agent has no shell. The runner runs `npm install`, `npm run build` and `npm test`.

### Env keys the runner must fill

No new keys this phase. Every key below already has a line in `.env.example`, and the app builds and
renders with all of them unset.

- `ADAPTER_MODE` optional, default `fake`. Set to `real` only once the allowlist has landed and there
  are closed fills to read.
- `WEEX_API_KEY`, `WEEX_API_SECRET`, `WEEX_API_PASSPHRASE` required for any real call. Without all
  three, `hasCredentials()` is false and every WEEX function returns its shaped mock.
- `WEEX_API_HOST` optional, defaults to `https://api-contract.weex.com`.
- `WEEX_VENUE` optional, defaults to `sim`.
- `ANTHROPIC_API_KEY` required for the recording, so the header reads "Anthropic API".
- `ANTHROPIC_MODEL` optional, defaults to `claude-opus-5`.

### Open questions

- **The `realizedPnlPct` denominator disagrees with the seed, and this matters.** The phase brief
  specifies recomputing the percent against `quotaUsedUsdt`, and `lib/attribution.ts` does that. The
  seed values use a different denominator: `TH-SQZ-LONG` reads -21.4 USDT at -2.14%, which is
  -21.4 against about 1000 USDT of cumulative deployed notional, not against the 148.2 USDT of
  current round quota. So the same closed loss reads roughly eight times larger under attribution
  than it does in the seed, and the -2.0% halt line trips much sooner in `real` mode than in `fake`.
  It cuts risk rather than adding it, and the demo is unaffected because `fake` applies nothing, but
  the two definitions have to be reconciled before a live round. The clean fix is a `deployedUsdt`
  field on `Thesis` that accumulates notional across trades, separate from the per round quota.
- **Does the ledger keep `quotaUsdt` per round or cumulative across all five?** Still open from Phase
  1. The seed treats it as per round, 150 USDT each.
- **Does `/console` need to refresh without a click?** The ledger now moves when a fill is attributed,
  and the page only re-reads on navigation. Still no polling and no SSE, deliberately: Phase 3 owns
  that call.
- **`app/api/ledger/route.ts` and `app/api/log/route.ts` still have no consumer.** They now read
  through `getStore()` like everything else, so they are ready for a polling client.

### Acceptance gate, checked by reading files

- **Both stores implement `LedgerStore`, `getStore()` defaults to seed.** `lib/store/seed.ts:70`
  (`export const seedStore: LedgerStore`), `lib/store/weex-store.ts:21`
  (`export const weexStore: LedgerStore`), `lib/store/index.ts:21` and `:31`.
- **No page or client component imports a store implementation.** `app/console/page.tsx:8` and
  `app/log/page.tsx:11` import `getStore`; the four client components pull no repo module beyond
  `@/lib/types`, `@/lib/errors` (type only), `@/lib/format`, `@/lib/valve` and each other.
- **Configuration is in one file.** `lib/config.ts` holds the host, the four v3 paths, the timeouts,
  the retry count, the model name, the client_oid prefix and the eight allowed symbols. The four env
  keys it reads (`WEEX_API_HOST`, `WEEX_VENUE`, `ANTHROPIC_MODEL`, `ADAPTER_MODE`) all have a line
  and a comment in `.env.example`.
- **Tests.** `tests/valve.test.ts`, `tests/attribution.test.ts`, `tests/schemas.test.ts`.
  `package.json:10` has `"test": "node --test tests/*.test.ts"`, and README documents it with the
  Node 22.18 requirement. **Unverified: the agent cannot run it.**
- **The wow step runs on `fake`.** `lib/store/index.ts:31` returns the seed store by default,
  `app/api/decide/route.ts:85` calls `valveFor`, `lib/valve.ts:42` halts at `-2.0%`, and the seeded
  `TH-SQZ-LONG` sits at `-2.14%` (`lib/data/seed.json:21`). Nothing on that path reads the WEEX store.
- **Both mutating routes validate first.** `app/api/decide/route.ts:57` and
  `app/api/queue/route.ts:56`, both schemas exported from `lib/schemas.ts`.
- **Secret boundary.** No `NEXT_PUBLIC_` prefix anywhere in the repo. The three WEEX secrets are read
  only inside `lib/weex.ts` (`hasCredentials()`, `sign()` and the header block at `:104-110`),
  `ANTHROPIC_API_KEY` only at `lib/agent.ts:83`, and no file with `"use client"` imports either
  module.
- **Timeout and retry constants.** `lib/weex.ts:75` and `:86`, `lib/agent.ts:125`, `:155` and `:168`.
  One retry, no loop.
- **Error shape.** `lib/errors.ts:7` is the six member union; every `NextResponse.json` failure in
  the four routes spreads `fail(code, hint)`.
- **Model answer parsed, fixture fallback exists.** `lib/agent.ts:135` (`JudgementSchema.safeParse`)
  and `:147` (`return fromFixture()`), `fixtures/judgement.json`.
- **Cache and prompts.** `lib/cache.ts:14` (`hashInput`) keyed by the prompt hash,
  `prompts/decision-record.ts` holds every line of prompt text.
- **Trace lines.** `store selected` and `store: falling back to seed` in `lib/store/index.ts`,
  `valve decided`, `model answered`, `shadow fill`, `live fill`, `log queued`, `log accepted` in
  `app/api/decide/route.ts`, `attribution applied` in `lib/store/weex-store.ts`. Ids, counts and
  lengths only, no payloads and no keys.
- **Seed still keeps the console non-empty with zero env vars.** `lib/store/seed.ts` clones the six
  theses, three positions, three market rows, four signals and four log records at module load.

Honest gaps:

- **Every command is unverified.** `npm install`, `npm run build`, `npm test` and the Vercel deploy
  are the runner's job. Nothing in this log claims a command was run.
- **`lib/agent.ts` still contains long string literals in `viaMock()`.** They are the offline stub's
  output, not prompt text, and the brief said `viaMock()` stays exactly as it is. All prompt text is
  in `prompts/decision-record.ts`.
- **The `realizedPnlPct` denominator conflict above is real and unresolved.** It is the one thing in
  this phase where the spec and the seed data disagree, and the spec was followed.
- **Two files in the brief do not exist under those names.** The console is `app/console/page.tsx`,
  not `app/page.tsx` (Phase 1 moved it and `/` is the landing page), and `lib/data.ts` has been a
  tombstone since Phase 1, so the seed lives in `lib/data/seed.ts`.

### Next best step for Phase 3

Verify `/capi/v3/position/history` against the live doc and fix the field names in `normalizeFill()`
in `lib/weex.ts` if they differ. That one function is the only thing standing between the current
build and a real attributed ledger. Then reconcile the `realizedPnlPct` denominator above, because
the valve reads that number and the valve is the product.
