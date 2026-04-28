/** Option values + human labels for the 5-step spiritual onboarding flow. */

export const GROWTH_OPTIONS = [
  { value: "peace", label: "Peace" },
  { value: "faith", label: "Faith" },
  { value: "discipline", label: "Discipline" },
  { value: "forgiveness", label: "Forgiveness" },
  { value: "purpose", label: "Purpose" },
  { value: "patience", label: "Patience" },
  { value: "gratitude", label: "Gratitude" },
  { value: "wisdom", label: "Wisdom" },
] as const;

export const SEASON_OPTIONS = [
  { value: "anxious", label: "Anxious" },
  { value: "healing", label: "Healing" },
  { value: "overwhelmed", label: "Overwhelmed" },
  { value: "stuck", label: "Stuck" },
  { value: "seeking_direction", label: "Seeking direction" },
  { value: "distant_from_god", label: "Distant from God" },
  { value: "building_habits", label: "Building habits" },
  { value: "beginning_faith", label: "Beginning faith" },
] as const;

export const LEARNING_OPTIONS = [
  { value: "short_daily_verses", label: "Short daily verses" },
  { value: "reflections", label: "Reflections" },
  { value: "guided_prayer", label: "Guided prayer" },
  { value: "stories", label: "Stories" },
  { value: "life_application", label: "Life application" },
  { value: "audio", label: "Audio" },
] as const;

export const TIME_OPTIONS = [
  { value: "1", label: "1 minute" },
  { value: "3", label: "3 minutes" },
  { value: "5", label: "5 minutes" },
  { value: "10", label: "10 minutes" },
] as const;

export const SUPPORT_OPTIONS = [
  { value: "encouragement", label: "Encouragement" },
  { value: "accountability", label: "Accountability" },
  { value: "understanding_scripture", label: "Understanding scripture" },
  { value: "prayer_guidance", label: "Prayer guidance" },
  { value: "life_wisdom", label: "Life wisdom" },
  {
    value: "closer_relationship_with_god",
    label: "Closer relationship with God",
  },
] as const;
