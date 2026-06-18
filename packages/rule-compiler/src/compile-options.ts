import type { CompileMode } from "./types";

export type CompileOptions = {
  mode: CompileMode;
  locale: "en" | "zh-CN";
};

export function resolveCompileOptions(input?: { mode?: CompileMode; locale?: "en" | "zh-CN" }): CompileOptions {
  return {
    mode: input?.mode ?? "preview",
    locale: input?.locale ?? "en"
  };
}
