// The card primitive.
//
// Before this phase the string "rounded-xl border border-line bg-panel" was
// written out in five files and nine places, which is why the panels had drifted
// apart on padding. One surface treatment lives here now.
//
// Every value that could collide with another Tailwind utility (the border
// color, the background, the padding, the title size) is a record entry rather
// than something a caller overrides through className, because cn() joins and
// does not resolve conflicts. className is for additions: layout, spacing
// between cards, a grid span.

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardTone = "default" | "accent" | "bad";
export type CardPad = "flush" | "sm" | "md" | "lg";
export type CardTitleSize = "sm" | "md";

const CARD_BASE = "rounded-xl border";

const CARD_TONE: Record<CardTone, string> = {
  default: "border-line bg-panel",
  accent: "border-acc/30 bg-panel",
  bad: "border-bad/40 bg-bad/10",
};

const CARD_PAD: Record<CardPad, string> = {
  flush: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function cardClass(tone: CardTone = "default", className?: string): string {
  return cn(CARD_BASE, CARD_TONE[tone], className);
}

export interface CardProps extends HTMLAttributes<HTMLElement> {
  tone?: CardTone;
  /** section by default, because most cards on this site own a heading. */
  as?: "section" | "div";
}

export function Card({
  tone = "default",
  as = "section",
  className,
  children,
  ...props
}: CardProps) {
  const classes = cardClass(tone, className);
  if (as === "div") {
    return (
      <div className={classes} {...props}>
        {children}
      </div>
    );
  }
  return (
    <section className={classes} {...props}>
      {children}
    </section>
  );
}

export type CardHeaderProps = HTMLAttributes<HTMLElement>;

/** The ruled strip at the top of a panel. Title on the left, one count on the right. */
export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3",
        className,
      )}
      {...props}
    >
      {children}
    </header>
  );
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Heading level, so a card inside a section can nest correctly. */
  level?: 2 | 3;
  size?: CardTitleSize;
}

const TITLE_SIZE: Record<CardTitleSize, string> = {
  sm: "text-sm",
  md: "text-lg",
};

export function CardTitle({
  level = 2,
  size = "sm",
  className,
  children,
  ...props
}: CardTitleProps) {
  const classes = cn("font-semibold tracking-tight", TITLE_SIZE[size], className);
  if (level === 3) {
    return (
      <h3 className={classes} {...props}>
        {children}
      </h3>
    );
  }
  return (
    <h2 className={classes} {...props}>
      {children}
    </h2>
  );
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  pad?: CardPad;
}

export function CardBody({ pad = "sm", className, children, ...props }: CardBodyProps) {
  return (
    <div className={cn(CARD_PAD[pad], className)} {...props}>
      {children}
    </div>
  );
}

export default Card;
