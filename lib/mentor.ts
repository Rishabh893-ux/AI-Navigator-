// Shared between the browser and the /api/mentor route.

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface LearnerProfile {
  level: string;
  done: string[];
  todo: string[];
}

export interface MentorRequest {
  messages: ChatMessage[];
  profile: LearnerProfile;
}

export type MentorResponse =
  | { reply: string }
  | { error: { code: number; message: string; reason?: "no_key" | "rate_limited" | "timeout" } };

export const MAX_MESSAGES = 40;
export const MAX_MESSAGE_CHARS = 4000;

const MENTOR_SYSTEM = `You are an AI Mentor inside "AI Navigator", a platform helping students learn AI.
Keep answers concise (2-4 sentences per point), friendly and encouraging.
Suggest specific FREE resources (Kaggle, Fast.ai, Coursera free tier, YouTube, HuggingFace) when helpful.
Use simple language — explain any jargon you use. Give actionable next steps.`;

/** Builds the system prompt, including the learner's level and progress so advice is personal. */
export function buildSystemPrompt(profile: LearnerProfile): string {
  return (
    MENTOR_SYSTEM +
    `\n\nLearner profile: chosen level is ${profile.level}.` +
    `\nCompleted topics: ${profile.done.join("; ") || "none yet"}.` +
    `\nNot yet completed: ${profile.todo.join("; ") || "none"}.` +
    "\nUse this to personalise advice, e.g. suggest the next uncompleted topic."
  );
}
