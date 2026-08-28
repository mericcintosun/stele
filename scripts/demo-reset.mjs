// npm run demo:reset
//
// Puts the running app back to the opening frame of DEMO.md so the 90 second
// recording can be retaken until it is clean. It posts to /api/reset, which is
// the same thing the Reset round control in the console does, and prints what
// came back so a failed reset is visible before the camera rolls.
//
// There is no SQL migration in this build and nothing to seed by hand: the
// round store seeds itself from lib/store/fresh.ts on its first read.
//
// Point it somewhere else with STELE_BASE_URL, for example
//   STELE_BASE_URL=https://stele-gules.vercel.app npm run demo:reset

const base = (process.env.STELE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const url = `${base}/api/reset`;

let res;
try {
  res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
} catch (err) {
  console.error(`demo:reset failed. ${url} is not answering.`);
  console.error(`  ${err instanceof Error ? err.message : String(err)}`);
  console.error("  Start the app first (npm run dev) or set STELE_BASE_URL.");
  process.exit(1);
}

const payload = await res.json().catch(() => null);

if (!res.ok || !payload || payload.ok !== true) {
  console.error(`demo:reset failed. ${url} answered ${res.status}.`);
  if (payload && payload.hint) console.error(`  ${payload.error}: ${payload.hint}`);
  process.exit(1);
}

const round = payload.round ?? payload.data?.round ?? {};
const wiring = payload.data?.wiring ?? {};
const theses = Array.isArray(round.theses) ? round.theses.length : 0;
const signals = Array.isArray(round.signals) ? round.signals.length : 0;
const positions = Array.isArray(round.positions) ? round.positions.length : 0;
const logs = Array.isArray(round.logs) ? round.logs.length : 0;
const decisions = Array.isArray(round.decisions) ? round.decisions.length : 0;

console.log(
  `demo:reset ok. ${theses} theses, ${positions} positions, ${signals} signals waiting, ${logs} log records, ${decisions} decisions. Store: ${wiring.persistence ?? "unknown"}.`,
);

if (theses === 0) {
  console.error("demo:reset warning: the round came back with no theses. The console will be empty.");
  process.exit(1);
}
