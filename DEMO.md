# Stele: the 90 second demo

**Two wow steps.** Step 4 is the agent refusing its own order because the thesis ledger it wrote
itself is under the halt line. Step 6 is a judge editing that memory live: close one position at a
loss and the valve reacts to it in the same second.

**Demo start route: `/console`.** Open the deployed URL, go straight there, and run the six steps
below in order. Every step works with zero environment variables set, so the recording never waits
on the WEEX allowlist.

**Before the take, run `npm run demo:reset`.** It posts to `/api/reset` and puts the round back to
the opening frame. Since Phase 3 the round is server state, not React state, so a decision persists
until something resets it. That is what makes step 5 possible and what makes the take retakeable.

**The problem sentence:** an agent with an 80% win rate still ended WEEX Season 1 in a 40% drawdown,
because it had one total PnL number and no record of which reason lost the money.

**The closing line:** it does not repeat round one's mistake in round five, because it wrote down
which reason killed it.

---

## The six steps

### 1. Cold open, one screen (0:00 to 0:12)

**Route:** `/console`

**On screen:** six theses and their realized PnL on the left, `cmt_solusdt` at 144.06 in the middle,
four open positions on the right, five signals waiting. No scrolling, no explanation.

**File that owns it:** `app/console/page.tsx`. It calls `readRound()` and passes the result straight
into `<DecisionConsole initial={...} />`, so the first frame is server rendered with no client fetch.

**Fallback branch:** none needed. `readRound()` in `lib/store/round.ts` seeds itself from
`lib/store/fresh.ts` when the key is missing, so this screen cannot render empty.

Say: "This agent allocates capital to its reasons, not to itself."

### 2. A signal is matched to a written thesis and the uploadAiLog body fills (0:12 to 0:35)

**Route:** `/console`, then `POST /api/decide`

**On screen:** press **Run decision loop** on `SIG-9107`, the BTC pullback signal bound to
`TH-TREND-PB`. Its thesis highlights and its written precondition expands. A green **ORDER SENT**
row appears. On the right the uploadAiLog body fills in with `stage`, `model`, `input`, `output` and
the explanation, then the WEEX response or the queue notice lands under it. The order goes out and
its exchange-side TP and SL join the positions table.

**File that owns it:** `app/api/decide/route.ts`. It reads the thesis out of the persisted round,
runs `lib/valve.ts`, calls `lib/agent.ts`, writes the record into the round, then posts it through
`uploadAiLog()` in `lib/weex.ts`.

**Fallback branches:** `viaMock()` in `lib/agent.ts` writes the explanation when there is no
`ANTHROPIC_API_KEY` and no local CLI. The `if (!hasCredentials())` branch in `placeOrder()` in
`lib/weex.ts` returns a deterministic mock fill when the WEEX keys are absent.

### 3. Shadow fill and live fill, side by side (0:35 to 0:47)

**Route:** `/console`, the decision row from step 2

**On screen:** both fills under the decision, with their prices and order ids, next to the notional,
take profit and stop loss.

**File that owns it:** `app/api/decide/route.ts`, the two `placeOrder()` calls: `"sim"` first, then
`venueFromEnv()`. `pathFor()` in `lib/weex.ts` is the whole switch, rewriting `/capi/v3/` to
`/capi/v3/sim/`.

**Fallback branch:** the same credential free mock path in `lib/weex.ts`, which prices the sim fill
at 4bp of slippage and the live fill at 7bp so the two are visibly different.

Say: "Every decision runs on simulation first, then live."

### 4. The refusal. First wow step (0:47 to 1:02)

**Route:** `/console`, then `POST /api/decide`

**On screen:** press **Run decision loop** on `SIG-9104`, the SOL squeeze signal bound to
`TH-SQZ-LONG`. That ledger reads -2.14% over 7 closed trades, past the -2.0% halt line. The valve
multiplier drops to `0.00x`, a red **REFUSED** row appears, `0.00 USDT deployed` is printed, and no
order reaches the exchange. The refusal is posted to `/capi/v3/order/uploadAiLog` as a
`stage: "rejection"` record.

**File that owns it:** `lib/valve.ts`, the `t.realizedPnlPct <= VALVE.haltPnlPct` branch in
`valveFor()`. `app/api/decide/route.ts` sends the rejection down the identical path an order takes.

**Fallback branch:** `uploadAiLog()` in `lib/weex.ts`, inside `if (!hasCredentials())`, returns
`{ accepted: false, queued: true }`. The record was already written into the round before the POST
was attempted, so the header counts it as `N queued for allowlist` rather than losing it.

