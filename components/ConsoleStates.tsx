"use client";

// The three states the console can be in that are not "here is the round".
//
// Each one is a real branch with a real next click, not a sentence in grey. A
// judge who lands on an error must be able to get back to the demo without
// reloading, and a drained signal queue has to point at the control that
// refills it, because that is the next click in DEMO.md.
//
// All three are drawn with the same primitives as the happy path: Card for the
// surface, Button for the control. Nothing here is a browser default.

import LedgerPattern from "@/components/brand/LedgerPattern";
import { Button } from "@/components/ui/button";
import { Card, cardClass } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface RetryProps {
  message: string;
  onRetry: () => void;
  busy?: boolean;
}

interface EmptyProps {
  onReset: () => void;
  busy?: boolean;
}

/** One pulsing block in the shape of a real panel. */
function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn(cardClass("default"), "animate-pulse", className)} />;
}

/** Grey blocks in the shape of the three column grid, so nothing jumps on load. */
export function ConsoleSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading the round">
      <SkeletonBlock className="h-12" />

      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} className="h-20" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,380px)]">
        <SkeletonBlock className="h-96" />
        <div className="space-y-4">
          <SkeletonBlock className="h-44" />
          <SkeletonBlock className="h-64" />
        </div>
        <SkeletonBlock className="h-96" />
      </div>

      <p className="font-mono text-[11px] text-mut">Reading the round from the store.</p>
    </div>
  );
}

/** A failure with a way out of it. The retry refetches GET /api/round. */
export function ConsoleErrorState({ message, onRetry, busy = false }: RetryProps) {
  return (
    <Card as="div" tone="bad" className="space-y-3 px-4 py-3" role="alert">
      <p className="text-sm leading-relaxed text-bad">{message}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="danger" size="sm" onClick={onRetry} disabled={busy}>
          {busy ? "Reading the round…" : "Reload the round"}
        </Button>
        <span className="font-mono text-[11px] text-mut">GET /api/round</span>
      </div>
    </Card>
  );
}

/** The queue is drained. The next click in DEMO.md is Reset round, so say so. */
export function SignalQueueEmptyState({ onReset, busy = false }: EmptyProps) {
  return (
    <div className="relative isolate overflow-hidden px-4 py-8">
      <LedgerPattern className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-acc" />
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-mut">
          Every signal in this round has been answered. The decisions, the spent quota and the
          uploadAiLog records below are all persisted, so they survive a page reload.
        </p>
        <Button variant="primary" size="sm" onClick={onReset} disabled={busy}>
          {busy ? "Resetting the round…" : "Reset round and run the sequence again"}
        </Button>
        <p className="font-mono text-[11px] text-mut">
          POST /api/reset, the same thing npm run demo:reset does
        </p>
      </div>
    </div>
  );
}
