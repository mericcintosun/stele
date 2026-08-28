// The button primitive.
//
// shadcn shape by hand: a variant record, a size record, cn() composition, props
// extending the native element and className merged last. The CLI and its three
// dependencies are not in package.json and this phase may not add them.
//
// Two exports on purpose. Button is the element. buttonClass() is the same
// classes without the element, for a next/link Link that has to look like a
// button, which is how the landing CTA and the header action are drawn without
// nesting an <a> inside a <button>.
//
// Colors come from the @theme block in app/globals.css. No hex here.

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

/** Shared by every variant. The focus ring is here so no caller can drop it. */
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-40";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-acc text-bg hover:opacity-90",
  outline: "border border-line text-mut hover:border-acc/50 hover:text-acc",
  ghost: "text-mut hover:text-acc",
  danger: "border border-bad/40 text-bad hover:bg-bad/10",
};

// Both sizes clear 44px, which is the touch target rule the nav and the console
// controls are held to. The size difference is horizontal padding and type size.
const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 text-xs",
  md: "min-h-11 px-5 text-sm",
};

export interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleProps = {}): string {
  return cn(BASE, VARIANT[variant], SIZE[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...props} />;
}

export default Button;
