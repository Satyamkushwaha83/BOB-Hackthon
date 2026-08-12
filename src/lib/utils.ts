/**
 * Tiny class-merge utility — concatenates non-empty class strings.
 * Avoids pulling in a full cn/clsx library for this prototype.
 *
 * Usage: cn("px-4", condition && "font-bold", "text-sm")
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Returns a triage badge colour class set for a given triage level */
export function triageColor(level: "urgent" | "amber" | "routine"): string {
  if (level === "urgent") return "bg-red-100 text-red-700 border-red-300";
  if (level === "amber") return "bg-amber-100 text-amber-700 border-amber-300";
  return "bg-emerald-100 text-emerald-700 border-emerald-300";
}

/** Returns a short human-readable label for a triage level */
export function triageLabel(level: "urgent" | "amber" | "routine"): string {
  if (level === "urgent") return "Urgent";
  if (level === "amber") return "Doctor Review";
  return "Routine";
}

/** Clamps a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
