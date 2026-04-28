import type { TodayLesson } from "@biblebites/contracts";
import { TodayLessonSchema } from "@biblebites/contracts";
import { supabase } from "./supabase/client";

export async function fetchTodayLesson(): Promise<TodayLesson> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.from("daily_bytes").select("*").eq("date", today).maybeSingle();

  if (error) {
    throw error;
  }

  const lesson = {
    lessonId: data?.id ?? `placeholder-${today}`,
    dateKey: today,
    title: "Today's BibleByte",
    estimatedMinutes: data?.estimated_minutes ?? 5,
    segments: [
      {
        id: `${data?.id ?? today}-segment-0`,
        verseReference: data?.verse_reference ?? "Proverbs 3:5-6 (NIV placeholder)",
        scriptureTextPlaceholder:
          data?.verse_text ?? "TODO[NIV_LICENSE]: Licensed NIV text renders here before production launch.",
        contextExplanation: data?.summary ?? "Short context is unavailable right now.",
        reflectionQuestion: data?.reflection_question ?? "How can you apply this truth today?",
        actionPrompt: data?.prayer_prompt ?? "Take one prayerful action step today.",
        orderIndex: 0
      }
    ]
  };

  return TodayLessonSchema.parse(lesson);
}
