# Stele: the official WEEX Trader Skill

**Short version.** WEEX requires the AI side to configure API keys and connect the official Trader
Skill integration on the account that will trade. That integration is installed on the operator's
agent host. **It is not vendored into this repo and this repo does not claim it is.** The install is
a human step, listed in `DELIVERY.md` under `## AI Team` and in the manual checklist at the end of
`HANDOFF.md`.

## The requirement, as recorded

From the verified competition facts in `HANDOFF.md`:

> Required for the AI side: a WEEX account, configured WEEX API keys, the official Trader Skill
> integration, and a separate Google Form application to join as an AI agent partner.

That is the whole of the requirement as we were able to read it. The rules page does not publish a
verification method for the install, so treat the checkbox in `DELIVERY.md` as the record.

## Install command

Run this on the host that runs the trading agent, not in this repo:

```bash
npx skills add https://github.com/weex-labs/weex-agent-skills --all
```

Repository: `https://github.com/weex-labs/weex-agent-skills`

The four official skills published in it:

| Skill | Purpose, as published |
| --- | --- |
| `weex-trader-skill` | order placement against the WEEX OpenAPI |
| `weex-analysis-skill` | market and signal analysis |
| `weex-monitor-skill` | position and fill monitoring |
| `weex-partner-skill` | the AI agent partner side of the program |

## Pitfall, recorded verbatim from research

`github.com/weex-labs/weex-trader-skill` returns **HTTP 404**. The live repo is `weex-agent-skills`
and the trader skill lives inside it at `skills/weex-trader-skill`. `drgnchan/weex-trader-skill` is
an **unofficial fork** and is not what the rules ask for.

## What this repo covers on its own

Stele implements the same ground in its own modules. **This mapping is an equivalence, not a
substitution.** Installing the four skills on the trading host remains a required human step, and
nothing in the table below satisfies it.

| Official skill | Covered here by | Where |
| --- | --- | --- |
| `weex-trader-skill` | `placeOrder()` and the venue switch in `pathFor()` | `lib/weex.ts:202`, `lib/weex.ts:57` |
| `weex-monitor-skill` | `applyFillToThesis()` behind `POST /api/attribute` | `lib/attribution.ts:114`, `app/api/attribute/route.ts` |
| `weex-analysis-skill` | `judge()`, the model call that matches a signal to a written thesis | `lib/agent.ts:242` |
| `weex-partner-skill` | **nothing in this repo.** It is the program side, filed through the AI agent partner Google Form | `DELIVERY.md`, `## AI model token ödülü` |

Two things that are ours rather than the skill's, and that no skill replaces: `lib/valve.ts` sizes
every order with arithmetic over the thesis ledger, and `uploadAiLog()` in `lib/weex.ts` posts the
evidence record on every decision including refusals.

## Unverified

The install command, the repository URL and the four skill names above come from research recorded
during the build and **were not verifiable by reading a file in this repo**. Confirm them against the
WEEX rules page before relying on them:
https://www.weex.com/api-doc/ai/introduction/Rule
