#!/usr/bin/env node
/**
 * Smoke-test API.Bible auth using API_BIBLE_KEY from process.env or biblebyte/.env.local
 * (no secrets printed). Exit 0 only on HTTP 200 from GET /v1/bibles.
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
  if (!fs.existsSync(p)) return {};
  const out = {};
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const fileEnv = loadDotEnvLocal();
const key = (process.env.API_BIBLE_KEY || fileEnv.API_BIBLE_KEY || "").trim();

if (!key) {
  console.error("verify-api-bible: set API_BIBLE_KEY in env or .env.local");
  process.exit(2);
}

const res = await fetch("https://api.scripture.api.bible/v1/bibles", {
  headers: { "api-key": key },
});

console.error("verify-api-bible: HTTP", res.status);
if (!res.ok) {
  const t = await res.text();
  console.error(t.slice(0, 240));
  process.exit(1);
}

console.error("verify-api-bible: OK (200)");
process.exit(0);
