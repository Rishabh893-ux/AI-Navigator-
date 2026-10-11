// Badges and the rules that unlock them. Pure functions, so they're easy to test.

import { PASS_MARK, SKILLS, TIERS, doneCount, type ProgressMap, type Tier } from "./skills";

export interface QuizAttempt {
  skill: string;
  score: number;
  /** ISO timestamp */
  at: string;
}

export interface AchievementContext {
  progress: ProgressMap;
  quizLog: QuizAttempt[];
  streak: number;
  bestStreak: number;
  mentorMessages: number;
  hasPlan: boolean;
}

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: (ctx: AchievementContext) => boolean;
}

const tierComplete = (ctx: AchievementContext, tier: Tier) =>
  doneCount(ctx.progress, tier) === SKILLS.filter((s) => s.tier === tier).length;

/** True if some skill was failed at least once and later passed. */
function hasComeback(log: QuizAttempt[]): boolean {
  const failed = new Set<string>();
  for (const attempt of log) {
    if (attempt.score < PASS_MARK) failed.add(attempt.skill);
    else if (failed.has(attempt.skill)) return true;
  }
  return false;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-quiz",
    emoji: "📝",
    title: "Quiz Rookie",
    description: "Take your first quiz",
    unlocked: (c) => c.quizLog.length > 0,
  },
  {
    id: "first-skill",
    emoji: "👣",
    title: "First Steps",
    description: "Complete your first skill",
    unlocked: (c) => doneCount(c.progress) >= 1,
  },
  {
    id: "perfect",
    emoji: "💯",
    title: "Perfectionist",
    description: "Score 100% on a quiz",
    unlocked: (c) => c.quizLog.some((a) => a.score === 100),
  },
  {
    id: "comeback",
    emoji: "🔁",
    title: "Comeback Kid",
    description: "Pass a quiz you failed before",
    unlocked: (c) => hasComeback(c.quizLog),
  },
  {
    id: "five-skills",
    emoji: "🎯",
    title: "Getting Serious",
    description: "Complete 5 skills",
    unlocked: (c) => doneCount(c.progress) >= 5,
  },
  {
    id: "beginner-done",
    emoji: "🧱",
    title: "Foundations Laid",
    description: "Complete every Beginner skill",
    unlocked: (c) => tierComplete(c, "beginner"),
  },
  {
    id: "intermediate-done",
    emoji: "🌊",
    title: "Deep Diver",
    description: "Complete every Intermediate skill",
    unlocked: (c) => tierComplete(c, "intermediate"),
  },
  {
    id: "advanced-done",
    emoji: "🛰️",
    title: "Frontier Explorer",
    description: "Complete every Advanced skill",
    unlocked: (c) => tierComplete(c, "advanced"),
  },
  {
    id: "all-skills",
    emoji: "🏆",
    title: "AI Navigator",
    description: `Complete all ${SKILLS.length} skills`,
    unlocked: (c) => TIERS.every((t) => tierComplete(c, t)),
  },
  {
    id: "streak-3",
    emoji: "🔥",
    title: "On a Roll",
    description: "Reach a 3-day streak",
    unlocked: (c) => c.bestStreak >= 3,
  },
  {
    id: "streak-7",
    emoji: "⚡",
    title: "Week Warrior",
    description: "Reach a 7-day streak",
    unlocked: (c) => c.bestStreak >= 7,
  },
  {
    id: "streak-30",
    emoji: "🌟",
    title: "Unstoppable",
    description: "Reach a 30-day streak",
    unlocked: (c) => c.bestStreak >= 30,
  },
  {
    id: "mentor-10",
    emoji: "💬",
    title: "Curious Mind",
    description: "Ask the AI Mentor 10 questions",
    unlocked: (c) => c.mentorMessages >= 10,
  },
  {
    id: "planner",
    emoji: "🗓️",
    title: "Planner",
    description: "Save a study plan with the AI Mentor",
    unlocked: (c) => c.hasPlan,
  },
];

export const ACHIEVEMENT_BY_ID: Record<string, Achievement> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Ids of achievements that are earned now but not yet in `unlocked`. */
export function newlyUnlocked(ctx: AchievementContext, unlocked: Record<string, string>): string[] {
  return ACHIEVEMENTS.filter((a) => !unlocked[a.id] && a.unlocked(ctx)).map((a) => a.id);
}
