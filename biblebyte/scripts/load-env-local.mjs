/**
 * Minimal `.env.local` loader for Node scripts (no dotenv dependency).
 * Lines: KEY=value, optional quotes; skips blanks and `#` comments.
 */
import fs from "fs";
import path from "path";

export function loadEnvLocal(cwd = process.cwd()) {
  const envPath = path.join(cwd, ".env.local");
  if (!fs.existsSync(envPath)) {
    return false;
  }
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
  return true;
}
