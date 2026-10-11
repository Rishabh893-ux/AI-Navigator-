// Shared between the browser and the /api/mentor route.

import { LEVELS } from "./content";
import {
  PASS_MARK,
  SKILLS,
  learningPath,
  recommend,
  sanitizeProgress,
  statusOf,
  type ProgressMap,
  type Tier,
} from "./skills";

/** A piece of a Gemini message. thoughtSignature must be sent back unchanged with tool calls. */
export type Part =
  | { text: string; thoughtSignature?: string }
  | { functionCall: { name: string; args?: Record<string, unknown>; id?: string }; thoughtSignature?: string }
  | { functionResponse: { name: string; id?: string; response: Record<string, unknown> } };

export interface Content {
  role: "user" | "model";
  parts: Part[];
}

export interface LearnerProfile {
  level: string;
  progress: ProgressMap;
  streak: number;
  plan?: string | null;
}

export interface MentorRequest {
  contents: Content[];
  profile: LearnerProfile;
}

export type MentorResponse =
  | { parts: Part[] }
  | { error: { code: number; message: string; reason?: "no_key" | "rate_limited" | "timeout" } };

/** Max conversation entries sent to Gemini */
export const MAX_CONTENTS = 40;
export const MAX_TEXT_CHARS = 8000;
/** Max tool-call round trips for one user message */
export const MAX_TOOL_ROUNDS = 4;

const STATUS_LABEL = {
  mastered: "mastered",
  known: "completed (marked as known, no quiz yet)",
  "in-progress": "attempted",
  available: "unlocked, not started",
  locked: "locked",
} as const;

const MENTOR_SYSTEM = `You are the AI Mentor inside "AI Navigator", a platform helping students learn AI.
Keep answers concise (2-4 sentences per point), friendly and encouraging.
Suggest specific FREE resources (Kaggle, Fast.ai, Coursera free tier, YouTube, Hugging Face) when helpful.
Use simple language — explain any jargon you use. Give actionable next steps.
Write maths in plain text (e.g. "R squared", "x^2") — the chat cannot display LaTeX.

You can act inside the app with tools:
- mark_skill_complete, start_quiz, open_page, save_study_plan, set_level.
Use a tool whenever the learner asks you to do something in the app (e.g. "mark Python as done", "quiz me on RAG",
"make me a 3-week plan", "take me to my stats"). Never claim you did something without calling the tool.
Only use skill ids from the skill list below, and only inside tool calls — when talking to the learner,
use the skill's title (e.g. "NumPy & Pandas", not "numpy-pandas"). Skills are mastered by passing their quiz (${PASS_MARK}%+);
encourage quizzes rather than marking skills complete, unless the learner says they already know the material.
After a tool runs, briefly confirm what happened and suggest a next step.`;

/** Builds the system prompt from trusted skill data plus the learner's (validated) progress. */
export function buildSystemPrompt(profile: LearnerProfile): string {
  const level = (LEVELS.find((l) => l.id === profile.level)?.id ?? "beginner") as Tier;
  const progress = sanitizeProgress(profile.progress);
  const lines = SKILLS.map((s) => {
    const status = statusOf(progress, s.id);
    const best = progress[s.id]?.best;
    const score = best !== null && best !== undefined ? `, best quiz ${best}%` : "";
    const prereqs = s.prereqs.length ? `, needs ${s.prereqs.join(" + ")}` : "";
    return `- ${s.id}: ${s.title} [${s.tier}] — ${STATUS_LABEL[status]}${score}${prereqs}`;
  });
  const next = recommend(progress, level);
  const path = learningPath(progress, level, 4).map((s) => s.id);
  const weak = SKILLS.filter((s) => {
    const p = progress[s.id];
    return p && p.best !== null && p.best < PASS_MARK;
  }).map((s) => s.id);

  return [
    MENTOR_SYSTEM,
    `\nLearner profile:\n- Chosen level: ${level}\n- Daily streak: ${Math.max(0, Math.floor(profile.streak || 0))} day(s)`,
    `- Recommended next skill: ${next ? `${next.skill.id} (${next.reason})` : "none — every unlocked skill is done"}`,
    `- Suggested path: ${path.join(" → ") || "complete"}`,
    `- Weak spots (failed quizzes): ${weak.join(", ") || "none"}`,
    `- Saved study plan: ${profile.plan ? String(profile.plan).slice(0, 100) : "none"}`,
    `\nSkill tree:\n${lines.join("\n")}`,
  ].join("\n");
}

/** A tool's result, shown as a card in the chat and sent back to Gemini. */
export interface ToolOutcome {
  ok: boolean;
  /** Told to the model */
  message: string;
  /** Shown to the learner */
  icon: string;
  label: string;
  /** For mark_skill_complete: what to restore on Undo */
  undo?: { skillId: string; previous?: import("./skills").SkillProgress };
}

/**
 * Keeps the conversation under MAX_CONTENTS by dropping the oldest turns. The result always
 * starts with a plain user message, so a tool call is never separated from its result.
 */
export function trimHistory(contents: Content[], max = MAX_CONTENTS): Content[] {
  if (contents.length <= max) return contents;
  let start = contents.length - max;
  while (start < contents.length) {
    const c = contents[start];
    if (c.role === "user" && c.parts.some((p) => "text" in p)) break;
    start++;
  }
  return contents.slice(start);
}
