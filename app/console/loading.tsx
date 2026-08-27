// Skeleton for /console. Token classes only, no spinner library.

function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl border border-line bg-panel ${className}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading the decision console">
      <Block className="h-11" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Block className="h-24" />
        <Block className="h-24" />
        <Block className="h-24" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,380px)]">
        <Block className="h-96" />
        <div className="space-y-4">
          <Block className="h-56" />
          <Block className="h-40" />
        </div>
        <Block className="h-96" />
      </div>
    </div>
  );
}
