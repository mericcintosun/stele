"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-3 py-16 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-acc px-4 py-2 text-sm font-semibold text-black"
      >
        Try again
      </button>
    </div>
  );
}
