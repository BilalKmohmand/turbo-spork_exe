const { build } = require("esbuild");
const path = require("path");
const fs = require("fs");

const rootDir = path.resolve(__dirname, "..", "..");
const outDir = path.resolve(__dirname, "..", "backend");
const nodeModulesDir = path.resolve(__dirname, "..", "node_modules");

fs.mkdirSync(outDir, { recursive: true });

build({
  entryPoints: [path.join(rootDir, "server", "desktop-server.ts")],
  platform: "node",
  bundle: true,
  format: "cjs",
  target: "node18",
  nodePaths: [nodeModulesDir],
  outfile: path.join(outDir, "desktop-server.cjs"),
  sourcemap: false,
  minify: true,
  external: [
    // Keep native deps external if present; electron-builder will pack node_modules.
    // If you later switch to including a pruned node_modules, revisit this list.
  ],
  logLevel: "info",
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
