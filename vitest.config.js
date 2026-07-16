import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.js", "__tests__/**/*.test.jsx"],
    exclude: ["node_modules", ".next"],
    setupFiles: ["./vitest.setup.js"],
    testTimeout: 10000,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});