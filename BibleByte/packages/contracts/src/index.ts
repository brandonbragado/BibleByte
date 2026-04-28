import { z } from "zod";

export const DailyAmountTypeSchema = z.enum(["snippet", "passage", "section", "chapter"]);
export type DailyAmountType = z.infer<typeof DailyAmountTypeSchema>;

export const OnboardingPreferenceSchema = z.object({
  goals: z.array(z.string()).min(1),
  topics: z.array(z.string()).min(1),
  reminderTime: z.string(),
  timezone: z.string(),
  dailyAmountType: DailyAmountTypeSchema,
  analyticsOptIn: z.boolean(),
  /** When true, preferences are saved but notifications stay off until the user picks a time in Settings. */
  skipReminderSetup: z.boolean().optional()
});

export const LessonSegmentSchema = z.object({
  id: z.string(),
  verseReference: z.string(),
  scriptureTextPlaceholder: z.string(),
  contextExplanation: z.string(),
  reflectionQuestion: z.string(),
  actionPrompt: z.string(),
  orderIndex: z.number().int().nonnegative()
});

export const TodayLessonSchema = z.object({
  lessonId: z.string(),
  dateKey: z.string(),
  title: z.string(),
  estimatedMinutes: z.number().int().min(3).max(10),
  segments: z.array(LessonSegmentSchema)
});

export const ProgressCompleteSchema = z.object({
  lessonId: z.string(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  durationSeconds: z.number().int().nonnegative(),
  idempotencyKey: z.string().min(8)
});

export const AnalyticsEventSchema = z.enum([
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

export const TestamentSchema = z.enum(["old", "new"]);

export const BookGroupSchema = z.enum([
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

export const HighlightColorSchema = z.enum(["sage", "amber", "blush", "sky"]);

export const VerseHighlightSchema = z.object({
  verseId: z.string().uuid(),
  color: HighlightColorSchema
});

export const ReadingPositionSchema = z.object({
  bookId: z.string().uuid(),
  chapterId: z.string().uuid(),
  verseId: z.string().uuid().nullable()
});

export const ReferenceJumpSchema = z.object({
  bookName: z.string().min(1),
  chapterNumber: z.number().int().positive(),
  verseNumber: z.number().int().positive().nullable()
});

const ReminderTimeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const NotificationScheduleSchema = z.object({
  reminderTime: z.string().regex(ReminderTimeRegex, "reminderTime must be HH:MM or HH:MM:SS"),
  timezone: z.string().min(1),
  enabled: z.boolean()
});

export const SavedVerseSchema = z.object({
  verseReference: z.string().min(1),
  verseText: z.string().min(1),
  translation: z.literal("NIV"),
  source: z.enum(["bible_reader", "daily_byte"]),
  verseId: z.string().uuid().optional(),
  dailyByteDate: z.string().optional()
});

export type OnboardingPreference = z.infer<typeof OnboardingPreferenceSchema>;
export type TodayLesson = z.infer<typeof TodayLessonSchema>;
export type ProgressComplete = z.infer<typeof ProgressCompleteSchema>;
export type NotificationSchedule = z.infer<typeof NotificationScheduleSchema>;
export type SavedVerse = z.infer<typeof SavedVerseSchema>;
export type Testament = z.infer<typeof TestamentSchema>;
export type BookGroup = z.infer<typeof BookGroupSchema>;
export type HighlightColor = z.infer<typeof HighlightColorSchema>;
export type VerseHighlight = z.infer<typeof VerseHighlightSchema>;
export type ReadingPosition = z.infer<typeof ReadingPositionSchema>;
export type ReferenceJump = z.infer<typeof ReferenceJumpSchema>;
