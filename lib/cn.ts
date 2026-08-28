// Class name join. Deliberately not clsx and deliberately not tailwind-merge:
// neither is in package.json and this phase may not add a dependency, so the
// primitives in components/ui/ compose their classes with this instead.
//
// It joins truthy parts and collapses the whitespace. It does NOT resolve
// conflicting Tailwind utilities, which is why every primitive below it uses a
// variant record for anything that could conflict (padding, display, color) and
// leaves className for additions rather than overrides.

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts
    .filter((p): p is string => typeof p === "string" && p.length > 0)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
