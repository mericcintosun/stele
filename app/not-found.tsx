import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4 py-16 text-center">
      <h2 className="text-xl font-semibold">Stele has no page at that address</h2>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-mut">
        There are three screens: the overview, the decision console, and the evidence trail.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/console"
          className="inline-flex min-h-11 items-center rounded-lg bg-acc px-5 text-sm font-semibold text-bg"
        >
          Back to the decision console
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center px-3 text-sm text-mut hover:text-acc"
        >
          Back to the overview
        </Link>
        <Link
          href="/evidence"
          className="inline-flex min-h-11 items-center px-3 text-sm text-mut hover:text-acc"
        >
          Read the evidence trail
        </Link>
      </div>
    </div>
  );
}
