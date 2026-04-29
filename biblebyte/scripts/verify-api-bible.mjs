#!/usr/bin/env node
/**
 * Smoke-test API.Bible auth using API_BIBLE_KEY from process.env or biblebyte/.env.local
 * (never prints the key — only length, source, and byte hints).
 * Exit 0 only on HTTP 200 from GET /v1/bibles.
 *
 * Usage: npm run verify:api-bible
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadDotEnvLocal() {
  const p = path.join(root, ".env.local");
  if (!fs.existsSync(p)) return { path: p, vars: {}, exists: false };
  let raw = fs.readFileSync(p, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) {
    raw = raw.slice(1);
  }
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    let k = t.slice(0, i).trim();
    if (k.startsWith("export ")) {
      k = k.slice(7).trim();
    }
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return { path: p, vars: out, exists: true };
}

const { path: envPath, vars: fileEnv, exists: envFileExists } = loadDotEnvLocal();
const fromProcess = Boolean(process.env.API_BIBLE_KEY && String(process.env.API_BIBLE_KEY).trim());
const key = (process.env.API_BIBLE_KEY || fileEnv.API_BIBLE_KEY || "").trim();

function byteHints(s) {
  if (!s) return "(empty)";
  const a = s.codePointAt(0);
  const b = s.codePointAt(s.length - 1);
  return `len=${s.length} firstU32=0x${a?.toString(16)} lastU32=0x${b?.toString(16)}`;
}

console.error("verify-api-bible: diagnostics (no secret printed)");
console.error(
  "  source:",
  fromProcess ? "process.env.API_BIBLE_KEY" : fileEnv.API_BIBLE_KEY ? ".env.local" : "none"
);
console.error("  .env.local:", envFileExists ? envPath : "(missing file)");
console.error("  key", byteHints(key));

if (!key) {
  console.error("verify-api-bible: set API_BIBLE_KEY or add it to .env.local (single line, no spaces around =)");
  process.exit(2);
}

/** Invisible / mistaken chars that often break pasted keys */
const badChars = /[\s\u200b\u200c\u200d\ufeff\u00a0]/;
if (badChars.test(key)) {
  console.error(
    "verify-api-bible: warning — key contains whitespace or invisible Unicode; re-copy from dashboard or paste into a plain-text editor."
  );
}

const url =
  (process.env.API_BIBLE_BASE_URL || "https://api.scripture.api.bible/v1").replace(/\/$/, "") +
  "/bibles";

const res = await fetch(url, {
  headers: { "api-key": key },
});

console.error("verify-api-bible: HTTP", res.status, "URL", url);
if (!res.ok) {
  const t = await res.text();
  console.error(t.slice(0, 280));
  console.error(
    "\nIf HTTP 401 with bad api-key but the key is “correct” in the dashboard:\n" +
      "  • Copy the **secret API key** again (not an app name, client id, or truncated cell).\n" +
      "  • Ensure the account/app is **approved** at scripture.api.bible.\n" +
      "  • No `export` typo on the key name; one line: API_BIBLE_KEY=your_secret\n" +
      "  • Run from `biblebyte/` so .env.local is the file next to package.json.\n"
  );
  process.exit(1);
}

console.error("verify-api-bible: OK (200)");
process.exit(0);
