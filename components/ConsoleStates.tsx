"use client";

// The three states the console can be in that are not "here is the round".
//
// Each one is a real branch with a real next click, not a sentence in grey. A
// judge who lands on an error must be able to get back to the demo without
// reloading, and a drained signal queue has to point at the control that
// refills it, because that is the next click in DEMO.md.

interface RetryProps {
  message: string;
  onRetry: () => void;
  busy?: boolean;
}

interface EmptyProps {
  onReset: () => void;
  busy?: boolean;
}

/** Grey blocks in the shape of the three column grid, so nothing jumps on load. */
export function ConsoleSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading the round">
      <div className="h-12 animate-pulse rounded-xl border border-line bg-panel" />

      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl border border-line bg-panel" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,380px)]">
        <div className="h-96 animate-pulse rounded-xl border border-line bg-panel" />
        <div className="space-y-4">
          <div className="h-44 animate-pulse rounded-xl border border-line bg-panel" />
          <div className="h-64 animate-pulse rounded-xl border border-line bg-panel" />
        </div>
        <div className="h-96 animate-pulse rounded-xl border border-line bg-panel" />
      </div>

      <p className="font-mono text-[11px] text-mut">Reading the round from the store.</p>
    </div>
  );
}

/** A failure with a way out of it. The retry refetches GET /api/round. */
export function ConsoleErrorState({ message, onRetry, busy = false }: RetryProps) {
  return (
    <div className="space-y-3 rounded-xl border border-bad/40 bg-bad/10 px-4 py-3">
      <p className="text-sm text-bad">{message}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          disabled={busy}
          className="inline-flex min-h-11 items-center rounded-lg border border-bad/50 px-4 text-xs font-semibold text-bad transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {busy ? "Reading the round…" : "Reload the round"}
        </button>
        <span className="font-mono text-[11px] text-mut">GET /api/round</span>
      </div>
    </div>
  );
}

/** The queue is drained. The next click in DEMO.md is Reset round, so say so. */
export function SignalQueueEmptyState({ onReset, busy = false }: EmptyProps) {
  return (
    <div className="space-y-3 px-4 py-6">
      <p className="text-sm text-mut">
        Every signal in this round has been answered. The decisions, the spent quota and the
        uploadAiLog records below are all persisted, so they survive a page reload.
      </p>
      <button
        type="button"
        onClick={onReset}
        disabled={busy}
        className="inline-flex min-h-11 items-center rounded-lg bg-acc px-4 text-xs font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {busy ? "Resetting the round…" : "Reset round and run the sequence again"}
      </button>
      <p className="font-mono text-[11px] text-mut">
        POST /api/reset, the same thing npm run demo:reset does
      </p>
    </div>
  );
}
