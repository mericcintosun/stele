# Stele: the 90 second demo

**Step 4 is the wow step.** The agent refuses its own order because the thesis ledger it wrote itself
is under the halt line, and the exchange issues a receipt for the refusal.

**Demo start route: `/console`.** Open the deployed URL, go straight there, and run the five steps
below in order. Every step works with zero environment variables set, so the recording never waits on
the WEEX allowlist.

**Before the take, run `npm run demo:reset`.** It posts to `/api/reset` and puts the round back to the
opening frame. Since Phase 3 the round is server state, not React state, so a decision persists until
something resets it. That is what makes step 5 possible and what makes the take retakeable.

**The problem sentence:** an agent with an 80% win rate still ended WEEX Season 1 in a 40% drawdown,
because it had one total PnL number and no record of which reason lost the money.

**The closing line:** it does not repeat round one's mistake in round five, because it wrote down
which reason killed it.

---

## The five steps

### 1. Cold open, one screen (0:00 to 0:15)

**On screen:** six theses and their realized PnL on the left, `cmt_solusdt` at 144.06 in the middle,
three open positions on the right, four signals waiting. No scrolling, no explanation.

**Route:** `/console`

**File that owns it:** `app/console/page.tsx`. It calls `readRound()` and passes the result straight
into `<DecisionConsole initial={...} />`, so the first frame is server rendered with no client fetch.

**Fallback branch in that same file:** none needed. `readRound()` in `lib/store/round.ts` seeds itself
from `lib/store/fresh.ts` when the key is missing, so this screen cannot render empty.

Say: "This agent allocates capital to its reasons, not to itself."

### 2. A signal is matched to a written thesis and the uploadAiLog body fills (0:15 to 0:45)

**On screen:** press **Run decision loop** on `SIG-9107`, the BTC pullback signal. Its thesis
`TH-TREND-PB` highlights and its written precondition expands. On the right the uploadAiLog body
fills in with `stage`, `model`, `input`, `output` and the explanation, then the WEEX response or the
queue notice lands under it. The order goes out and its exchange-side TP and SL join the positions
table.

**Route:** `POST /api/decide`

**File that owns it:** `app/api/decide/route.ts`. It reads the thesis out of the persisted round,
runs `lib/valve.ts`, calls `lib/agent.ts`, writes the record into the round, then posts it.

**Fallback branches:** `viaMock()` in `lib/agent.ts` writes the explanation when there is no
`ANTHROPIC_API_KEY` and no local CLI. The `if (!hasCredentials())` branch in `placeOrder()` in
`lib/weex.ts` returns a deterministic mock fill when the WEEX keys are absent.

### 3. Shadow fill and live fill, side by side (0:45 to 1:00)

**On screen:** both fills under the decision, with their prices and order ids, next to the notional,
take profit and stop loss.

**Route:** `POST /api/decide`, same request as step 2.

**File that owns it:** `app/api/decide/route.ts`, the two `placeOrder()` calls: `"sim"` first, then
`venueFromEnv()`. `pathFor()` in `lib/weex.ts` is the whole switch, rewriting `/capi/v3/` to
`/capi/v3/sim/`.

**Fallback branch:** the same credential free mock path in `lib/weex.ts`, which prices the sim fill at
4bp of slippage and the live fill at 7bp so the two are visibly different.

Say: "Every decision runs on simulation first, then live."

### 4. The refusal. This is the wow step (1:00 to 1:15)

**On screen:** press **Run decision loop** on `SIG-9104`, the SOL squeeze signal. Its thesis
`TH-SQZ-LONG` reads -2.14% over 7 closed trades, past the -2.0% halt line. The valve multiplier drops
to 0.00x, a red **REFUSED** row appears, 0.00 USDT is deployed and no order reaches the exchange. The
refusal is posted to `/capi/v3/order/uploadAiLog` as a `stage: "rejection"` record.

**Route:** `POST /api/decide`

**File that owns it:** `lib/valve.ts`, the `t.realizedPnlPct <= VALVE.haltPnlPct` branch in
`valveFor()`. `app/api/decide/route.ts` sends the rejection down the identical path an order takes.

**Fallback branch:** `uploadAiLog()` in `lib/weex.ts`, inside `if (!hasCredentials())`, returns
`{ accepted: false, queued: true }`. The record was already written into the round before the POST
was attempted, so the header counts it as `N queued for allowlist` rather than losing it.

### 5. The receipt, the grey thesis, and a hard refresh (1:15 to 1:30)

**On screen:** the refusal receipt is in the uploadAiLog stream on the right with its 1000 character
counter. The camera returns to the ledger: `TH-SQZ-LONG` is grey now, its capital closed for the
round. Then press Cmd+Shift+R. **The refusal is still there.**

**Route:** `/console` again, plus `/log` for the wide audit trail.

**File that owns it:** `lib/store/round.ts`. The decision, the spent quota, the new position and the
log record all live in one JSON round snapshot that the browser does not hold.

**Fallback branch in that same file:** the `memory` singleton. With `KV_REST_API_URL` and
`KV_REST_API_TOKEN` set, the refusal survives the refresh and a cold serverless instance. Without
them it survives the refresh but not a process restart, which is enough for a local recording and is
what the deploy does until the two keys are filled in.

Say the closing line here.

---

## Recording notes

- Run `npm run demo:reset` before every take. Nothing else resets the round, and the second take
  starts from a different screen than the first if you skip it.
- Set `ANTHROPIC_API_KEY` before recording so the console header reads "Anthropic API" instead of
  "offline stub". The model token allocation is awarded on proof of real model usage.
- Leave `ADAPTER_MODE` unset or at `fake` for the recording. The wow step does not need the real
  adapter, and the seed keeps every panel non-empty.
- Running step 4 twice renders the same explanation, because `responseCache` in `lib/agent.ts` keys
  the model answer by a hash of the prompt. The second take is also faster: no model call at all.
- A double click on **Run decision loop** cannot place two orders. The console sends
  `idempotencyKey: ${signalId}-${round.updatedAt}` and `/api/decide` replays the stored decision when
  it sees that key again.
- One take, English voiceover, no setup narration. The screen is already at `/console` when the
  recording starts.
