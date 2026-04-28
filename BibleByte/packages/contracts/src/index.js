// Auto-mirrored from src/index.ts. Keep in sync until packages/contracts adopts
// a proper tsc build step. Native bundlers (Metro) read the .ts directly, but
// Node consumers (apps/api) and react-native-web resolve via this .js.

const { z } = require("zod");

const DailyAmountTypeSchema = z.enum(["snippet", "passage", "section", "chapter"]);

const OnboardingPreferenceSchema = z.object({
  goals: z.array(z.string()).min(1),
  topics: z.array(z.string()).min(1),
  reminderTime: z.string(),
  timezone: z.string(),
  dailyAmountType: DailyAmountTypeSchema,
  analyticsOptIn: z.boolean(),
  skipReminderSetup: z.boolean().optional()
});

const LessonSegmentSchema = z.object({
  id: z.string(),
  verseReference: z.string(),
  scriptureTextPlaceholder: z.string(),
  contextExplanation: z.string(),
  reflectionQuestion: z.string(),
  actionPrompt: z.string(),
  orderIndex: z.number().int().nonnegative()
});

const TodayLessonSchema = z.object({
  lessonId: z.string(),
  dateKey: z.string(),
  title: z.string(),
  estimatedMinutes: z.number().int().min(3).max(10),
  segments: z.array(LessonSegmentSchema)
});

const ProgressCompleteSchema = z.object({
  lessonId: z.string(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  durationSeconds: z.number().int().nonnegative(),
  idempotencyKey: z.string().min(8)
});

const AnalyticsEventSchema = z.enum([
  "onboarding_started",
  "onboarding_completed",
  "lesson_started",
  "lesson_completed",
  "streak_updated",
  "notification_opened",
  "snippet_viewed",
  "verse_saved",
  "verse_unsaved",
  "verse_shared",
  "reminder_scheduled",
  "reminder_disabled",
  "verse_highlighted",
  "verse_unhighlighted",
  "reference_jumped",
  "reading_resumed"
]);

const TestamentSchema = z.enum(["old", "new"]);

const BookGroupSchema = z.enum([
  "pentateuch",
  "historical",
  "wisdom",
  "major_prophets",
  "minor_prophets",
  "gospels",
  "acts_history",
  "pauline_letters",
  "general_letters",
  "apocalyptic"
]);

const HighlightColorSchema = z.enum(["sage", "amber", "blush", "sky"]);

const VerseHighlightSchema = z.object({
  verseId: z.string().uuid(),
  color: HighlightColorSchema
});

const ReadingPositionSchema = z.object({
  bookId: z.string().uuid(),
  chapterId: z.string().uuid(),
  verseId: z.string().uuid().nullable()
});

const ReferenceJumpSchema = z.object({
  bookName: z.string().min(1),
  chapterNumber: z.number().int().positive(),
  verseNumber: z.number().int().positive().nullable()
});

const ReminderTimeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const NotificationScheduleSchema = z.object({
  reminderTime: z.string().regex(ReminderTimeRegex, "reminderTime must be HH:MM or HH:MM:SS"),
  timezone: z.string().min(1),
  enabled: z.boolean()
});

const SavedVerseSchema = z.object({
  verseReference: z.string().min(1),
  verseText: z.string().min(1),
  translation: z.literal("NIV"),
  source: z.enum(["bible_reader", "daily_byte"]),
  verseId: z.string().uuid().optional(),
  dailyByteDate: z.string().optional()
});

module.exports = {
  DailyAmountTypeSchema,
  OnboardingPreferenceSchema,
  LessonSegmentSchema,
  TodayLessonSchema,
  ProgressCompleteSchema,
  AnalyticsEventSchema,
  NotificationScheduleSchema,
  SavedVerseSchema,
  TestamentSchema,
  BookGroupSchema,
  HighlightColorSchema,
  VerseHighlightSchema,
  ReadingPositionSchema,
  ReferenceJumpSchema
};