### 5. The receipt, the evidence trail, and a hard refresh (1:02 to 1:15)

**Route:** `/console`, then `/evidence` from the nav, then back

**On screen:** the refusal receipt is in the uploadAiLog stream on the right with its 1000 character
counter. Open **Evidence** in the nav. The summary strip reads the endpoint
`/capi/v3/sim/order/uploadAiLog`, the venue, whether WEEX credentials are configured, the record
count with its accepted and queued split, the stage breakdown, the models that answered, and the
longest explanation against the 1000 character cap. On a fresh round with no decisions run yet the
strip reads `4 records, 3 accepted, 1 queued`; after steps 2 and 4 it is higher. Below it, every
record in full.

Go back to `/console` and press Cmd+Shift+R. **The refusal is still there.**

**Files that own it:** `lib/evidence.ts` and `app/evidence/page.tsx` for the strip,
`lib/store/round.ts` for the refresh. The decision, the spent quota, the new position and the log
record all live in one JSON round snapshot that the browser does not hold.

**Fallback branch:** the `memory` singleton in `lib/store/round.ts`. With `KV_REST_API_URL` and
`KV_REST_API_TOKEN` set, the refusal survives the refresh and a cold serverless instance. Without
them it survives the refresh but not a process restart, which is enough for a local recording and is
what the deploy does until the two keys are filled in.

This is the step the AI model token allocation is judged on. WEEX removes a team from the ranking if
it cannot present valid evidence of AI participation, and this page is that evidence.

### 6. Close a position and watch the valve react. Second wow step (1:15 to 1:30)

**Route:** `/console`, then `POST /api/attribute`, then `POST /api/decide`

**On screen, in this order:**

1. Point at `SIG-9118` in the signal queue, the BTC volatility crush signal bound to
   `TH-VOL-CRUSH`. Next to its button the console prints `valve 0.50x, throttled`. In the ledger on
   the left, `TH-VOL-CRUSH` reads -1.58% with a yellow **throttled** badge.
2. In the open positions table, press **Close at stop** on `POS-4475`, the `cmt_btcusdt` short on
   `TH-VOL-CRUSH`. It closes at its resting stop of 63729.60 for a realized -4.50 USDT.
3. The position row disappears. `TH-VOL-CRUSH` drops to about -2.05% over 6 closed trades, its badge
   turns red and reads **halted**, and its multiplier goes to `0.00x`. No page reload.
4. An `attribution` record appears at the top of the uploadAiLog stream, naming the thesis that was
   debited, the ledger before and after, and what the valve does about it next.
5. Press **Run decision loop** on `SIG-9118`. It is now **REFUSED**. A moment ago the same signal
   would have gone out at half size.

**Pick `POS-4475` for the camera.** It is the only open position whose thesis sits close enough to
the halt line for one closed loss to cross it, and it is the only one with a signal waiting behind
it, so the before and after are on the same screen.

**Files that own it:** `app/api/attribute/route.ts` calls `realizedFromExit()` and
`applyFillToThesis()` in `lib/attribution.ts`, writes the new thesis row and the log record into the
round, then posts the record. `components/ThesisLedger.tsx` derives the badge and the multiplier
from `valveFor()`, so the flip is the valve reading the new number, not the console drawing a state.

**Fallback branch:** the same credential free branch of `uploadAiLog()` as step 4. The attribution
record is written into the round before the POST is attempted, so an un-allowlisted UID queues it
rather than losing it.

Say the closing line here.

---

## Recording notes

- Run `npm run demo:reset` before every take. Nothing else resets the round, and the second take
  starts from a different screen than the first if you skip it.
- Set `ANTHROPIC_API_KEY` before recording so the console header reads "Anthropic API" instead of
  "offline stub". The model token allocation is awarded on proof of real model usage.
- Leave `ADAPTER_MODE` unset or at `fake` for the recording. Neither wow step needs the real
  adapter, and the seed keeps every panel non-empty.
- Running step 4 twice renders the same explanation, because `responseCache` in `lib/agent.ts` keys
  the model answer by a hash of the prompt. The second take is also faster: no model call at all.
- A double click cannot double spend. Both **Run decision loop** and **Close at stop** send an
  idempotency key built from the round's `updatedAt`, and the route replays the stored answer when
  it sees that key again.
- The `attribution` record in step 6 carries `model: "stele-attribution"` rather than a model name.
  That step is arithmetic, not a model call, and naming a model for work a model did not do would be
  false evidence in a compliance trail.
- One take, English voiceover, no setup narration. The screen is already at `/console` when the
  recording starts.
