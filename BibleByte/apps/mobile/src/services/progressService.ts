import { supabase } from "./supabase/client";
import { requireAuthenticatedUser } from "./supabase/auth";

export type ProgressSummary = {
  streak: number;
  completedLessons: number;
};

export async function markDailyByteComplete(dailyByteId: string, reflectionText?: string): Promise<void> {
  const user = await requireAuthenticatedUser();
  const completedAt = new Date().toISOString();

  const { error } = await supabase.rpc("handle_lesson_completion", {
    p_user_id: user.id,
    p_daily_byte_id: dailyByteId,
    p_completed_at: completedAt
  });

  if (error) {
    throw error;
  }

  if (reflectionText) {
    const { error: reflectionError } = await supabase
      .from("user_daily_progress")
      .update({ reflection_text: reflectionText })
      .eq("user_id", user.id)
      .eq("daily_byte_id", dailyByteId);

    if (reflectionError) {
      throw reflectionError;
    }
  }
}

export async function fetchProgressSummary(): Promise<ProgressSummary> {
  const user = await requireOptionalUser();
  if (!user) {
    return { streak: 0, completedLessons: 0 };
  }

  const [{ data: streakRow, error: streakError }, { count, error: progressError }] = await Promise.all([
    supabase.from("streaks").select("current_streak").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_daily_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id).not("completed_at", "is", null)
  ]);

  if (streakError) {
    throw streakError;
  }
  if (progressError) {
    throw progressError;
  }

  return {
    streak: streakRow?.current_streak ?? 0,
    completedLessons: count ?? 0
  };
}

async function requireOptionalUser() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}
