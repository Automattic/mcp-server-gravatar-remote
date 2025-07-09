import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["src/generated/**", "tests/**", "**/*.d.ts", "vitest.config.ts"],
    },
  },
  esbuild: {
    target: "es2022",
  },
});
