import { defineConfig } from "vitest/config";
import { buildSync } from "esbuild";

const workerSource = buildSync({
  entryPoints: ["src/utils/compiler.worker.ts"], bundle: true, write: false,
  platform: "browser", format: "iife", target: "es2022",
}).outputFiles[0].text;

export default defineConfig({
  esbuild: { jsx: "automatic" },
  plugins: [{
    name: "compiler-worker-source",
    resolveId(id) { if (id === "custom-block:compiler-worker") return id; },
    load(id) { if (id === "custom-block:compiler-worker") return `export default ${JSON.stringify(workerSource)}`; },
  }],
  test: { environment: "jsdom", globals: true, setupFiles: ["./tests/host-ui.tsx", "./tests/compiler-mock.ts"] },
});
