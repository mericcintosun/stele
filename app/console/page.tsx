// /console
//
// The demo start route. Everything the 90 second sequence needs is on this one
// screen, and the first frame is server rendered: readRound() supplies the
// whole round here, so the browser never mounts an empty console and then
// fetches. There is exactly one client refresh path after this, GET /api/round.
//
// getStore() still runs first because on ADAPTER_MODE=real its snapshot() pulls
// closed fills from WEEX and folds them onto the ledger. readRound() below then
// reads the round that attribution just wrote.

import DecisionConsole from "@/components/DecisionConsole";
import { storeMode } from "@/lib/config";
import { getStore, ledgerSource, readRound, viewOf } from "@/lib/store";

export const metadata = { title: "Decision console" };

export const dynamic = "force-dynamic";

export default async function ConsolePage() {
  const store = getStore();
  await store.snapshot();
  const round = viewOf(await readRound());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="type-h2">Decision console</h2>
        <p className="font-mono text-[11px] text-mut">
          live wiring: WEEX OpenAPI v3 + Anthropic model chain, round in {storeMode()}
        </p>
      </div>

      <p className="font-mono text-[11px] break-words text-mut">
        {ledgerSource() === "seeded"
          ? "Ledger source: seeded fixture, lib/data/seed.json. Every PnL figure below is demo data, not a WEEX account result."
          : "Ledger source: WEEX closed fills, attributed to a thesis by client_oid. Every PnL figure below is an account result."}
      </p>

      <DecisionConsole initial={round} />
    </div>
  );
}
