import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4 py-16 text-center">
      <h2 className="text-xl font-semibold">Stele has no page at that address</h2>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-mut">
        There are three screens: the overview, the decision console, and the audit trail.
      </p>
      <Link href="/console" className="text-sm text-acc hover:underline">
        Back to the decision console
      </Link>
    </div>
  );
}
