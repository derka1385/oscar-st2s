import { build } from "esbuild";
import { mkdir, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
await mkdir(".test-output", { recursive: true });
try {
  await build({
    entryPoints: ["lib/model.test.ts"],
    outfile: ".test-output/model.mjs",
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
  });
  await import(pathToFileURL(process.cwd() + "/.test-output/model.mjs"));
} finally {
  await rm(".test-output", { recursive: true, force: true });
}
