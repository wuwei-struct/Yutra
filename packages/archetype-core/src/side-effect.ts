export type SideEffectLevel =
  | "none"
  | "read"
  | "write"
  | "external"
  | "financial"
  | "approval"
  | "notification"
  | "irreversible";

export const SIDE_EFFECT_LEVELS = [
  "none",
  "read",
  "write",
  "external",
  "financial",
  "approval",
  "notification",
  "irreversible"
] as const satisfies readonly SideEffectLevel[];

const SIDE_EFFECT_ORDER: Record<SideEffectLevel, number> = {
  none: 0,
  read: 1,
  write: 2,
  external: 3,
  financial: 4,
  approval: 4,
  notification: 4,
  irreversible: 5
};

export function compareSideEffectLevel(a: SideEffectLevel, b: SideEffectLevel): number {
  return SIDE_EFFECT_ORDER[a] - SIDE_EFFECT_ORDER[b];
}

export function isSideEffectAtLeast(level: SideEffectLevel, threshold: SideEffectLevel): boolean {
  return compareSideEffectLevel(level, threshold) >= 0;
}
