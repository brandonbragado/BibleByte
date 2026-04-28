import { create } from "zustand";
import type { DailyAmountType, OnboardingPreference } from "@biblebites/contracts";

type AppState = {
  onboardingDraft?: { goal: string; topics: string[]; faithAnswers: string[] };
  onboarding?: OnboardingPreference;
  streak: number;
  completedLessonIds: string[];
  setOnboardingDraft: (payload: { goal: string; topics: string[]; faithAnswers: string[] }) => void;
  setOnboarding: (payload: OnboardingPreference) => void;
  completeLesson: (lessonId: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  onboardingDraft: undefined,
  onboarding: undefined,
  streak: 0,
  completedLessonIds: [],
  setOnboardingDraft: (payload) => set({ onboardingDraft: payload }),
  setOnboarding: (payload) => set({ onboarding: payload }),
  completeLesson: (lessonId) =>
    set((state) => ({
      streak: state.completedLessonIds.includes(lessonId) ? state.streak : state.streak + 1,
      completedLessonIds: state.completedLessonIds.includes(lessonId)
        ? state.completedLessonIds
        : [...state.completedLessonIds, lessonId]
    }))
}));

export const defaultDailyAmount: DailyAmountType = "passage";
