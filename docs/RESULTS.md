# Stele: live account results

**This file is empty on purpose and every cell is marked `to fill`.**

The competition ranks on live futures trading performance across five consecutive weekly rounds,
weighted on return performance, risk control and strategy stability. This repo is the agent that
produces those numbers and the evidence trail behind them. It is not a substitute for them, and no
number below may be written by an agent.

**A blank cell here is honest. A guessed one is disqualifying.** `fabricating AI logs` is named as a
prohibited behavior on the WEEX rule page, https://www.weex.com/api-doc/ai/introduction/Rule, and a
team that cannot present valid evidence of AI participation is removed from the ranking,
https://www.weex.com/api-doc/ai/UploadAiLog. Fill this file by hand from the WEEX account, not from
the console, and not from `lib/data/seed.json`.

**Nothing in this file is seeded data.** The `-2.14% over 7 closed trades` figure that appears in
`README.md` and `DEMO.md` is a **seed** value in `lib/data/seed.json` that drives the refusal step of
the demo. It is not an account result and it does not belong in any table here.

## Per round

Round dates are unpublished. The DoraHacks detail page still says timing will be announced, so the
`dates` column is filled from the official schedule once it exists, not guessed.

| Round | Dates | Starting equity | Ending equity | Realized PnL | Max drawdown | Closed trades | Refusals | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | to fill | to fill | to fill | to fill | to fill | to fill | to fill | to fill |
| 2 | to fill | to fill | to fill | to fill | to fill | to fill | to fill | to fill |
| 3 | to fill | to fill | to fill | to fill | to fill | to fill | to fill | to fill |
| 4 | to fill | to fill | to fill | to fill | to fill | to fill | to fill | to fill |
| 5 | to fill | to fill | to fill | to fill | to fill | to fill | to fill | to fill |

`Refusals` is the count of `stage: "rejection"` records in the uploadAiLog trail for that round. It
is the risk control column: a round with refusals in it is a round where the valve did its job.

## Per thesis, round over round

The six theses are the ones written down before the round, ids as they appear in `lib/data/seed.json`
and in the console ledger. This table is where the strategy stability claim lands: a thesis whose
realized PnL holds its shape across rounds is stable, and one that does not is the reason the valve
exists.

| Thesis | Name | R1 realized PnL | R2 | R3 | R4 | R5 | Closed trades, total | Times halted |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `TH-SQZ-LONG` | Crowded Short Squeeze | to fill | to fill | to fill | to fill | to fill | to fill | to fill |
| `TH-OI-BREAK` | Open Interest Breakout | to fill | to fill | to fill | to fill | to fill | to fill | to fill |
| `TH-BASIS-REV` | Basis Reversion | to fill | to fill | to fill | to fill | to fill | to fill | to fill |
| `TH-LIQ-SWEEP` | Liquidation Sweep Reclaim | to fill | to fill | to fill | to fill | to fill | to fill | to fill |
| `TH-VOL-CRUSH` | Post Event Volatility Crush | to fill | to fill | to fill | to fill | to fill | to fill | to fill |
| `TH-TREND-PB` | Trend Pullback to Anchored VWAP | to fill | to fill | to fill | to fill | to fill | to fill | to fill |

## Sim run: the 11 step WEEX API checklist

Run this on `/capi/v3/sim` before anything touches the live venue. `WEEX_VENUE=sim` is the default,
and `pathFor()` in `lib/weex.ts` is the whole switch. Record the response and the timestamp for each
step, so the allowlist wait is measurable and the live run has a baseline.

| # | Step | Endpoint or control | Result | Timestamp | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Query account balance | to fill | to fill | to fill | to fill |
| 2 | Set leverage on the symbol | to fill | to fill | to fill | to fill |
| 3 | Read the last price | `/capi/v3/sim/market/ticker` | to fill | to fill | to fill |
| 4 | Place an order, minimum 10 USDT trade size | `/capi/v3/sim/order/placeOrder` | to fill | to fill | to fill |
| 5 | Confirm the exchange-side take profit and stop loss attached at entry | to fill | to fill | to fill | to fill |
| 6 | Read the open position back | to fill | to fill | to fill | to fill |
| 7 | Close the position | to fill | to fill | to fill | to fill |
| 8 | Read the closed position history | `/capi/v3/sim/position/history` | to fill | to fill | to fill |
| 9 | Post an `order` record to uploadAiLog | `/capi/v3/sim/order/uploadAiLog` | to fill | to fill | to fill |
| 10 | Post a `rejection` record to uploadAiLog | `/capi/v3/sim/order/uploadAiLog` | to fill | to fill | to fill |
| 11 | Confirm the UID is allowlisted, so neither post queues | to fill | to fill | to fill | to fill |

The step numbers, the balance, leverage, price, place, close and the 10 USDT minimum come from the
checklist recorded in `DELIVERY.md`. The remaining five rows are this repo's own path and are marked
as such: steps 5 and 8 through 11 exercise `bracketFor()`, `closedFills()` and `uploadAiLog()`.
**The 11 items were not read from a published WEEX list during the build**, so confirm the wording
against the official doc before treating this table as the checklist itself.

## What is still missing when this file is empty

- No live account results exist yet. Nothing in this repo produces one.
- The allowlist has to clear before `uploadAiLog` accepts a write at all, so steps 9 through 11
  cannot pass until it does.
- Round start and end dates are unpublished, so the `dates` column has no source yet.
- Starting capital and the leverage cap for season 2 are unconfirmed. Season 1 had the organizer
  deposit 1,000 USDT with leverage capped at 20x, and that has not been confirmed for AI Wars II.
