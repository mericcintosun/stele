// The badge primitive.
//
// The five variants are lifted from the two maps that already existed:
// STATE_STYLE in components/ThesisLedger.tsx (the valve state pills) and
// VERDICT_STYLE in components/DecisionConsole.tsx (ORDER SENT, SIZE CUT,
// REFUSED), plus STAGE_STYLE in the two log surfaces. Same hues, same fills,
// same text colors, all from the @theme block.
//
// One deliberate deviation: the verdict pills carried a 50% border alpha and the
// state pills carried 40%. Both are 40% here so the two families match. The
// fill and the text color are unchanged, so no badge changes color.

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "ok" | "warn" | "bad" | "accent" | "neutral";
export type BadgeShape = "square" | "pill";

const BADGE_BASE =
  "inline-flex shrink-0 items-center border font-mono text-[10px] font-semibold tracking-wide";

const BADGE_VARIANT: Record<BadgeVariant, string> = {
  ok: "border-ok/40 bg-ok/10 text-ok",
  warn: "border-warn/40 bg-warn/10 text-warn",
  bad: "border-bad/40 bg-bad/10 text-bad",
  accent: "border-acc/40 bg-acc/10 text-acc",
  neutral: "border-line bg-panel2 text-mut",
};

const BADGE_SHAPE: Record<BadgeShape, string> = {
  square: "rounded px-1.5 py-0.5",
  pill: "rounded-full px-2 py-0.5",
};

export function badgeClass(
  variant: BadgeVariant = "neutral",
  shape: BadgeShape = "square",
  className?: string,
): string {
  return cn(BADGE_BASE, BADGE_VARIANT[variant], BADGE_SHAPE[shape], className);
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  shape?: BadgeShape;
}

export function Badge({
  variant = "neutral",
  shape = "square",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={badgeClass(variant, shape, className)} {...props}>
      {children}
    </span>
  );
}

export default Badge;
