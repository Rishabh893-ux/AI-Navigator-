// A study plan saved by the AI Mentor's save_study_plan tool.

import { SKILL_BY_ID } from "./skills";

export interface StudyPlan {
  title: string;
  createdAt: string;
  weeks: { week: number; focus: string; skillIds: string[] }[];
}

/** Validates plan data coming from the AI (or from storage). Returns null if nothing usable is left. */
export function sanitizePlan(input: unknown, now = new Date()): StudyPlan | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const rawWeeks = Array.isArray(raw.weeks) ? raw.weeks.slice(0, 12) : [];
  const weeks = rawWeeks.flatMap((w) => {
    if (!w || typeof w !== "object") return [];
    const wk = w as Record<string, unknown>;
    const ids = Array.isArray(wk.skill_ids) ? wk.skill_ids : Array.isArray(wk.skillIds) ? wk.skillIds : [];
    const skillIds = [...new Set(ids.filter((id): id is string => typeof id === "string" && !!SKILL_BY_ID[id]))];
    const focus = typeof wk.focus === "string" ? wk.focus.trim().slice(0, 200) : "";
    if (!focus && !skillIds.length) return [];
    return [{ focus, skillIds }];
  }).map((w, i) => ({ week: i + 1, ...w })); // number after dropping empty weeks, so there are no gaps
  if (!weeks.length) return null;
  const title = typeof raw.title === "string" && raw.title.trim() ? raw.title.trim().slice(0, 80) : "My study plan";
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : now.toISOString();
  return { title, createdAt, weeks };
}
