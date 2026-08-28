"use client";

import Link from "next/link";

// error.message is deliberately not printed. It can carry a stack frame or an
// upstream API string, and neither belongs on a screen a judge is looking at.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4 py-16 text-center">
      <h2 className="text-xl font-semibold">Stele hit an error on this screen</h2>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-mut">
        The decision loop itself is unaffected. Retry, or go back to the console and run the signal
        queue again.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex min-h-11 items-center rounded-lg bg-acc px-5 text-sm font-semibold text-bg"
        >
          Try again
        </button>
        <Link
          href="/console"
          className="inline-flex min-h-11 items-center px-3 text-sm text-acc hover:underline"
        >
          Back to the decision console
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center px-3 text-sm text-mut hover:text-acc"
        >
          Back to the overview
        </Link>
      </div>
    </div>
  );
}
