// npm run seed
//
// Validates lib/data/seed.json and writes public/seed-manifest.json.
//
// The invariants below are the ones the demo depends on. The important one is
// the last: exactly one thesis has to sit at or below the halt line, otherwise
// step 5 of DEMO.md has no subject and the refusal cannot be shown.
//
// Deterministic on purpose. No Date.now(), no Math.random(), so two runs on a
// clean checkout write byte identical output.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Mirrors VALVE.haltPnlPct in lib/valve.ts. Kept as a literal so this script needs no TS step. */
const HALT_PNL_PCT = -2.0;

const seed = JSON.parse(readFileSync(join(ROOT, "lib/data/seed.json"), "utf8"));

const problems = [];
function check(condition, message) {
  if (!condition) problems.push(message);
}

const { account, theses, positions, markets, signals, logs } = seed;

check(account && typeof account.uid === "string", "account.uid is missing");
for (const key of ["theses", "positions", "markets", "signals", "logs"]) {
  check(Array.isArray(seed[key]) && seed[key].length > 0, `${key} is empty or not an array`);
}

const thesisIds = new Set();
for (const t of theses) {
  check(!thesisIds.has(t.id), `duplicate thesis id ${t.id}`);
  thesisIds.add(t.id);
  check(t.wins <= t.trades, `${t.id} has more wins than closed trades`);
  check(t.quotaUsedUsdt <= t.quotaUsdt, `${t.id} has spent more quota than it was given`);
  check(
    typeof t.precondition === "string" && t.precondition.length > 40,
    `${t.id} has no written precondition`,
  );
}

for (const p of positions) {
  check(thesisIds.has(p.thesisId), `position ${p.id} points at unknown thesis ${p.thesisId}`);
}
for (const s of signals) {
  check(thesisIds.has(s.thesisId), `signal ${s.id} points at unknown thesis ${s.thesisId}`);
}
for (const l of logs) {
  check(thesisIds.has(l.thesisId), `log ${l.id} points at unknown thesis ${l.thesisId}`);
  check(l.explanation.length <= 1000, `log ${l.id} explanation is over the WEEX 1000 char cap`);
}

const marketSymbols = new Set(markets.map((m) => m.symbol));
for (const s of signals) {
  check(marketSymbols.has(s.symbol), `signal ${s.id} has no market row for ${s.symbol}`);
}

const halted = theses.filter((t) => t.realizedPnlPct <= HALT_PNL_PCT);
check(
  halted.length === 1,
  `expected exactly one thesis at or below ${HALT_PNL_PCT}%, found ${halted.length}. The refusal step in DEMO.md needs exactly one subject.`,
);

if (problems.length > 0) {
  console.error("seed: invalid");
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

const manifest = {
  theses: theses.length,
  positions: positions.length,
  markets: markets.length,
  signals: signals.length,
  logs: logs.length,
  queuedLogs: logs.filter((l) => l.queued).length,
  haltPnlPct: HALT_PNL_PCT,
  haltedThesisId: halted[0].id,
};

mkdirSync(join(ROOT, "public"), { recursive: true });
writeFileSync(join(ROOT, "public/seed-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `seed: ok. ${manifest.theses} theses, ${manifest.positions} positions, ${manifest.signals} signals, ${manifest.logs} logs (${manifest.queuedLogs} queued). Halted thesis: ${manifest.haltedThesisId}. Wrote public/seed-manifest.json.`,
);
