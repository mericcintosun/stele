# Stele

A WEEX perpetual futures agent that ties every order to a named thesis, keeps a realized profit and loss ledger for each one, and cuts the capital of any thesis that is losing money.

The entry screen is **`/console`**: the thesis ledger, the market strip, the open positions, the signal queue and the uploadAiLog stream on one page. `/log` holds the full audit trail. The landing page at `/` explains the mechanism. All three run on seeded data with no environment variables set, so the loop is inspectable before the API allowlist clears. `DEMO.md` walks the 90 second sequence step by step.

> Live demo: https://stele.vercel.app
>
> Video: `<ADD_VIDEO_URL>`

## The problem

WEEX AI Wars II runs five consecutive weekly live trading rounds, and the ranking weighs three things together: return performance, risk control, and strategy stability. WEEX published the Season 1 postmortem themselves, and put the failure in the headline: **80% win rate to 40% drawdown**. Agents with good hit rates still ended the round deep in drawdown.

The cause is almost always the same. The agent keeps reproducing the same broken reason all week, because it has no record of which reason lost money. It has a total PnL and nothing else. Ask a solo agent operator on Friday night which of their ideas killed them, and they cannot answer.

## The solution

Stele refuses to let an order exist without a reason attached to it.

1. Before the round starts, six theses are written down: each with a name and an entry condition. Example: *funding under -0.02% for three settlements while open interest adds more than 4% in an hour, take the squeeze long.*
2. When a signal arrives, it is matched to one of those written theses. A signal matching none of them never becomes an order.
3. The order goes out over WEEX OpenAPI v3. The same decision is posted to `/capi/v3/order/uploadAiLog` with `stage`, `model`, `input`, `output` and a 1000 character `explanation`. The returned `orderId` pairs the fill with the thesis.
4. When the position closes, its realized PnL is written back to that thesis. `POST /api/attribute` does it for one named position, and the attribution job in `lib/store/weex-store.ts` does it in bulk from WEEX closed fills. Both end in the same `applyFillToThesis()` call, so the two paths cannot drift.
5. The size of the next order comes from that thesis's own ledger, not from the agent's overall performance. A thesis at or past the halt line drops to zero capital, and the agent refuses its own order. The refusal is posted to the same log endpoint.

The wow moment is step 5 running live: the agent proposes a long, the `TH-SQZ-LONG` ledger reads -2.14% over 7 closed trades, the valve multiplier goes to 0.00x, a red **REFUSED** row appears, and WEEX returns a receipt for the bot saying no.

## How it uses the required tech

**WEEX OpenAPI v3** (`lib/weex.ts`). One module, both paths in the same functions. With `WEEX_API_KEY`, `WEEX_API_SECRET` and `WEEX_API_PASSPHRASE` set, every call is HMAC SHA256 signed (`ACCESS-KEY` / `ACCESS-SIGN` / `ACCESS-TIMESTAMP` / `ACCESS-PASSPHRASE`) and sent to `api-contract.weex.com`. Without them the same functions return shaped mock envelopes so the console is inspectable before the API allowlist clears. Covered: `placeOrder` with preset take profit and stop loss, `uploadAiLog`, and `market/ticker`. `WEEX_VENUE=sim` rewrites `/capi/v3/` to `/capi/v3/sim/`, which is how the shadow run works: every decision fills on sim first, then live, and the console shows both prices side by side.

**uploadAiLog as the ledger, not as paperwork.** WEEX disqualifies teams that cannot produce valid evidence of AI participation, and only allowlisted UIDs may post. Stele writes `stage`, `model`, `input`, `output` and the explanation on every decision including rejections, truncated to the 1000 character limit inside `uploadAiLog()` rather than at the call site. The record is written to the store queue before the POST is attempted, so a rejected write is a queued record rather than a lost one. `POST /api/queue` replays the unsent records oldest first and stops at the first refusal, because a trail out of order is not evidence. The queue depth is visible in the console header.

**Anthropic model chain** (`lib/agent.ts`). Three links, tried in order, all returning the same shape: the Anthropic SDK with structured tool output when `ANTHROPIC_API_KEY` is set, then the developer's local `claude` CLI, then a deterministic offline stub. The model does exactly two jobs: confirm the signal satisfies the written precondition, and write the explanation that goes to WEEX. It never sizes the order. Sizing is arithmetic in `lib/valve.ts`, which is why a losing thesis loses its funding whether or not the model still likes it.

The recorded demo must run with `ANTHROPIC_API_KEY` set. The local CLI path exists so a developer can see real agent behavior with no keys; it is not the submission path.

