-- Initial schema for BibleBites Phase 1 MVP.
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "authProviderId" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);

CREATE TABLE "UserPreference" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL,
  "goals" TEXT[] NOT NULL,
  "topics" TEXT[] NOT NULL,
  "reminderTime" TEXT NOT NULL,
  "timezone" TEXT NOT NULL,
  "dailyAmountType" TEXT NOT NULL,
  "analyticsOptIn" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE "Lesson" (
  "id" TEXT PRIMARY KEY,
  "dateKey" TEXT UNIQUE NOT NULL,
  "title" TEXT NOT NULL,
  "estimatedMinutes" INTEGER NOT NULL,
  "nivContentStatus" TEXT NOT NULL
);

CREATE TABLE "Segment" (
  "id" TEXT PRIMARY KEY,
  "lessonId" TEXT NOT NULL REFERENCES "Lesson"("id"),
  "verseReference" TEXT NOT NULL,
  "scriptureTextPlaceholder" TEXT NOT NULL,
  "contextExplanation" TEXT NOT NULL,
  "reflectionQuestion" TEXT NOT NULL,
  "actionPrompt" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL
);

CREATE TABLE "Snippet" (
  "id" TEXT PRIMARY KEY,
  "dateKey" TEXT UNIQUE NOT NULL,
  "verseReference" TEXT NOT NULL,
  "snippetTextPlaceholder" TEXT NOT NULL,
  "cachedUntil" TIMESTAMP NOT NULL
);

CREATE TABLE "Progress" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id"),
  "lessonId" TEXT NOT NULL REFERENCES "Lesson"("id"),
  "status" TEXT NOT NULL,
  "completedAt" TIMESTAMP,
  "durationSeconds" INTEGER
);

CREATE TABLE "Streak" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL REFERENCES "User"("id"),
  "currentStreak" INTEGER NOT NULL,
  "longestStreak" INTEGER NOT NULL,
  "lastCompletedDate" TIMESTAMP
);

CREATE TABLE "NotificationSchedule" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id"),
  "localTime" TEXT NOT NULL,
  "timezone" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL,
  "lastSentAt" TIMESTAMP
);

CREATE TABLE "AnalyticsEvent" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id"),
  "eventName" TEXT NOT NULL,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Lesson_dateKey_idx" ON "Lesson"("dateKey");
CREATE INDEX "Snippet_dateKey_idx" ON "Snippet"("dateKey");
CREATE INDEX "Progress_userId_idx" ON "Progress"("userId");
CREATE INDEX "Progress_lessonId_idx" ON "Progress"("lessonId");
CREATE INDEX "AnalyticsEvent_eventName_idx" ON "AnalyticsEvent"("eventName");
