import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/generated/**",
        "tests/**",
        "**/*.d.ts",
        "vitest.config.ts",
        "node_modules/**",
        "dist/**",
        "coverage/**",
        "**/*.test.ts",
        "**/*.spec.ts",
      ],
    },
  },
  esbuild: {
    target: "es2022",
  },
});
