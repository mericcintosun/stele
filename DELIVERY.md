# Stele: delivery

What a human has to do by hand, per track. None of this is code and none of it can be done by the
build. The four headings below match the `Track` cells in the README table character for character.

**Main deadline: 2026-09-02 15:59 UTC.**

**Read this first.** The prize amounts in the README table are unverified. The DoraHacks prize page
returned HTTP 405 on every path we tried, so those rows come from the idea record's target tracks.
Confirm each amount and each slot count on the official page before relying on it.

---

## AI Team

- **entryMode:** opt-in and irreversible. The side is chosen before the competition starts and
  cannot be changed after it begins. Picking Human Team by mistake ends this submission.
- **action:** select the **AI** side at registration, then configure WEEX API keys and the official
  Trader Skill integration on the account that will trade. The install is one command on the trading
  host, `npx skills add https://github.com/weex-labs/weex-agent-skills --all`, and it is **not**
  vendored into this repo: see [docs/TRADER-SKILL.md](docs/TRADER-SKILL.md) for the four skill names,
  the 404 pitfall and the module map. Submit the UID and the trading server's static IP to the WEEX
  allowlist. Approval is manual and done by WEEX staff, so it is the long pole: do it first.
- **deadline:** 2026-09-02 15:59 UTC for the main entry. The allowlist has no published turnaround,
  which is the reason to submit it early rather than the reason to leave it late.
- **watch:** DEMO.md steps **2** and **4**. Step 2 is a signed WEEX v3 order with exchange-side take
  profit and stop loss attached at entry. Step 4 is the valve refusing the agent's own order on a
  thesis past the halt line, which is the risk control half of the ranking criteria.

## AI model token ödülü

- **entryMode:** separate-submission. This is not awarded off the main registration. It needs the
  WEEX AI agent partner Google Form, filed on its own.
- **action:** file the WEEX AI agent partner Google Form. **URL: UNKNOWN**, find it from
  https://www.weex.com/news/detail/weex-ai-wars-ii-enlist-as-an-ai-agent-arsenal-and-lead-the-battle-418427
  The form link was not readable in research and has not been invented here. Paste the live Vercel
  URL where the form asks for a demo or a project link, and the video URL where it asks for one.
- **deadline:** **unknown, to be confirmed by the human.** The closing date of the AI agent partner
  form was not published anywhere we could read. Do not assume it matches the main deadline. Treat
  it as possibly earlier until someone confirms otherwise.
- **watch:** DEMO.md step **5**. The `/evidence` page is the proof of real model usage this line is
  awarded on: the endpoint, the venue, the accepted against queued split, the stage breakdown, the
  models that answered, and every record in full with its character count against the WEEX 1000
  limit. It is also the answer to the disqualification rule, which removes a team from the ranking
  if it cannot present valid evidence of AI participation.

## Early bird pool

- **entryMode:** automatic on registration timing, as published. Unverified.
- **action:** nothing in this repo. Register early enough to qualify. Confirm on the official page
  what "early" means, because the cutoff was not published anywhere we could read.
- **deadline:** unknown, and by definition earlier than the main one. Confirm before assuming it has
  already passed or is still open.
- **watch:** none. There is no code path and no DEMO.md step behind this row. It is a calendar item.

## New user pool

- **entryMode:** automatic on account age, as published. Unverified.
- **action:** nothing in this repo. A new WEEX UID through KYC is what qualifies. If the account
  being used for the competition is an existing one, this row is not available and should be dropped
  from the submission rather than claimed.
- **deadline:** tied to the main registration window. Unverified.
- **watch:** none. Calendar and account item, no code path.

---

## Before submitting

- [ ] Side selected as **AI Team** at registration. This cannot be changed afterwards.
- [ ] WEEX API key, secret and passphrase created under API Management and set on the deploy.
- [ ] WEEX UID and the trading server's static IP submitted to the allowlist, with a timestamp
      recorded so the wait is measurable.
- [ ] The four official WEEX skills installed on the trading host with
      `npx skills add https://github.com/weex-labs/weex-agent-skills --all`:
      `weex-trader-skill`, `weex-analysis-skill`, `weex-monitor-skill`, `weex-partner-skill`. See
      [docs/TRADER-SKILL.md](docs/TRADER-SKILL.md).
- [ ] The 11 step API checklist passed on sim: query balance, set leverage, read price, place an
      order, close it, minimum 10 USDT trade size, and the rest. Results written into
      [docs/RESULTS.md](docs/RESULTS.md).
- [ ] The WEEX AI agent partner Google Form filed. Its URL is still UNKNOWN, see the section above.
- [ ] The live Vercel URL pasted wherever the form asks for a demo link.
- [ ] The video URL recorded and pasted in place of `<ADD_VIDEO_URL>` in README.md.
- [ ] `ANTHROPIC_API_KEY` set on the deploy before the recording, so the console header reads
      "Anthropic API" and not "offline stub".
- [ ] `npm run demo:reset` run against the live URL immediately before the take.
