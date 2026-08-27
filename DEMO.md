# Stele: the 90 second demo

**Step 4 is the wow step.** The agent refuses its own order because the thesis ledger it wrote itself
is under the halt line, and the exchange issues a receipt for the refusal.

**Demo start route: `/console`.** Open the deployed URL, go straight there, and run the five steps
below in order. Every step works on seeded data with zero environment variables set, so the recording
never waits on the WEEX allowlist.

**The problem sentence:** an agent with an 80% win rate still ended WEEX Season 1 in a 40% drawdown,
because it had one total PnL number and no record of which reason lost the money.

**The closing line:** it does not repeat round one's mistake in round five, because it wrote down
which reason killed it.

---

## The five steps

### 1. Cold open, one screen (0:00 to 0:15)

Route file: `app/console/page.tsx`

Six theses and their realized PnL on the left, `cmt_solusdt` price in the middle, open positions on
the right. No scrolling, no explanation.

Say: "This agent allocates capital to its reasons, not to itself."

**Real since Phase 1.** The screen reads through `getStore()`, which serves the seeded ledger.

### 2. A signal arrives and is matched to a written thesis (0:15 to 0:45)

Route file: `app/console/page.tsx`, decision loop in `app/api/decide/route.ts`

Pick `SIG-9107` on BTC and press **Run decision loop**. The thesis it claims, `TH-TREND-PB`,
highlights and its written precondition expands. On the right the uploadAiLog body fills in with
`stage`, `model`, `input`, `output` and the explanation, then the WEEX response or the queue notice
lands under it. The order goes out and its exchange-side TP and SL join the positions table.

**Real since Phase 1** for the model chain and the signed WEEX client. **Phase 2** made the log
record durable: it is written to the queue before the POST is attempted, so nothing is lost when the
exchange rejects an un-allowlisted UID.

### 3. Shadow fill and live fill, side by side (0:45 to 1:00)

Route file: `app/api/decide/route.ts`

The same decision ran on `/capi/v3/sim` first. Both fills show with their prices and order ids next
to the notional, take profit and stop loss.

Say: "Every decision runs on simulation first, then live."

**Real since Phase 1.** `WEEX_VENUE=live` is the only switch between the two paths.

### 4. The refusal. This is the wow step (1:00 to 1:15)

Route file: `app/console/page.tsx`, valve in `lib/valve.ts`, ledger from `lib/attribution.ts`

Press **Run decision loop** on `SIG-9104`, the SOL squeeze signal. Its thesis `TH-SQZ-LONG` reads
-2.14% over 7 closed trades, past the -2.0% halt line. The valve multiplier drops to 0.00x, a red
**REFUSED** row appears, 0.00 USDT is deployed and no order reaches the exchange. The refusal is
posted to `/capi/v3/order/uploadAiLog` as a `stage: "rejection"` record, and the console header
counts anything the exchange has not accepted yet as `N queued for allowlist`.

**Phase 2.** The number the valve reads is now produced by attribution: closed fills coming back from
WEEX are matched to the thesis that opened them through the `clientOid`, and their realized PnL lands
on that thesis ledger. With `ADAPTER_MODE=fake` the same code path runs against the seeded ledger,
which is what the recording uses.

### 5. The refusal receipt in the audit trail (1:15 to 1:30)

Route file: `app/log/page.tsx`, queue in `app/api/queue/route.ts`

Click **Audit trail**. The full uploadAiLog list is there, newest first, with the `stage: "rejection"`
record for `SIG-9104` and the queue depth at the top. Camera returns to the ledger: `TH-SQZ-LONG` is
grey now, its capital closed for the round.

Say the closing line here.

**Phase 2** for the queue: `GET /api/queue` reports depth and records, `POST /api/queue` replays
unsent records in `postedAt` order.

---

## Recording notes

- Set `ANTHROPIC_API_KEY` before recording so the console header reads "Anthropic API" instead of
  "offline stub". The model token allocation is awarded on proof of real model usage.
- Leave `ADAPTER_MODE` unset or at `fake` for the recording. The wow step does not need the real
  adapter, and the seed keeps every panel non-empty.
- **Reset round** in the account strip puts the console back to the seed state, so the sequence can
  be rehearsed until it runs clean in one take.
- Running step 4 twice with the same signal renders the same explanation, because `lib/cache.ts`
  keys the model answer by a hash of the prompt.
- One take, English voiceover, no setup narration. The screen is already at `/console` when the
  recording starts.
