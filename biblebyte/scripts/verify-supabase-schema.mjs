#!/usr/bin/env node
/**
 * Confirms critical tables/columns exist on the LIVE Supabase project
 * configured in `.env.local` (uses service role — server-side only).
 *
 * Run from repo root `biblebyte/`: `npm run verify:schema`
 *
 * This complements `verify:migrations` (filesystem only).
 */
import { createClient } from "@supabase/supabase-js";

import { loadEnvLocal } from "./load-env-local.mjs";

const CHECKS = [
  {
    label: "001 core profile",
    table: "user_profiles",
    columns: "id, onboarding_completed",
    migration: "001_biblebyte_core.sql",
  },
  {
    label: "002 reflections entry_date",
    table: "daily_reflections",
    columns: "id, entry_date",
    migration: "002_daily_reflections_entry_date.sql",
  },
  {
    label: "003 reading_positions",
    table: "reading_positions",
    columns: "user_id, book_code, chapter",
    migration: "003_tier1_reading_and_companion.sql",
  },
  {
    label: "004 prayers",
    table: "prayers",
    columns: "id, status",
    migration: "004_tier2_journal_daily_verse.sql",
  },
  {
    label: "004 journal_entries",
    table: "journal_entries",
    columns: "id, kind",
    migration: "004_tier2_journal_daily_verse.sql",
  },
  {
    label: "004 daily_verses",
    table: "daily_verses",
    columns: "verse_date, reference",
    migration: "004_tier2_journal_daily_verse.sql",
  },
  {
    label: "005 personalization columns",
    table: "user_profiles",
    columns: "id, analytics_opt_in, reminder_enabled, reminder_wall_time",
    migration: "005_tier3_personalization.sql",
  },
  {
    label: "007 profile identity",
    table: "user_profiles",
    columns: "id, first_name, last_name, phone",
    migration: "007_profile_identity.sql",
  },
  {
    label: "008 chat_sessions",
    table: "chat_sessions",
    columns: "id, user_id, title",
    migration: "008_chat_messages_text_user.sql",
  },
  {
    label: "008 chat_messages (text + user_id)",
    table: "chat_messages",
    columns: "id, session_id, user_id, role, content",
    migration: "008_chat_messages_text_user.sql",
  },
  {
    label: "005 analytics_events",
    table: "analytics_events",
    columns: "id, name",
    migration: "005_tier3_personalization.sql",
  },
  {
    label: "005 push_devices",
    table: "push_devices",
    columns: "user_id, platform, device_token",
    migration: "005_tier3_personalization.sql",
  },
];

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local — cannot probe remote schema."
    );
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let failed = false;

  for (const c of CHECKS) {
    const { error } = await admin.from(c.table).select(c.columns).limit(1);
    if (error) {
      failed = true;
      console.error(`✗ [${c.label}] ${c.table}: ${error.message}`);
      console.error(`    Expected migration: ${c.migration}`);
    } else {
      console.log(`✓ [${c.label}] ${c.table}`);
    }
  }

  if (failed) {
    console.error("\nFix: apply pending SQL migrations to THIS Supabase project, then re-run.");
    process.exit(1);
  }

  console.log("\nOK — remote schema checks passed for configured Supabase project.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
