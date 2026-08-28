// Decorative only: ruled ledger lines with entry ticks, the paper the theses
// would have been written on.
//
// currentColor plus opacity, so it takes its hue from the text-* class on the
// wrapper and no hex value enters components/. It is aria-hidden and
// pointer-events-none, so it is invisible to assistive technology and can never
// eat a click meant for the control behind it.

interface Props {
  className?: string;
}

export default function LedgerPattern({
  className = "pointer-events-none absolute inset-0 text-acc",
}: Props) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 480 240"
    >
      <defs>
        <pattern id="stele-ledger-rules" width="480" height="40" patternUnits="userSpaceOnUse">
          <line x1="0" y1="39" x2="480" y2="39" stroke="currentColor" strokeWidth="1" opacity="0.14" />
          <rect x="16" y="16" width="26" height="7" rx="3.5" fill="currentColor" opacity="0.1" />
          <rect x="54" y="16" width="14" height="7" rx="3.5" fill="currentColor" opacity="0.07" />
        </pattern>
        <linearGradient id="stele-ledger-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="stele-ledger-mask">
          <rect width="480" height="240" fill="url(#stele-ledger-fade)" />
        </mask>
      </defs>
      <rect width="480" height="240" fill="url(#stele-ledger-rules)" mask="url(#stele-ledger-mask)" />
    </svg>
  );
}
