import { describe, expect, it } from "vitest";
import { newlyUnlocked, type AchievementContext } from "@/lib/achievements";
import { addActivity, dayKey, pruneActivity, recordVisit } from "@/lib/activity";
import { SKILLS, markKnown, type ProgressMap } from "@/lib/skills";

const base: AchievementContext = { progress: {}, quizLog: [], streak: 1, bestStreak: 1, mentorMessages: 0, hasPlan: false };
const at = "2026-10-11T10:00:00Z";

describe("achievements", () => {
  it("awards nothing to a brand-new learner", () => {
    expect(newlyUnlocked(base, {})).toEqual([]);
  });

  it("awards quiz badges", () => {
    const ctx = { ...base, quizLog: [{ skill: "python", score: 100, at }] };
    expect(newlyUnlocked(ctx, {})).toEqual(expect.arrayContaining(["first-quiz", "perfect"]));
    expect(newlyUnlocked(ctx, {})).not.toContain("comeback");
  });

  it("awards Comeback Kid only for passing a previously failed skill", () => {
    const failThenPass = [
      { skill: "python", score: 50, at },
      { skill: "math", score: 100, at },
      { skill: "python", score: 100, at },
    ];
    expect(newlyUnlocked({ ...base, quizLog: failThenPass }, {})).toContain("comeback");
    const otherSkill = failThenPass.slice(0, 2);
    expect(newlyUnlocked({ ...base, quizLog: otherSkill }, {})).not.toContain("comeback");
  });

  it("awards tier and completion badges", () => {
    const now = new Date(at);
    const beginner = SKILLS.filter((s) => s.tier === "beginner").reduce((m, s) => markKnown(m, s.id, now), {} as ProgressMap);
    const ids = newlyUnlocked({ ...base, progress: beginner }, {});
    expect(ids).toEqual(expect.arrayContaining(["first-skill", "five-skills", "beginner-done"]));
    expect(ids).not.toContain("all-skills");
    const all = SKILLS.reduce((m, s) => markKnown(m, s.id, now), {} as ProgressMap);
    expect(newlyUnlocked({ ...base, progress: all }, {})).toContain("all-skills");
  });

  it("doesn't re-award badges already earned", () => {
    const ctx = { ...base, bestStreak: 7, mentorMessages: 10, hasPlan: true };
    const ids = newlyUnlocked(ctx, {});
    expect(ids).toEqual(expect.arrayContaining(["streak-3", "streak-7", "mentor-10", "planner"]));
    const earned = Object.fromEntries(ids.map((id) => [id, at]));
    expect(newlyUnlocked(ctx, earned)).toEqual([]);
  });
});

describe("streaks and activity", () => {
  const day = (s: string) => new Date(`${s}T12:00:00`);

  it("counts consecutive days and remembers the best streak", () => {
    let s = recordVisit(null, day("2026-10-01"));
    expect(s).toEqual({ last: "2026-10-01", count: 1, best: 1 });
    s = recordVisit(s, day("2026-10-02"));
    s = recordVisit(s, day("2026-10-02")); // same day again
    s = recordVisit(s, day("2026-10-03"));
    expect(s).toMatchObject({ count: 3, best: 3 });
    s = recordVisit(s, day("2026-10-06")); // missed days
    expect(s).toMatchObject({ count: 1, best: 3 });
  });

  it("continues a streak saved in the old unpadded date format", () => {
    expect(recordVisit({ last: "2026-10-9", count: 4 }, day("2026-10-10"))).toMatchObject({ count: 5, best: 5 });
  });

  it("handles month boundaries", () => {
    expect(recordVisit({ last: "2026-09-30", count: 2, best: 2 }, day("2026-10-01")).count).toBe(3);
  });

  it("adds and prunes activity", () => {
    let a = addActivity({}, day("2026-10-11"));
    a = addActivity(a, day("2026-10-11"), 2);
    expect(a[dayKey(day("2026-10-11"))]).toBe(3);
    a = { ...a, "2024-01-01": 5 };
    expect(pruneActivity(a, day("2026-10-11"))).not.toHaveProperty("2024-01-01");
  });
});
