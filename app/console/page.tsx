// /console
//
// The demo start route. Everything the 90 second sequence needs is on this one
// screen. It reads through getAdapter() and never imports the seed directly, so
// Phase 2 swaps the SQLite ledger in without touching this file.

import DecisionConsole from "@/components/DecisionConsole";
import { getAdapter } from "@/lib/adapter";

export const metadata = { title: "Decision console" };

export const dynamic = "force-dynamic";

export default async function ConsolePage() {
  const snapshot = await getAdapter().snapshot();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Decision console</h2>
        <p className="font-mono text-[11px] text-mut">
          live wiring: WEEX OpenAPI v3 + Anthropic model chain
        </p>
      </div>

      <DecisionConsole
        account={snapshot.account}
        theses={snapshot.theses}
        positions={snapshot.positions}
        markets={snapshot.markets}
        signals={snapshot.signals}
        logs={snapshot.logs}
      />
    </div>
  );
}
