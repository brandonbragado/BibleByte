export type PrayerStatus = "asked" | "waiting" | "answered";

export type PrayerRow = {
  id: string;
  user_id: string;
  request: string;
  notes: string | null;
  status: PrayerStatus;
  answered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JournalEntryKind = "reflection" | "gratitude" | "insight";

export type JournalEntryRow = {
  id: string;
  user_id: string;
  kind: JournalEntryKind;
  body: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
};
