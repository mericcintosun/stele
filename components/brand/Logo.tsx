// The brand mark, inline.
//
// Same slab as app/icon.svg and the left half of public/logo.svg: an upright
// stone with writing on it, which is what a thesis ledger is.
//
// It is drawn with currentColor rather than a hex value, so the only color
// decision is the text-* class on the wrapper and the token rule in CLAUDE.md
// holds: no hex literal lives in app/ or components/. Inline rather than
// next/image because the header paints it on the first frame with no request.

interface Props {
  className?: string;
  /** Set false when the mark sits next to the word "Stele" and would repeat it. */
  titled?: boolean;
}

export default function Logo({ className = "h-6 w-6 text-acc", titled = false }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden={titled ? undefined : "true"}
      role={titled ? "img" : undefined}
      focusable="false"
    >
      {titled ? <title>Stele</title> : null}
      <g fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
        <path d="M11 28V9a5 5 0 0 1 10 0v19z" />
      </g>
      <g fill="currentColor">
        <rect x="14" y="12" width="4" height="1.6" rx="0.8" />
        <rect x="14" y="16" width="4" height="1.6" rx="0.8" />
        <rect x="14" y="20" width="4" height="1.6" rx="0.8" />
        <rect x="8" y="28" width="16" height="2.4" rx="1.2" />
      </g>
    </svg>
  );
}
