import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

const entryPoints = [
  { src: "./src/fastedge-build/index.js", dest: "./bin/fastedge-build.js" },
  { src: "./src/fastedge-init/index.js", dest: "./bin/fastedge-init.js" },
];

async function buildAll() {
  for (const { src, dest } of entryPoints) {
    console.log("Farq: buildAll -> dest", dest);
    await build({
      entryPoints: [src],
      bundle: true,
      outfile: dest,
      platform: "node",
      format: "esm",
      external: [
        "@bytecodealliance/wizer",
        "@bytecodealliance/jco",
        "esbuild",
        "enquirer",
        "regexpu-core",
        "acorn",
        "magic-string",
        "acorn-walk",
      ],
      logLevel: "info",
    });
  }
}

try {
  await buildAll();
} catch (e) {
  console.error("Build Failed:", e);
}

const prependNodeShebangToFile = (relativeFilePath) => {
  const filePath = fileURLToPath(
    new URL(path.resolve(process.cwd(), relativeFilePath), import.meta.url),
  );
  const content = readFileSync(filePath, "utf8");
  const shebang = "#!/usr/bin/env node";
  const shebangExists = content.startsWith(shebang);
  if (!shebangExists) {
    writeFileSync(filePath, `${shebang}\n\n${content}`);
  }
};

prependNodeShebangToFile("./bin/fastedge-build.js");
prependNodeShebangToFile("./bin/fastedge-init.js");
