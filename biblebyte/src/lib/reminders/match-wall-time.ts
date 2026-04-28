/**
 * Matches stored reminder_wall_time (Postgres TIME → API string like `HH:MM:SS`)
 * against the current UTC clock minute.
 *
 * Until mobile ships proper IANA time zones, reminders intentionally interpret
 * reminder_wall_time as UTC wall-clock — document clearly in Settings UX.
 */

export function parsePgTimeToUtcHm(value: unknown): { hour: number; minute: number } | null {
  if (value == null) return null;
  const s = typeof value === "string" ? value : String(value);
  const compact = s.includes("T") ? s.split("T")[1]?.slice(0, 8) ?? s : s;
  const parts = compact.replace(/Z$/i, "").split(":");
  if (parts.length < 2) return null;
  const hour = Number.parseInt(parts[0] ?? "", 10);
  const minute = Number.parseInt(parts[1] ?? "", 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function utcMinuteMatchesReminderWallTime(pgTime: unknown, nowUtc: Date): boolean {
  const hm = parsePgTimeToUtcHm(pgTime);
  if (!hm) return false;
  return hm.hour === nowUtc.getUTCHours() && hm.minute === nowUtc.getUTCMinutes();
}
