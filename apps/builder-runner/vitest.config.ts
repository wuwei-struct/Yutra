import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@yutra/builder-ai-core": resolve(__dirname, "../../packages/builder-ai-core/src/index.ts")
    }
  }
});
