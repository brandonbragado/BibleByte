import { addDaysYmd, ymdToDayIndex } from "./dates";

/**
 * Grace rule (single definition for streak + best streak):
 *
 * When walking *backward* from an anchor calendar day, we allow **exactly one**
 * day without a check-in before stopping the chain. That models one “pause” in
 * the rhythm (e.g. missed Tuesday between Monday and Wednesday still continues).
 *
 * The skipped day does not increase the streak count—only days with check-ins count.
 *
 * We intentionally avoid a rolling 7-day window here to keep behavior predictable
 * in tests and UX; product can tighten/change this in one place.
 */
export function computeStreakWithGrace(
  checkInDates: Set<string>,
  anchorYmd: string
): number {
  let cursor = anchorYmd;
  let count = 0;
  let graceLeft = true;
  const maxSteps = 5000;
  for (let step = 0; step < maxSteps; step++) {
    if (checkInDates.has(cursor)) {
      count += 1;
      cursor = addDaysYmd(cursor, -1);
      continue;
    }
    if (graceLeft) {
      graceLeft = false;
      cursor = addDaysYmd(cursor, -1);
      continue;
    }
    break;
  }
  return count;
}

/**
 * Longest run of check-ins where each jump between consecutive prayed days is at most
 * two calendar days (i.e. at most one empty day between)—matches backward grace for chains.
 */
export function computeBestStreakWithGrace(sortedUniqueYmd: string[]): number {
  if (sortedUniqueYmd.length === 0) return 0;
  let best = 1;
  let runStart = 0;
  for (let i = 1; i < sortedUniqueYmd.length; i++) {
    const gap = ymdToDayIndex(sortedUniqueYmd[i]) - ymdToDayIndex(sortedUniqueYmd[i - 1]);
    if (gap > 2) {
      best = Math.max(best, i - runStart);
      runStart = i;
    }
  }
  best = Math.max(best, sortedUniqueYmd.length - runStart);
  return best;
}

export const MILESTONE_THRESHOLDS = [7, 14, 30, 90] as const;

export function nextMilestoneToCelebrate(
  totalDays: number,
  celebratedUpTo: number
): (typeof MILESTONE_THRESHOLDS)[number] | null {
  for (const t of MILESTONE_THRESHOLDS) {
    if (totalDays >= t && celebratedUpTo < t) return t;
  }
  return null;
}
