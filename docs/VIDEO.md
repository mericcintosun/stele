# Stele: the 90 second recording

The shot list, derived from `DEMO.md` and the demo contract in `HANDOFF.md`. Six shots, one per
numbered DEMO.md step. If a step is cut, cut the matching shot and renumber both files together.

## Timing contract

**90 second single take.** The hackathon publishes no maximum video length, so that field is unknown
and is not invented here: 90 seconds is this project's own contract, written into the demo section of
`HANDOFF.md`. It deliberately deviates from the generic 2 to 4 minute guidance you would follow for a
hackathon that actually judged submissions. This one does not.

| Checkpoint | Deadline | Where it lands |
| --- | --- | --- |
| Problem stated | by 0:15 | shot 1, spoken over the cold open, 0:00 to 0:12 |
| First WEEX receipt visible on screen | by 0:45 | shot 2, the uploadAiLog response, 0:12 to 0:35 |
| The refusal wow | by 1:15 | shot 4, 0:47 to 1:02 |
| Total runtime | 90 seconds | shot 6 ends at 1:30 |
| Hard cap | 2:00 | over this, cut shot 3 first |

## Shot list

| Shot | DEMO.md step | On-screen action | Spoken line | Seconds |
| --- | --- | --- | --- | --- |
| 1 | 1 | `/console` already open at desktop width. Six theses and their realized PnL on the left, `cmt_solusdt` at 144.06 in the middle, four open positions on the right, five signals waiting. No clicking. | "An agent with an 80% win rate still ended WEEX Season 1 in a 40% drawdown, because it had one total PnL number and no record of which reason lost the money. This agent allocates capital to its reasons, not to itself." | 0:00 to 0:12, 12s |
| 2 | 2 | Press **Run decision loop** on `SIG-9107`, the BTC pullback signal on `TH-TREND-PB`. The thesis highlights, its precondition expands, a green **ORDER SENT** row appears. On the right the uploadAiLog body fills in with `stage`, `model`, `input`, `output` and the explanation, then the WEEX response lands under it. | "Every order carries a written reason. The decision, the model that made it and the explanation all go to WEEX as a signed log record, and the exchange answers." | 0:12 to 0:35, 23s |
| 3 | 3 | Stay on that decision row. Point at the shadow fill and the live fill side by side, with their prices, order ids, notional, take profit and stop loss. | "Every decision runs on simulation first, then live. One path prefix apart." | 0:35 to 0:47, 12s |
| 4 | 4 | Press **Run decision loop** on `SIG-9104`, the SOL squeeze signal on `TH-SQZ-LONG`. The ledger reads -2.14% over 7 closed trades. Valve multiplier goes to `0.00x`, a red **REFUSED** row appears, `0.00 USDT deployed` prints, no order reaches the exchange. | "This thesis is past its halt line, so the agent refuses its own order. Nothing here asked the model for permission. That number is arithmetic." | 0:47 to 1:02, 15s |
| 5 | 5 | The refusal receipt is in the uploadAiLog stream with its character counter. Open **Evidence** in the nav: the summary strip reads the endpoint, the venue, the accepted against queued split, the stage breakdown and the models that answered. Go back to `/console` and press Cmd+Shift+R. The refusal is still there. | "The refusal gets a receipt too. WEEX disqualifies a team that cannot show evidence of AI participation, so the refusal is filed exactly like an order would be. And it survives a refresh, because the round is server state." | 1:02 to 1:15, 13s |
| 6 | 6 | Point at `SIG-9118` reading `valve 0.50x, throttled`. Press **Close at stop** on `POS-4475`. The row disappears, `TH-VOL-CRUSH` drops to about -2.05%, the badge turns red and reads **halted**, the multiplier goes to `0.00x`, an `attribution` record appears at the top of the stream. Press **Run decision loop** on `SIG-9118`: now **REFUSED**. | "One closed loss just edited the agent's memory, and the valve reacted in the same second. That signal would have gone out at half size a moment ago. It does not repeat round one's mistake in round five, because it wrote down which reason killed it." | 1:15 to 1:30, 15s |

## Recording plan

- **Record against https://stele-gules.vercel.app/console with the address bar visible.** Never
  localhost. A judge watching a `localhost:3000` recording cannot tell whether anything is deployed.
- **`ANTHROPIC_API_KEY` must be set on the deploy before the take**, so the console header reads
  **Anthropic API** and not **offline stub**. The AI model token allocation is awarded on proof of
  real model usage, and the header is the proof that is visible on camera.
- **Leave `ADAPTER_MODE` unset or at `fake`.** Neither wow step needs the real adapter and the seed
  keeps every panel non-empty.
- **Click Reset round before every take.** The round is server state, so without a reset the second
  take opens on the first take's leftovers. `npm run demo:reset` against the live URL does the same
  thing from a terminal.
- **One dry run first**, all six steps, no recording. Watch specifically for step 6: its numbers were
  computed by hand rather than copied off a screen, so it is the step most likely to surprise you.
- **One take, English voiceover, no setup narration.** The screen is already at `/console` when the
  recording starts.
- **Leave a re-record slot before 2026-09-02 15:59 UTC.** Do not schedule the only take against the
  deadline.

## Fallback: screenshots over a voiceover

If recording fails or the live URL is unstable, the submission visual is the six screenshots plus the
phone shot, over the same voiceover.

| Shot | Falls back to |
| --- | --- |
| 1 | `docs/step-1.png` |
| 2 | `docs/step-2.png` |
| 3 | `docs/step-3.png` |
| 4 | `docs/step-4.png` |
| 5 | `docs/step-5.png` |
| 6 | `docs/step-6.png` |
| mobile shot, optional | `docs/step-phone.png`, `/console` at 360px |

Capture all seven from the live URL regardless of whether the video works. `README.md` references
them by these exact filenames.

## Flaky step rule

**If a step does not run clean in two takes, cut the shot. Do not fix code under deadline pressure.**

1. Drop the shot from this file.
2. Drop the matching step from `DEMO.md` and renumber the remaining steps so the two documents still
   agree.
3. Renumber the screenshot filenames to match, in both this file and the `README.md` screenshots
   table.
4. Record the cut in `HANDOFF.md` as an explicit unmet item with the reason.

Shot 3 is the cheapest to cut: it is the only shot with no click in it, and steps 2 and 4 still show
a signed order and a refusal without it. Shots 1, 4 and 5 are the last to go, in that order of
protection.

## Links to replace before the video goes out

One placeholder token is left, `<ADD_VIDEO_URL>`, byte identical everywhere it appears, so one find
and replace fixes every file at once.

- The video URL token: `README.md`, `SUBMISSION.md`.

The live URL is no longer a token. `https://stele-gules.vercel.app` is written out in `README.md`,
`SUBMISSION.md`, this file and `scripts/demo-reset.mjs`, and `lib/config.ts` holds the same origin in
its `SITE_URL` constant for the og:image. That constant is **not** a token: if the deploy ever moves,
it has to be edited by hand along with the four documents.
