// Daily activity and streak tracking. Dates use the learner's local calendar day.

/** Local date as YYYY-MM-DD */
export function dayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Same day as `d`, `n` days earlier (handles month/year boundaries and DST) */
export function daysAgo(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - n);
}

/** Study actions per day, e.g. { "2026-10-11": 4 } */
export type ActivityMap = Record<string, number>;

export function addActivity(map: ActivityMap, now: Date, amount = 1): ActivityMap {
  const key = dayKey(now);
  return { ...map, [key]: (map[key] || 0) + amount };
}

/** Keeps roughly the last year so storage doesn't grow forever. */
export function pruneActivity(map: ActivityMap, now: Date, keepDays = 400): ActivityMap {
  const cutoff = dayKey(daysAgo(now, keepDays));
  return Object.fromEntries(Object.entries(map).filter(([day]) => day >= cutoff));
}

export interface Streak {
  last?: string;
  count: number;
  best: number;
}

/**
 * Records a visit today. Accepts both this format and the older one, whose dates were
 * written without zero padding (e.g. "2026-10-9").
 */
export function recordVisit(saved: Partial<Streak> | null | undefined, now: Date): Streak {
  const today = dayKey(now);
  const yesterday = dayKey(daysAgo(now, 1));
  const last = normalizeDay(saved?.last);
  const prevCount = typeof saved?.count === "number" && saved.count > 0 ? saved.count : 0;
  const prevBest = typeof saved?.best === "number" ? saved.best : prevCount;

  let count = 1;
  if (last === today) count = prevCount || 1;
  else if (last === yesterday) count = prevCount + 1;
  return { last: today, count, best: Math.max(prevBest, count) };
}

function normalizeDay(day: string | undefined): string | undefined {
  if (!day) return undefined;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(day);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : undefined;
}