## Tech stack

- Next.js 15 (App Router), TypeScript strict, Tailwind CSS v4
- WEEX OpenAPI v3 over `fetch` with `node:crypto` HMAC SHA256 signing, no third party client
- `@anthropic-ai/sdk` with tool-based structured output, validated with `zod` before it is trusted
- Route handler on the Node runtime for the decision loop, deploys to Vercel with no custom server
- `node:test` for the pure modules: the valve, attribution and the edge schemas

## Quickstart

```bash
npm install
cp .env.example .env.local   # every variable is optional
npm run dev                  # http://localhost:3000
```

Then click **Run decision loop** on the first SOL signal. Its thesis is under water, so the valve refuses the order and posts the refusal.

With no environment variables at all: WEEX calls return mock fills, the model chain falls to the local `claude` CLI if installed and to the offline stub otherwise. With `ANTHROPIC_API_KEY` set: real model calls. With the three WEEX keys set and `WEEX_VENUE=sim`: real signed calls to the demo futures endpoints.

```bash
npm run build        # production build, the deploy gate
npm test             # node:test over the valve, attribution and the edge schemas
npm run seed         # validates lib/data/seed.json, writes public/seed-manifest.json
npm run demo:reset   # puts the running app back to the opening frame of DEMO.md
```

## Store setup

The round is server state. Every decision, the quota it spends, the position it opens and the
uploadAiLog record it writes go into one JSON snapshot that `lib/store/round.ts` owns, which is why
the refusal in step 4 of DEMO.md is still on screen after a hard refresh.

Two environment variables, **both optional**:

```
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

Any Upstash compatible Redis REST endpoint works, over plain `fetch` with no client library. On
Vercel, add the Upstash integration and it fills both in. On Upstash directly, copy them from the
database page under "REST API". They are server only and neither carries a `NEXT_PUBLIC_` prefix.

Without them the same snapshot lives in a module scope singleton instead. Every step of DEMO.md still
works, a decision still survives a page reload while the process is up, and only a restart or a cold
serverless instance sends the round back to its opening values. `lib/store/round.ts` is the only file
in the repo that touches either driver.

**There is no migration command in this build, and no SQL.** The store holds one document and seeds
itself from `lib/store/fresh.ts` on the first read, so a fresh database needs no setup at all.
`npm run seed` is a different thing: it validates `lib/data/seed.json` and writes
`public/seed-manifest.json`, and it does not touch the store.

## Reset the demo

```bash
npm run demo:reset                                        # http://localhost:3000
STELE_BASE_URL=https://stele.vercel.app npm run demo:reset # the deployed console
```

It posts to `/api/reset` and prints the thesis, position, signal and log counts that came back, plus
which driver answered. The **Reset round** control in the console header does the same thing. Run it
before every take of the recording: the round persists on purpose, so without a reset the second take
opens on the first take's leftovers.

`npm test` runs `node --test tests/*.test.ts` and needs **Node 22.18 or newer**, which strips TypeScript types natively. There is no test build step and no test framework in `devDependencies`.

**`ADAPTER_MODE` picks where the ledger comes from.** `fake`, the default, reads the seed ledger in `lib/data/seed.json`. `real` reads closed positions from WEEX and attributes them: each fill carries the `client_oid` its order went out with, shaped `stele-<thesisId>-<signalId>-<timestamp>`, so the realized PnL lands on the thesis that opened the trade and the valve sizes the next order from a number the agent earned. `lib/store/index.ts` is the only module that reads the variable, and it falls back to the seed when the value is anything but `real` or when the WEEX credentials are missing, so a typo in a dashboard variable degrades to seeded data instead of a 500. The deployed demo and the recording run on `fake`.

## What we would build next

- Round rollover: carry the thesis ledger across the five weekly rounds and nothing else, then chart per-thesis equity curves so drift is visible before it becomes drawdown.
- A signal source per thesis, reading funding and open interest from WEEX market endpoints on a timer, instead of the seeded queue.
- Refresh without a click: the ledger moves when a position closes, and today that only shows on the next navigation or the next decision.
- A compare and set on the round write. One blob and one demo operator means a lost update is not reachable today, but two agent processes writing the same round would need it.

## AI use

We used AI coding assistants for scaffolding and boilerplate. Architecture, product decisions, and final code review are our own.

Separately, and this is the product rather than the process: the shipped agent calls a Claude model at decision time to match signals to written theses and to author the compliance explanations posted to WEEX. That usage is logged to `/capi/v3/order/uploadAiLog` on every decision, which is the evidence trail the competition requires.
