import { existsSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

export function findWorkspaceRoot(start: string): string {
  let current = start;
  while (true) {
    if (existsSync(resolve(current, "pnpm-workspace.yaml"))) return current;
    const parent = dirname(current);
    if (parent === current) return start;
    current = parent;
  }
}

export function resolveWorkspacePath(inputPath: string): string {
  if (isAbsolute(inputPath)) return inputPath;
  const cwdPath = resolve(process.cwd(), inputPath);
  if (existsSync(cwdPath)) return cwdPath;
  return resolve(findWorkspaceRoot(process.cwd()), inputPath);
}
