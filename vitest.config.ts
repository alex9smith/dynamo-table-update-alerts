import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    target: "node24",
    format: "esm"
  },
  test: {
    environment: "node",
  },
});
