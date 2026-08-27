# Stele: working notes for Claude

Short and permanent. Read `HANDOFF.md` for the competition facts and `DEMO.md` for what the screen
has to do.

## Commands

```bash
npm run build   # the only gate. There is no lint script and no test suite.
npm run dev     # http://localhost:3000, entry screen is /console
npm run seed    # validates lib/data/seed.json, writes public/seed-manifest.json
```

`npm run build` must pass after every change. No exceptions.

## Stack pitfalls

- **Tailwind CSS v4.** No `tailwind.config.js`, no `@tailwind base` directives. Colors are defined in
  the `@theme` block in `app/globals.css` and nowhere else. A new color goes there first, never
  inline, never as a hex literal in a component. The one exception is `app/icon.svg`, which is an
  asset and not a component.
- **`"use client"`** on the first line of anything that uses `useState`, `useEffect`, `usePathname`
  or an event handler.
- **Next 15 route `params` and `searchParams` are Promises.** Await them.
- **`node:crypto` and `node:child_process`** mean the route needs `export const runtime = "nodejs"`.
  `app/api/decide/route.ts` has it. Keep it.

## Never touch

- **`lib/valve.ts` logic.** The thresholds, `valveFor`, `sizeOrder`, `bracketFor` and `verdictFor`
  are finished. Only its import path may change. If a change to a threshold seems necessary, ask
  first and write the question into `HANDOFF.md`.
- **`lib/weex.ts` and `lib/agent.ts` stay wired into the decision path.** They are the sponsor tech.
  Do not stub them out and do not bypass them.

## Vercel guardrails

- No filesystem writes in request time app code. `scripts/seed.mjs` may write, route handlers and
  pages may not.
- `useSearchParams` only inside a `Suspense` boundary.
- No Node-only API on an edge path. No custom server, no `output: export`, standard Next build only.
  `next.config.ts` keeps `outputFileTracingRoot: __dirname`, do not remove it.
- Every `process.env.X` read anywhere in the repo has a matching `X=` line in `.env.example`.

## Writing style

User facing copy in English. No em dashes, no en dashes, no double hyphens used as a dash. Banned
words: seamless, leverage as a verb, empower, revolutionize, streamline, game-changer, cutting-edge,
delve, robust, unlock, elevate, harness, effortless.

## Context

When compacting preserve the list of modified files and test commands.
