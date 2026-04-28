#!/usr/bin/env node
/**
 * Creates (or confirms existence of) a dev-only Supabase Auth user with email/password.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from apps/api/.env (never commit secrets).
 *
 * Usage (from repo root):
 *   npm run auth:create-dev-user
 *
 * Overrides:
 *   DEV_TEST_LOGIN_EMAIL    default dev-test@biblebyte.dev
 *   DEV_TEST_LOGIN_PASSWORD default BibleByte_Dev_12345!
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function parseEnvFile(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .reduce((acc, line) => {
      const separator = line.indexOf("=");
      if (separator === -1) {
        return acc;
      }
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

const apiEnvPath = path.join(root, "apps/api/.env");
if (!fs.existsSync(apiEnvPath)) {
  console.error(`Missing ${path.relative(root, apiEnvPath)}. Copy apps/api/.env.example and add Supabase credentials.`);
  process.exit(1);
}

const apiEnv = parseEnvFile(fs.readFileSync(apiEnvPath, "utf8"));

const supabaseUrl = (process.env.SUPABASE_URL || apiEnv.SUPABASE_URL || "").replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || apiEnv.SUPABASE_SERVICE_ROLE_KEY || "";

const email =
  process.env.DEV_TEST_LOGIN_EMAIL ||
  apiEnv.DEV_TEST_LOGIN_EMAIL ||
  "dev-test@biblebyte.dev";
const password =
  process.env.DEV_TEST_LOGIN_PASSWORD ||
  apiEnv.DEV_TEST_LOGIN_PASSWORD ||
  "BibleByte_Dev_12345!";

if (!supabaseUrl || supabaseUrl.includes("YOUR_PROJECT_REF")) {
  console.error("Set a real SUPABASE_URL in apps/api/.env.");
  process.exit(1);
}
if (!serviceRoleKey || serviceRoleKey.includes("YOUR_")) {
  console.error("Set SUPABASE_SERVICE_ROLE_KEY in apps/api/.env (Dashboard → Settings → API → service_role).");
  process.exit(1);
}

const endpoint = `${supabaseUrl}/auth/v1/admin/users`;

async function main() {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { biblebyte_dev_test: true }
    })
  });

  const bodyText = await res.text();
  let bodyJson = null;
  try {
    bodyJson = JSON.parse(bodyText);
  } catch {
    // ignore
  }

  if (res.ok) {
    console.log("\nCreated dev test user (session not stored — log in from the app).\n");
    printCredentials();
    process.exit(0);
  }

  const duplicate =
    res.status === 422 ||
    (bodyJson?.msg && String(bodyJson.msg).toLowerCase().includes("already")) ||
    (bodyJson?.error_code === "email_exists");

  if (duplicate) {
    console.log("\nThat email already exists in Supabase Auth — use these credentials if you chose them when creating the user:\n");
    printCredentials();
    console.log('If you forgot the password, reset it from Supabase Dashboard → Authentication → Users, or delete the user and run this script again.\n');
    process.exit(0);
  }

  console.error(`Admin API error (${res.status}):`, bodyText || bodyJson);
  process.exit(1);
}

function printCredentials() {
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log("\nUse Sign in → email/password in the app. Do not reuse this password outside local/dev.\n");
}

main();
