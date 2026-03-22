#!/usr/bin/env node
/**
 * Patches package.json exports in contexts and contracts to point
 * to dist/ so compiled JS can be run with plain `node`.
 * Used in CI for E2E tests and in Docker builds.
 */
const fs = require("fs");
const path = require("path");

const packages = ["contexts", "contracts"];

for (const pkg of packages) {
  const pkgPath = path.join(__dirname, "..", "packages", pkg, "package.json");
  const json = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  json.exports = { "./*": "./dist/*/index.js" };
  fs.writeFileSync(pkgPath, JSON.stringify(json, null, 2) + "\n");
  console.log(`Patched ${pkg} exports → dist/`);
}
