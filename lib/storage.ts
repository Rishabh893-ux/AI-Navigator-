// Safe wrappers around localStorage: it can throw in private windows or when blocked.
// The keys match the original single-file app, so existing progress carries over.

export const KEYS = {
  progress: "ain_progress",
  streak: "ain_streak",
  level: "ain_level",
  theme: "ain_theme",
  chat: "ain_chat",
  apiKey: "ain_gemini_key",
  updatesSeen: "ain_updates_seen",
  skills: "ain_skills",
  quizLog: "ain_quiz_log",
  activity: "ain_activity",
  counters: "ain_counters",
  plan: "ain_plan",
  achievements: "ain_achievements",
} as const;

export function readString(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — the app still works, it just won't remember.
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = readString(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  writeString(key, JSON.stringify(value));
}
