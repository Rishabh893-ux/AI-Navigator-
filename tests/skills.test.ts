import { describe, expect, it } from "vitest";
import {
  PASS_MARK,
  SKILLS,
  SKILL_BY_ID,
  applyQuizResult,
  isUnlocked,
  learningPath,
  markKnown,
  migrateLegacyChecklist,
  recommend,
  resetSkill,
  sanitizeProgress,
  statusOf,
  type ProgressMap,
} from "@/lib/skills";

const now = new Date("2026-10-11T10:00:00Z");

describe("skill catalogue", () => {
  it("has unique ids, valid prerequisites and no cycles", () => {
    const ids = SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SKILLS) {
      for (const p of s.prereqs) {
        expect(SKILL_BY_ID[p], `${s.id} → ${p}`).toBeDefined();
        // a prerequisite always sits on an earlier row, so the tree can't loop
        expect(SKILL_BY_ID[p].row).toBeLessThan(s.row);
      }
    }
  });

  it("has a well-formed quiz for every skill", () => {
    for (const s of SKILLS) {
      expect(s.quiz.length, s.id).toBeGreaterThanOrEqual(4);
      for (const q of s.quiz) {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(new Set(q.options).size, `duplicate options in ${s.id}`).toBe(q.options.length);
        expect(q.explain.length).toBeGreaterThan(0);
      }
    }
  });

  it("fits at most 3 skills per row", () => {
    const perRow = new Map<number, number>();
    SKILLS.forEach((s) => perRow.set(s.row, (perRow.get(s.row) || 0) + 1));
    expect(Math.max(...perRow.values())).toBeLessThanOrEqual(3);
  });
});

describe("progress", () => {
  it("locks skills until every prerequisite is done", () => {
    let map: ProgressMap = {};
    expect(isUnlocked(map, "ai-basics")).toBe(true);
    expect(statusOf(map, "ml-basics")).toBe("locked");
    map = markKnown(map, "math", now);
    expect(isUnlocked(map, "ml-basics")).toBe(false); // still needs numpy-pandas
    map = markKnown(map, "numpy-pandas", now);
    expect(statusOf(map, "ml-basics")).toBe("available");
  });

  it("masters a skill only at the pass mark, keeping the best score", () => {
    let map = applyQuizResult({}, "python", PASS_MARK - 5, now);
    expect(statusOf(map, "python")).toBe("in-progress");
    expect(map.python).toMatchObject({ attempts: 1, best: PASS_MARK - 5, done: false });
    map = applyQuizResult(map, "python", 100, now);
    expect(statusOf(map, "python")).toBe("mastered");
    map = applyQuizResult(map, "python", 25, now);
    expect(map.python).toMatchObject({ attempts: 3, best: 100, done: true });
  });

  it("turns a 'known' skill into 'mastered' when its quiz is passed", () => {
    let map = markKnown({}, "python", now);
    expect(statusOf(map, "python")).toBe("known");
    map = applyQuizResult(map, "python", PASS_MARK, now);
    expect(statusOf(map, "python")).toBe("mastered");
    expect(map.python.manual).toBe(false);
  });

  it("resets a skill", () => {
    const map = resetSkill(markKnown({}, "python", now), "python");
    expect(statusOf(map, "python")).toBe("available");
  });
});

describe("adaptive path", () => {
  it("starts beginners with a skill that has no prerequisites", () => {
    const rec = recommend({}, "beginner");
    expect(rec?.skill.prereqs).toEqual([]);
  });

  it("prioritises retrying a failed quiz", () => {
    const map = applyQuizResult(markKnown({}, "ai-basics", now), "python", 25, now);
    const rec = recommend(map, "beginner");
    expect(rec?.skill.id).toBe("python");
    expect(rec?.reason).toContain("25%");
  });

  it("only recommends unlocked, unfinished skills — in a valid order", () => {
    const path = learningPath({}, "beginner", SKILLS.length);
    expect(path).toHaveLength(SKILLS.length);
    const seen = new Set<string>();
    for (const s of path) {
      for (const p of s.prereqs) expect(seen.has(p), `${s.id} before ${p}`).toBe(true);
      seen.add(s.id);
    }
  });

  it("prefers the chosen level once its skills are unlocked", () => {
    const map = SKILLS.filter((s) => s.tier === "beginner").reduce((m, s) => markKnown(m, s.id, now), {} as ProgressMap);
    expect(recommend(map, "advanced")?.skill.tier).toBe("intermediate"); // advanced is still locked
    expect(recommend(map, "intermediate")?.skill.id).toBe("neural-nets");
  });

  it("returns null when everything is done", () => {
    const all = SKILLS.reduce((m, s) => markKnown(m, s.id, now), {} as ProgressMap);
    expect(recommend(all, "beginner")).toBeNull();
  });
});

describe("storage safety", () => {
  it("migrates the old 10-item checklist", () => {
    const map = migrateLegacyChecklist([true, false, true], now);
    expect(Object.keys(map).sort()).toEqual(["ai-basics", "ml-basics"]);
    expect(map["ai-basics"]).toMatchObject({ done: true, manual: true });
    expect(migrateLegacyChecklist("nonsense", now)).toEqual({});
  });

  it("drops unknown skills and invalid values", () => {
    const map = sanitizeProgress({
      python: { done: true, best: 140, attempts: -2 },
      hacker: { done: true },
      math: "yes",
    });
    expect(Object.keys(map)).toEqual(["python"]);
    expect(map.python).toEqual({ done: true, manual: false, best: null, attempts: 0 });
  });
});
