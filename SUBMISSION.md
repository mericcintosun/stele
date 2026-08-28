# Stele: submission copy

Copy-paste material for the destinations that actually exist. Read the reality note first, because
this hackathon does not work the way a hackathon submission file usually assumes.

**No character limit below is known**, except the one that is in the code rather than in a form: the
WEEX `explanation` field is capped at 1000 characters, enforced inside `uploadAiLog()` in
`lib/weex.ts`. If a form imposes a limit, trim from the bottom of each block rather than rewriting
it, and do not invent a count here.

---

## 1. Reality note: what this file is for

**WEEX AI Wars II requires no project submission, no presentation, no demo video, and no repo.**
Ranking is decided by live futures trading performance across five consecutive weekly rounds,
evaluated on return performance, risk control and strategy stability weighted together. There is no
judging form and nobody is scoring this README.

So this file exists for three real destinations and nothing else:

1. **The WEEX AI agent partner Google Form.** The AI side is joined through a separate application,
   not through the main registration. Paste from the blocks below.
2. **The AI model token allocation** (`100 milyon AI model token`), which is awarded on proof of real
   model usage. That proof is `/evidence` and the uploadAiLog trail behind it.
3. **A DoraHacks BUIDL page**, if the human chooses to publish one. Optional, not required by the
   organizers.

Everything else in this repo, the console included, is there because it makes the trading agent
inspectable and its AI participation provable. Not because a form asked for it.

## 2. Tech stack, authoritative

**This block supersedes every earlier stack listing, including the one in the hackathon idea record.**
If a description elsewhere says Python, FastAPI, SQLite or a systemd timer, that listing is
superseded by this repo: there is no Python file, no database and no timer in it. The round store is
one JSON snapshot owned by `lib/store/round.ts`, held in a module scope singleton by default and in
an optional Upstash compatible Redis REST endpoint when `KV_REST_API_URL` and `KV_REST_API_TOKEN` are
set. Nothing else persists anything.

| Layer | What it actually is | File you can open |
| --- | --- | --- |
| Framework | Next.js 15, App Router, no custom server | `app/api/decide/route.ts` |
| Language | TypeScript, strict | `lib/valve.ts` |
| Styling | Tailwind CSS v4, tokens in the `@theme` block, no `tailwind.config.js` | `app/globals.css` |
| WEEX client | `node:crypto` HMAC SHA256 signing over plain `fetch`, no third party client library | `lib/weex.ts` |
| Model | `@anthropic-ai/sdk`, `client.messages.create` with a tool and `tool_choice` | `lib/agent.ts` |
| Validation | `zod` over the model answer and the edge schemas | `lib/schemas.ts` |
| Tests | `node:test`, no test framework in `devDependencies` | `tests/valve.test.ts` |
| Store | one JSON round snapshot, optional Redis REST, no ORM and no SQL | `lib/store/round.ts` |
| Deploy | Vercel, standard Next build | `next.config.ts` |

The npm scripts are `dev`, `build`, `start`, `seed`, `demo:reset` and `test`, all at
`package.json:6-11`. There is no migration command, because there is nothing to migrate.

## 3. Title and tagline

**Stele**

A WEEX perpetual futures agent that ties every order to a named thesis, keeps a realized profit and
loss ledger for each one, and cuts the capital of any thesis that is losing money.

## 4. One paragraph description

An agent with a single total PnL number cannot say which of its ideas lost the money, so it keeps
running the broken one all week. WEEX published their own Season 1 headline as 80% win rate to 40%
drawdown. Stele writes six theses down before the round starts, refuses to let an order exist without
one attached, and keeps a realized PnL ledger per thesis. The size of the next order comes from that
thesis's own ledger, not from the agent's overall performance, so a losing reason loses its funding
whether or not the model still likes it. A thesis past the halt line gets zero capital and the agent
refuses its own order, and the refusal is posted to WEEX as evidence exactly like an order would be.

## 5. Full description

**What it is.** A Next.js console over a WEEX OpenAPI v3 trading agent. One screen shows the six
written theses with their realized PnL, the market strip, the open positions, the signal queue and
the uploadAiLog stream. `/evidence` shows the full AI participation receipt trail.

**How it works, the four step loop.**

1. **Write the theses down.** Six named entry conditions, fixed before the round. Example: funding
   under -0.02% for three settlements while open interest adds more than 4% in an hour, take the
   squeeze long.
2. **Match the signal.** A signal arrives and a Claude model confirms it satisfies one written
   precondition. A signal matching none of them never becomes an order.
3. **Size it with arithmetic, not with the model.** `lib/valve.ts` reads that thesis's ledger: halt
   at -2.0%, half size at -0.5% or 5% max drawdown, 0.5x cold start under 6 closed trades, plus a
   cumulative quota clamp. The order goes out with exchange-side take profit and stop loss attached
   at entry.
