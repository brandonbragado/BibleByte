import { Share } from "react-native";
import { trackEvent } from "./analyticsService";

type ShareVerseInput = {
  reference: string;
  text: string;
  translation?: string;
  source?: "today" | "today_spotlight" | "reader" | "saved" | "search";
};

export type ShareVerseResult = {
  shared: boolean;
  activityType?: string | null;
};

/**
 * Share a verse via the OS share sheet. Wraps text in BibleByte attribution
 * and emits a `verse_shared` analytics event when the share completes.
 *
 * TODO[NIV_LICENSE]: Confirm whether sharing requires the full NIV copyright
 * footer (e.g. "Scripture quotations taken from..."). Until licensing is
 * finalized, NIV-safe placeholder text is shared.
 */
export async function shareVerse({
  reference,
  text,
  translation = "NIV",
  source = "today"
}: ShareVerseInput): Promise<ShareVerseResult> {
  const message = [`${reference} (${translation})`, "", `"${text}"`, "", "Shared via BibleByte"].join("\n");

  const result = await Share.share(
    { message, title: reference },
    { dialogTitle: "Share verse", subject: `${reference} - BibleByte` }
  );

  const shared = result.action === Share.sharedAction;
  if (shared) {
    void trackEvent("verse_shared", {
      reference,
      translation,
      source,
      activityType: result.activityType ?? null
    });
  }

  return { shared, activityType: result.activityType ?? null };
}
