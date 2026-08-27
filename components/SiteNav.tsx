"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/console", label: "Decision console" },
  { href: "/log", label: "Audit trail" },
];

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="mx-auto flex max-w-[94rem] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6"
    >
      <Link href="/console" className="text-sm font-bold tracking-tight">
        Stele
      </Link>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`text-xs transition-colors ${
                  active
                    ? "border-b border-acc pb-0.5 font-semibold text-acc"
                    : "text-mut hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <span className="ml-auto font-mono text-[11px] text-mut">
        WEEX AI Wars II · AI Team
      </span>
    </nav>
  );
}
