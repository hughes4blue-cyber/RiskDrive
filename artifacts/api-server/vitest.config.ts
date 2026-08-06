import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Each test file gets its own module registry so mocks don't bleed across files
    isolate: true,
    // Only include vitest-format tests; exclude legacy node:test runner files in test/
    include: ["src/__tests__/**/*.test.ts"],
  },
});
