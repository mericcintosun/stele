"use client";

import Link from "next/link";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

// error.message is deliberately not printed. It can carry a stack frame or an
// upstream API string, and neither belongs on a screen a judge is looking at.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex justify-center py-16">
      <Card className="w-full max-w-xl">
        <CardBody pad="lg" className="space-y-4 text-center">
          <CardTitle size="md">Stele hit an error on this screen</CardTitle>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-mut">
            The decision loop itself is unaffected. Retry, or go back to the console and run the
            signal queue again.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="primary" size="md" onClick={() => reset()}>
              Try again
            </Button>
            <Link href="/console" className={buttonClass({ variant: "outline", size: "md" })}>
              Back to the decision console
            </Link>
            <Link href="/" className={buttonClass({ variant: "ghost", size: "md" })}>
              Back to the overview
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
