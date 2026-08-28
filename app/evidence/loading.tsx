// Skeleton for /evidence. Drawn with the card primitive, no spinner library.

import { cardClass } from "@/components/ui/card";
import { cn } from "@/lib/cn";

function Block({ className }: { className?: string }) {
  return <div className={cn(cardClass("default"), "animate-pulse", className)} />;
}

export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading the evidence trail">
      <Block className="h-8 w-full max-w-[16rem]" />
      <Block className="h-16" />
      <Block className="h-40" />
      <Block className="h-40" />
      <Block className="h-40" />
      <p className="font-mono text-[11px] text-mut">
        Reading the uploadAiLog records written this round.
      </p>
    </div>
  );
}
