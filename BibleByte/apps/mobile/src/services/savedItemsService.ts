import { SavedVerseSchema } from "@biblebites/contracts";
import { createKvStorage } from "./storage/kvStorage";
import { fetchSavedVerses, type SavedVerse } from "./bibleService";
import { trackEvent } from "./analyticsService";

/**
 * Saved items service.
 *
 * Combines two sources of saved verses:
 *  1. Database (`saved_verses` table) - linked to `bible_verses` rows.
 *  2. Local MMKV - stores user-saved daily verses (which currently do not have a
 *     bible_verses FK target during MVP placeholder content).
 *
 * Both sources are merged and surfaced in the Saved screen.
 */

const storage = createKvStorage("biblebyte.saved");
const STORAGE_KEY = "saved_dailies_v1";

export type SavedItem = {
  id: string;
  verseId: string | null;
  reference: string;
  text: string;
  translation: string;
  source: "db" | "local";
  savedAt: string;
};

type LocalSavedDaily = {
  id: string;
  reference: string;
  text: string;
  translation: string;
  savedAt: string;
};

function readLocal(): LocalSavedDaily[] {
  const raw = storage.getString(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as LocalSavedDaily[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(items: LocalSavedDaily[]) {
  storage.set(STORAGE_KEY, JSON.stringify(items));
}

export function isDailySaved(reference: string): boolean {
  return readLocal().some((item) => item.reference === reference);
}

export function saveDailyLocally(input: { reference: string; text: string; translation?: string; dailyByteDate?: string }) {
  SavedVerseSchema.parse({
    verseReference: input.reference,
    verseText: input.text,
    translation: "NIV",
    source: "daily_byte",
    dailyByteDate: input.dailyByteDate
  });

  const existing = readLocal();
  if (existing.some((item) => item.reference === input.reference)) {
    return;
  }
  const next: LocalSavedDaily = {
    id: `local-${Date.now()}-${input.reference}`,
    reference: input.reference,
    text: input.text,
    translation: input.translation ?? "NIV",
    savedAt: new Date().toISOString()
  };
  writeLocal([next, ...existing]);
  void trackEvent("verse_saved", { reference: input.reference, source: "daily_byte" });
}

export function unsaveDailyLocally(reference: string) {
  const remaining = readLocal().filter((item) => item.reference !== reference);
  writeLocal(remaining);
  void trackEvent("verse_unsaved", { reference, source: "daily_byte" });
}

export async function fetchAllSavedItems(): Promise<SavedItem[]> {
  const [dbVerses, localItems] = await Promise.all([
    fetchSavedVerses().catch((error: unknown) => {
      console.warn("saved_verses_fetch_failed", error);
      return [] as SavedVerse[];
    }),
    Promise.resolve(readLocal())
  ]);

  const dbMapped: SavedItem[] = dbVerses.map((row) => ({
    id: row.id,
    verseId: row.verseId,
    reference: row.verseReference,
    text: row.verseText,
    translation: "NIV",
    source: "db",
    savedAt: ""
  }));

  const localMapped: SavedItem[] = localItems.map((row) => ({
    id: row.id,
    verseId: null,
    reference: row.reference,
    text: row.text,
    translation: row.translation,
    source: "local",
    savedAt: row.savedAt
  }));

  return [...localMapped, ...dbMapped];
}
