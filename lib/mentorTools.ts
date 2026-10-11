// Tools the AI Mentor can call. Gemini only *asks* for a tool; the browser runs it
// (all learner data lives there) and sends the result back.

import { LEVELS, TOPICS } from "./content";
import { PAGE_IDS } from "./pages";
import { SKILL_IDS } from "./skills";

const skillId = { type: "string", enum: SKILL_IDS, description: "Id of a skill from the skill tree" };

export const MENTOR_TOOLS = [
  {
    name: "mark_skill_complete",
    description:
      "Mark a skill as completed because the learner says they already know it or have finished it. " +
      "Only call this when the learner clearly asks; never to reward them for a quiz they haven't taken.",
    parameters: { type: "object", properties: { skill_id: skillId }, required: ["skill_id"] },
  },
  {
    name: "start_quiz",
    description: "Open the quiz for a skill so the learner can test themselves (e.g. when they say “quiz me on RAG”).",
    parameters: { type: "object", properties: { skill_id: skillId }, required: ["skill_id"] },
  },
  {
    name: "open_page",
    description:
      "Navigate the app to a page. Optionally highlight a skill (on the skills page) or expand an explainer (on the topics page).",
    parameters: {
      type: "object",
      properties: {
        page: { type: "string", enum: PAGE_IDS },
        skill_id: { ...skillId, description: "Skill to select when page is 'skills'" },
        topic_id: { type: "string", enum: TOPICS.map((t) => t.id), description: "Topic to expand when page is 'topics'" },
      },
      required: ["page"],
    },
  },
  {
    name: "save_study_plan",
    description:
      "Save a week-by-week study plan to the learner's dashboard, replacing any previous plan. " +
      "Use skill ids in the order the learner should study them, respecting prerequisites.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short title, e.g. “4-week path to RAG”" },
        weeks: {
          type: "array",
          description: "1 to 12 weeks",
          items: {
            type: "object",
            properties: {
              week: { type: "integer" },
              focus: { type: "string", description: "One sentence: what to achieve this week" },
              skill_ids: { type: "array", items: skillId },
            },
            required: ["week", "focus", "skill_ids"],
          },
        },
      },
      required: ["title", "weeks"],
    },
  },
  {
    name: "set_level",
    description: "Change the learner's chosen level, which changes their roadmap and recommendations.",
    parameters: {
      type: "object",
      properties: { level: { type: "string", enum: LEVELS.map((l) => l.id) } },
      required: ["level"],
    },
  },
];

export type MentorToolName =
  | "mark_skill_complete"
  | "start_quiz"
  | "open_page"
  | "save_study_plan"
  | "set_level";

export const MENTOR_TOOL_NAMES = MENTOR_TOOLS.map((t) => t.name) as MentorToolName[];
