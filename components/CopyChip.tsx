"use client";

// Tıklanınca panoya kopyalayan mono çip: uploadAiLog endpoint'i landing'de
// üç yerde geçiyor, jüri kopyalamak isterse tek tık.

import { useState } from "react";

export default function CopyChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* pano izni yoksa sessiz kal */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Kopyala"
      className="group inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-1 font-mono text-xs text-mut transition-colors hover:border-acc/50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc"
    >
      <span>{text}</span>
      <span className={`text-[10px] ${copied ? "text-ok" : "text-mut group-hover:text-acc"}`}>
        {copied ? "copied" : "copy"}
      </span>
    </button>
  );
}