4. **Write the close back.** Realized PnL from a closed position lands on the thesis that opened it,
   matched by the `client_oid` the order carried. The ledger moves, and the valve sizes the next
   order from a number the agent earned.

**Which sponsor tech is load-bearing.**

- **WEEX OpenAPI v3, HMAC SHA256 signed client in `lib/weex.ts`.** `ACCESS-KEY` / `ACCESS-SIGN` /
  `ACCESS-TIMESTAMP` / `ACCESS-PASSPHRASE` built with `node:crypto` over
  `timestamp + method + requestPath + body`, base64, no third party client library. Covers
  `placeOrder` with preset TP and SL, `uploadAiLog`, `market/ticker` and closed position history.
- **`POST /capi/v3/order/uploadAiLog` on every decision including refusals.** The record is written
  into the round before the POST is attempted, marked sent only on `code: "00000"`, and replayed
  oldest first by `POST /api/queue`, stopping at the first refusal because a trail out of order is
  not evidence.
- **The `/capi/v3/sim` shadow venue.** `pathFor()` rewrites `/capi/v3/` to `/capi/v3/sim/`, so every
  decision fills on simulation first and then live, and the console shows both prices side by side.
  Going live is one environment variable, `WEEX_VENUE=live`.
- **Anthropic, `lib/agent.ts`.** `client.messages.create` with a `record_decision` tool and
  `tool_choice`, answer validated with `zod` before it is trusted.
- **The official WEEX Trader Skill integration** is installed on the operator's agent host and is
  **not vendored into this repo**. `docs/TRADER-SKILL.md` carries the install command, the four
  official skill names, the `weex-agent-skills` repository URL, and a table mapping each skill to the
  call here that covers the same ground. The mapping is an equivalence, not a substitution: the
  install remains a required human step, tracked in `DELIVERY.md`.

**Real vs mocked. The mocked list is not optional and it is complete.**

Real:

- `lib/weex.ts` sends genuinely signed HTTPS when all three WEEX keys are set.
- `lib/valve.ts` is finished arithmetic, pure, no stub anywhere in it.
- `lib/agent.ts` makes real Anthropic API calls when `ANTHROPIC_API_KEY` is set.
- `lib/attribution.ts` really matches a closed fill to its thesis by `client_oid`, is idempotent per
  `orderId`, and skips a fill it cannot parse rather than guessing.
- The round is real server state: a decision survives a hard refresh.

Mocked:

- **`lib/data/seed.json` behind one round blob is the whole persistence layer.** There is no
  database, no ORM, no closed trade table and no history of a round that has ended.
- **`placeOrder()` and `uploadAiLog()` return shaped mocks when `hasCredentials()` is false**, inside
  their `if (!hasCredentials())` branches. `lastPrice()` returns the caller's fallback. This is what
  makes every screen work with zero environment variables, and it is also the correct behavior for a
  UID that is not yet on the uploadAiLog allowlist.
- **The real attribution job does not run on a timer.** `lib/store/weex-store.ts` reads
  `/capi/v3/position/history` and those field names are still unverified against the live WEEX doc.
  Only `ADAPTER_MODE=real` plus WEEX credentials reaches it. The console's on-screen close
  (`POST /api/attribute`) is the path a judge actually exercises.
- **The uploadAiLog queue has no retry timer.** It replays on demand only.
- The deployed demo and the recording run on `ADAPTER_MODE=fake`.

## 6. Tracks applied for

| Track | Prize (as recorded) | Rests on |
| --- | --- | --- |
| `AI Team` | `200,000 USDT ana ödül havuzunun paylaşımı` | `lib/weex.ts`, DEMO.md steps 2 and 4 |
| `AI model token ödülü` | `100 milyon AI model token` | `lib/agent.ts` plus uploadAiLog, DEMO.md steps 2 and 5 |
| `Early bird pool` | `52,000 USDT` | registration timing, no code path |
| `New user pool` | `20,000 USDT` | a new WEEX UID through KYC, no code path |

**`AI Team` and `Human Team` are mutually exclusive.** The side is chosen before the competition
starts and cannot be changed once it begins. We are on AI Team, and picking the wrong side ends this
entry.

The prize amounts are as announced and **not independently verified**: the DoraHacks prize page
returned HTTP 405 on every URL tried during research, and the content was only ever read through an
`r.jina.ai` mirror. The within-side distribution is not published anywhere we could read.

## 7. Links

| What | URL |
| --- | --- |
| Live console | https://stele-gules.vercel.app |
| Repository | https://github.com/mericcintosun/stele |
| Demo video | `<ADD_VIDEO_URL>` |

The repository URL and the live console URL are both filled in and public. Start a review at
https://stele-gules.vercel.app/console, which needs no wallet, no account and no API key. **One token
remains a placeholder rather than a URL: `<ADD_VIDEO_URL>`**, because no take has been uploaded yet.
A reader who prefers a clone has that path in the "Try it in 60 seconds" block in `README.md`.

