/* Copy build/index.html to build/404.html so GitHub Pages serves the SPA for deep routes */
const fs = require("fs");
const path = require("path");

const buildDir = path.join(__dirname, "..", "build");
const indexPath = path.join(buildDir, "index.html");
const destPath = path.join(buildDir, "404.html");

function main() {
  if (!fs.existsSync(buildDir)) {
    console.error(`[copy-404] Build directory does not exist: ${buildDir}`);
    process.exit(0);
  }
  if (!fs.existsSync(indexPath)) {
    console.error(`[copy-404] index.html not found at: ${indexPath}`);
    process.exit(0);
  }
  fs.copyFileSync(indexPath, destPath);
  console.log(`[copy-404] Created 404.html from index.html`);
}

main();