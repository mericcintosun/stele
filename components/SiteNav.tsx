"use client";

// The nav shell.
//
// Two layouts from one link list. At md and up the links sit in a row next to
// the brand lockup, with the primary action pinned right. Below md they collapse
// behind a disclosure button, because at 360px the row plus the competition tag
// wrapped onto three lines and pushed the console off the first screen. Every
// target is at least 44px tall, which is the reason for the min-h-11 and the
// horizontal padding rather than a larger font.
//
// The header this sits in is sticky, so the console action is reachable from any
// scroll position on the landing page.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/brand/Logo";
import { Button, buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/console", label: "Console" },
  { href: "/evidence", label: "Evidence" },
];

function linkClass(active: boolean, extra?: string): string {
  return cn(
    "inline-flex min-h-11 items-center rounded-lg px-2 text-sm transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc",
    active ? "font-semibold text-acc" : "text-mut hover:text-ink",
    extra,
  );
}

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav aria-label="Primary" className="mx-auto w-full max-w-[94rem] px-4 sm:px-6">
      <div className="flex items-center gap-3 py-2">
        <Link
          href="/"
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-lg pr-2 text-sm font-bold tracking-tight",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc",
          )}
        >
          <Logo className="h-6 w-6 shrink-0 text-acc" />
          Stele
        </Link>

        {/* md and up: the links inline */}
        <ul className="hidden md:flex md:items-center md:gap-x-2">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={linkClass(isActive(l.href))}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden font-mono text-[11px] text-mut lg:inline">
            WEEX AI Wars II · AI Team
          </span>

          {/* The one action in the header. Hidden below md, where the whole nav
              is behind the disclosure button instead. */}
          <span className="hidden md:block">
            <Link href="/console" className={buttonClass({ variant: "primary", size: "sm" })}>
              Open the console
            </Link>
          </span>

          {/* Below md: one button that opens the stacked list */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-nav-panel"
            className="md:hidden"
          >
            {open ? "Close" : "Menu"}
          </Button>
        </div>
      </div>

      {open ? (
        <ul id="site-nav-panel" className="flex flex-col border-t border-line pb-2 md:hidden">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={linkClass(isActive(l.href), "w-full")}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="px-2 pt-2">
            <Link
              href="/console"
              onClick={() => setOpen(false)}
              className={buttonClass({ variant: "primary", size: "sm", className: "w-full" })}
            >
              Open the console
            </Link>
          </li>
        </ul>
      ) : null}
    </nav>
  );
}
