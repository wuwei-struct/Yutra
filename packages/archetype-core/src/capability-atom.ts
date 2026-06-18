import type { SideEffectLevel } from "./side-effect";

export type LocalizedText = {
  en: string;
  zhCN: string;
};

export type CapabilityAtom = {
  id: string;
  label: LocalizedText;
  description?: {
    en?: string;
    zhCN?: string;
  };
  businessObjects?: string[];
  inputs?: string[];
  outputs?: string[];
  commonActions?: string[];
  commonGuards?: string[];
  sideEffectLevel?: SideEffectLevel;
  requiresPolicyGuard?: boolean;
  requiresAudit?: boolean;
};
