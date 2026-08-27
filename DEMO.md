# Stele: the 90 second demo

**Demo start route: `/console`.** Open the deployed URL, go straight to `/console`, and run the
sequence below. Every step works on seeded data with zero environment variables set, so the recording
never waits on an API allowlist.

**The problem sentence:** an agent with an 80% win rate still ended WEEX Season 1 in a 40% drawdown,
because it had one total PnL number and no record of which reason lost the money.

**The trigger:** the second signal, `SIG-9104` on SOL, whose thesis ledger is already under water.

**The wow moment:** the agent refuses its own order and the exchange issues a receipt for the refusal.
Valve multiplier to 0.00x, a red REFUSED row, 0.00 USDT deployed, and a `stage: "rejection"` record
written to `/capi/v3/order/uploadAiLog`.

**The closing line:** it does not repeat round one's mistake in round five, because it wrote down
which reason killed it.

---

## The six steps

### 1. Cold open, one screen (0:00 to 0:15)

Route file: `app/console/page.tsx`

The whole state is visible without scrolling: six named theses with their realized PnL and valve
state on the left, the three market rows across the top, open positions and their exchange-side TP
and SL on the right.

Say: "This agent allocates capital to its reasons, not to itself."

### 2. A signal is matched to a written thesis (0:15 to 0:30)

Route file: `app/console/page.tsx`

Pick `SIG-9107` on BTC from the signal queue and press **Run decision loop**. The thesis it claims,
`TH-TREND-PB`, highlights in the ledger and its written precondition expands. A signal that matches
none of the six theses never becomes an order.

### 3. The uploadAiLog body fills in (0:30 to 0:45)

Route file: `app/console/page.tsx`

On the right, a new record appears in the uploadAiLog stream with `stage`, `model`, `input`,
`output` and the explanation under the 1000 character cap. Underneath it, either the WEEX response
envelope or the queue notice, depending on whether credentials are configured.

### 4. Shadow fill and live fill, side by side (0:45 to 1:00)

Route file: `app/console/page.tsx`

The same decision ran on `/capi/v3/sim` first. The decision row shows both fills with their prices
and order ids next to the notional, take profit and stop loss.

Say: "Every decision runs on simulation first, then live."

### 5. The refusal (1:00 to 1:15)

Route file: `app/console/page.tsx`

Press **Run decision loop** on `SIG-9104`, the SOL squeeze signal. Its thesis `TH-SQZ-LONG` reads
-2.14% over 7 closed trades, which is past the -2.0% halt line. The valve multiplier drops to 0.00x,
a red **REFUSED** row appears, and the deployed amount is 0.00 USDT. No order is sent.

### 6. The refusal receipt in the audit trail (1:15 to 1:30)

Route file: `app/log/page.tsx`

Click **Audit trail** in the nav. The full uploadAiLog record list is there, newest first, with the
`stage: "rejection"` record for `SIG-9104` and its queue depth line at the top. The refusal has a
receipt just like an order does.

Say the closing line over the ledger, with `TH-SQZ-LONG` sitting grey at zero capital.

---

## Recording notes

- Set `ANTHROPIC_API_KEY` before recording so the console header reads "Anthropic API" instead of
  "offline stub". The model token allocation is awarded on proof of real model usage.
- **Reset round** in the account strip puts the console back to the seed state, so the sequence can
  be rehearsed until it runs clean in one take.
- One take, English voiceover, no setup narration. The screen is already at `/console` when recording
  starts.
