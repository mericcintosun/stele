// Skeleton for /log. Token classes only, no spinner library.

function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl border border-line bg-panel ${className}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading the audit trail">
      <Block className="h-8 max-w-[16rem]" />
      <Block className="h-11" />
      <Block className="h-40" />
      <Block className="h-40" />
      <Block className="h-40" />
    </div>
  );
}
