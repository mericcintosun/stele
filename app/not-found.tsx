import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex justify-center py-16">
      <Card className="w-full max-w-xl">
        <CardBody pad="lg" className="space-y-4 text-center">
          <CardTitle size="md">Stele has no page at that address</CardTitle>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-mut">
            There are three screens: the overview, the decision console, and the evidence trail.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/console" className={buttonClass({ variant: "primary", size: "md" })}>
              Back to the decision console
            </Link>
            <Link href="/" className={buttonClass({ variant: "outline", size: "md" })}>
              Back to the overview
            </Link>
            <Link href="/evidence" className={buttonClass({ variant: "ghost", size: "md" })}>
              Read the evidence trail
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
