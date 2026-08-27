// /console
//
// The demo start route. Everything the 90 second sequence needs is on this one
// screen. It reads through getStore() and never imports the seed directly, so
// the real ledger swaps in without touching this file.

import DecisionConsole from "@/components/DecisionConsole";
import { getStore } from "@/lib/store";

export const metadata = { title: "Decision console" };

export const dynamic = "force-dynamic";

export default async function ConsolePage() {
  const store = getStore();
  // On the real store this pulls closed fills from WEEX and folds them onto the
  // ledger first, so the valve states rendered below are attributed numbers.
  const snapshot = await store.snapshot();
  const queueDepth = await store.queueDepth();

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
        queueDepth={queueDepth}
      />
    </div>
  );
}
