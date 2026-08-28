"use client";

// A mono chip that copies its own text to the clipboard on click. The
// uploadAiLog endpoint is the one string on the landing page a judge is likely
// to want in hand, so it is one click rather than a selection drag.

import { useState } from "react";

export default function CopyChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* no clipboard permission: stay silent rather than throwing at the user */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy"
      className="group inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-1 font-mono text-xs text-mut transition-colors hover:border-acc/50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc"
    >
      <span>{text}</span>
      <span className={`text-[10px] ${copied ? "text-ok" : "text-mut group-hover:text-acc"}`}>
        {copied ? "copied" : "copy"}
      </span>
    </button>
  );
}
