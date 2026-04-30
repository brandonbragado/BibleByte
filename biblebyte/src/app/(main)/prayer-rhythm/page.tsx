import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ from?: string }>;
};

/** Full-page route kept for bookmarks & pushes; experience is the Home sheet (`?prayer=1`). */
export default async function PrayerRhythmPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  q.set("prayer", "1");
  if (sp.from === "reminder") q.set("from", "reminder");
  redirect(`/home?${q.toString()}`);
}
