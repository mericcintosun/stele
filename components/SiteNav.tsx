"use client";

// The nav shell.
//
// Two layouts from one link list. At md and up the links sit in a row. Below it
// they collapse behind a disclosure button, because at 360px the row plus the
// competition tag wrapped onto three lines and pushed the console off the first
// screen. Every target is at least 44px tall, which is the reason for the
// min-h-11 and the horizontal padding rather than a larger font.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/console", label: "Console" },
  { href: "/evidence", label: "Evidence" },
];

function linkClass(active: boolean): string {
  return `inline-flex min-h-11 items-center px-2 text-sm transition-colors ${
    active ? "font-semibold text-acc" : "text-mut hover:text-ink"
  }`;
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
          className="inline-flex min-h-11 items-center pr-2 text-sm font-bold tracking-tight"
        >
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

        <span className="ml-auto hidden font-mono text-[11px] text-mut lg:inline">
          WEEX AI Wars II · AI Team
        </span>

        {/* Below md: one button that opens the stacked list */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="site-nav-panel"
          className="ml-auto inline-flex min-h-11 items-center rounded-lg border border-line px-3 text-sm text-mut transition-colors hover:border-acc/50 hover:text-acc md:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <ul id="site-nav-panel" className="flex flex-col border-t border-line pb-2 md:hidden">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`${linkClass(isActive(l.href))} w-full`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  );
}
