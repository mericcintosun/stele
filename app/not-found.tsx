import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3 py-16 text-center">
      <h2 className="text-xl font-semibold">Page not found</h2>
      <Link href="/" className="text-acc hover:underline">
        Back to home
      </Link>
    </div>
  );
}