`<ADD_VIDEO_URL>` is byte identical to the token in `README.md`, so one find and replace fixes both
files at once.

## 8. Opt-ins and separate submissions

**`DELIVERY.md` exists in this repo** and is the per-track manual checklist: entry mode, the human
action, the deadline and which DEMO.md step backs each row. Read it alongside this section rather
than instead of it.

Two requirements are separate submissions and neither is satisfied by the main registration:

1. **The WEEX AI agent partner Google Form.** The AI side is joined through this form, filed on its
   own. Its **URL is UNKNOWN**: the link was not readable during research and has not been invented.
   Find it from
   https://www.weex.com/news/detail/weex-ai-wars-ii-enlist-as-an-ai-agent-arsenal-and-lead-the-battle-418427
   Its **content and closing date were not visible either.** Do not assume the closing date matches
   the main deadline. Treat it as possibly earlier until someone confirms otherwise.
2. **WEEX API key allowlisting.** The trading UID and the server's static IP must both be submitted
   to WEEX and approved by hand by WEEX staff. Until that lands, `uploadAiLog` rejects the write and
   Stele queues it locally. There is no published turnaround, which is the reason to file it early
   rather than the reason to leave it late.

**The main deadline is 2026-09-02 15:59 UTC.** Both items above have their own unpublished timing and
neither inherits that date. Item 1's closing date is **unpublished, treat it as possibly earlier**;
item 2's approval turnaround is **unpublished, no turnaround is promised anywhere**.

### The full before-submitting list, carried from `DELIVERY.md`

Byte for byte the same items, so this file stands on its own when it is being pasted into a form.

- [ ] Side selected as **AI Team** at registration. This cannot be changed afterwards.
- [ ] WEEX API key, secret and passphrase created under API Management and set on the deploy.
- [ ] WEEX UID and the trading server's static IP submitted to the allowlist, with a timestamp
      recorded so the wait is measurable.
- [ ] The four official WEEX skills installed on the trading host with
      `npx skills add https://github.com/weex-labs/weex-agent-skills --all`:
      `weex-trader-skill`, `weex-analysis-skill`, `weex-monitor-skill`, `weex-partner-skill`. See
      `docs/TRADER-SKILL.md`.
- [ ] The 11 step API checklist passed on sim: query balance, set leverage, read price, place an
      order, close it, minimum 10 USDT trade size, and the rest. Results written into
      `docs/RESULTS.md`.
- [ ] The WEEX AI agent partner Google Form filed. Its URL is still UNKNOWN, see above.
- [ ] The live Vercel URL pasted wherever the form asks for a demo link.
- [ ] The video URL recorded and pasted in place of `<ADD_VIDEO_URL>` in README.md.
- [ ] `ANTHROPIC_API_KEY` set on the deploy before the recording, so the console header reads
      "Anthropic API" and not "offline stub".
- [ ] `npm run demo:reset` run against the live URL immediately before the take.

## 9. Known gaps

Written as gaps, on purpose.

- **No live account results yet, and none are invented.** `docs/RESULTS.md` is the empty container
  they go into: per-round equity, drawdown, closed trades and refusals, per-thesis realized PnL over
  the five rounds, and the sim run of the 11 step API checklist. Every cell in it reads `to fill`.
  The ranking is decided by live trading performance, and this repo is the agent that produces it
  plus the evidence trail behind it, **not a substitute for it**. The only concrete percentage
  anywhere in these documents, `-2.14% over 7 closed trades`, is a **seed** value in
  `lib/data/seed.json` that drives the refusal step of the demo. It is not an account number.
- **No persisted ledger.** One JSON round blob over `lib/data/seed.json` is the whole store. A reset
  puts every closed position back and the ledger back to its seed values.
- **No attribution job on a timer.** The bulk WEEX path exists but the field names on
  `/capi/v3/position/history` are unverified against the live doc, and nothing polls it.
- **The uploadAiLog queue is in-memory** in the sense that matters: it lives in the round blob and
  has no retry schedule.
- **Round dates and ranking weights are unpublished.** The DoraHacks detail page still says timing
  will be announced, and the weights of the three ranking criteria appear nowhere. Not guessed at.
- **Starting capital and the leverage cap for season 2 are unconfirmed.** Season 1 had the organizer
  deposit 1,000 USDT with leverage capped at 20x. That has not been confirmed for AI Wars II, so
  per-thesis quota stays a small percentage of account equity until it is.
- **The prize amounts and the within-side distribution are unverified**, for the HTTP 405 reason
  above.
- **The video URL is still a placeholder** until the take is recorded and uploaded, item 3 and item 4
  of the manual checklist at the end of `HANDOFF.md`. The live URL is filled in and answering.
