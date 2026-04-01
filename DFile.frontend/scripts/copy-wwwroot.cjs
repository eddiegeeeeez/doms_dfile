/**
 * Copies Next.js static export (out/) into DFile.backend/wwwroot/.
 * Replaces robocopy so this works on Windows, macOS, and Linux CI.
 */
const fs = require("fs");
const path = require("path");

const frontendRoot = path.join(__dirname, "..");
const outDir = path.join(frontendRoot, "out");
const destDir = path.join(frontendRoot, "..", "DFile.backend", "wwwroot");

if (!fs.existsSync(outDir)) {
  console.error("[copy-wwwroot] Missing out/ directory. Run `next build` first.");
  process.exit(1);
}

fs.mkdirSync(path.dirname(destDir), { recursive: true });
try {
  fs.rmSync(destDir, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 });
} catch (e) {
  console.warn(
    "[copy-wwwroot] Could not remove wwwroot (often: API is running and has files open). Merging export on top — stop dotnet run for a clean replace."
  );
  console.warn(String(e && e.message ? e.message : e));
}
fs.cpSync(outDir, destDir, { recursive: true, force: true });

// Match old robocopy /XD dev — drop dev-only export if present
const devDir = path.join(destDir, "dev");
if (fs.existsSync(devDir)) {
  fs.rmSync(devDir, { recursive: true, force: true });
}

console.log("[copy-wwwroot] OK →", destDir);
