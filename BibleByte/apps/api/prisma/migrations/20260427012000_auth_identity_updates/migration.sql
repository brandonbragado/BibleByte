-- Add Supabase identity tracking and anonymous-upgrade fields.
ALTER TABLE "User"
  RENAME COLUMN "authProviderId" TO "supabaseAuthUserId";

ALTER TABLE "User"
  ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'anonymous',
  ADD COLUMN "isAnonymous" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN "lastSignInAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing users as authenticated legacy records.
UPDATE "User"
SET "isAnonymous" = FALSE,
    "provider" = 'legacy',
    "lastSignInAt" = COALESCE("createdAt", CURRENT_TIMESTAMP)
WHERE "provider" = 'anonymous';
