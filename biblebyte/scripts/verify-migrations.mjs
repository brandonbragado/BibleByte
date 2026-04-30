#!/usr/bin/env node
/**
 * Verifies expected Supabase migration files exist (run in CI / before deploy).
 * Does not connect to Postgres — filesystem check only (critical action item #1).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");

const REQUIRED_ORDER = [
  "001_biblebyte_core.sql",
  "002_daily_reflections_entry_date.sql",
  "003_tier1_reading_and_companion.sql",
  "004_tier2_journal_daily_verse.sql",
  "005_tier3_personalization.sql",
  "006_scripture_license_markers.sql",
  "007_profile_identity.sql",
  "008_chat_messages_text_user.sql",
  "009_prayer_check_ins.sql",
  "010_profile_personalization.sql",
];

function main() {
  if (!fs.existsSync(migrationsDir)) {
    console.error(`Missing directory: ${migrationsDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const missing = REQUIRED_ORDER.filter((name) => !files.includes(name));
  const unexpected = files.filter((name) => !REQUIRED_ORDER.includes(name));

  if (missing.length > 0) {
    console.error("Missing required migration files:", missing.join(", "));
    process.exit(1);
  }

  if (unexpected.length > 0) {
    console.error(
      "Unexpected .sql files (update REQUIRED_ORDER in scripts/verify-migrations.mjs):",
      unexpected.join(", ")
    );
    process.exit(1);
  }

  const ordered = REQUIRED_ORDER.every((name, i) => files[i] === name);
  if (!ordered) {
    console.error("Migration files must sort lexically in dependency order.");
    console.error("Expected:", REQUIRED_ORDER.join(", "));
    console.error("Got:", files.join(", "));
    process.exit(1);
  }

  console.log(`OK — ${REQUIRED_ORDER.length} migrations present under supabase/migrations/`);
}

main();
