import { connection, type NextRequest } from "next/server";
import {
  buildSystemPrompt,
  MAX_MESSAGE_CHARS,
  MAX_MESSAGES,
  type ChatMessage,
  type LearnerProfile,
  type MentorResponse,
} from "@/lib/mentor";

// Server-side proxy to Google Gemini.
// - If GEMINI_API_KEY is set, the key stays on the server and visitors don't need one.
// - Otherwise the visitor's own key (saved in their browser) is forwarded for that request only.

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const UPSTREAM_TIMEOUT_MS = 55_000;

// Simple per-visitor limit for the shared server key. It lives in memory, so it resets when the
// server restarts and isn't shared across serverless instances — good enough to stop casual abuse.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT;
}

function originHost(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null; // e.g. the literal "null" origin
  }
}

function errorResponse(code: number, message: string, reason?: "no_key" | "rate_limited" | "timeout") {
  const body: MentorResponse = { error: { code, message, reason } };
  return Response.json(body, { status: code });
}

function cleanMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  const messages = input
    .filter(
      (m): m is ChatMessage =>
        !!m && (m.role === "user" || m.role === "model") && typeof m.text === "string" && m.text.trim() !== "",
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_MESSAGE_CHARS) }));
  // Gemini expects the conversation to start with the user
  while (messages.length && messages[0].role !== "user") messages.shift();
  return messages;
}

function cleanList(input: unknown): string[] {
  return Array.isArray(input)
    ? input.filter((s): s is string => typeof s === "string").slice(0, 20).map((s) => s.slice(0, 120))
    : [];
}

function cleanProfile(input: unknown): LearnerProfile {
  const p = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const level = typeof p.level === "string" ? p.level.slice(0, 20) : "beginner";
  return { level, done: cleanList(p.done), todo: cleanList(p.todo) };
}

/** Tells the page whether the server has its own key, so it can hide the "paste your key" box. */
export async function GET() {
  await connection(); // read the environment at request time, not build time
  return Response.json({ serverKey: Boolean(process.env.GEMINI_API_KEY) });
}

export async function POST(request: NextRequest) {
  const serverKey = process.env.GEMINI_API_KEY;
  const apiKey = serverKey || request.headers.get("x-user-gemini-key")?.trim();
  if (!apiKey) {
    return errorResponse(401, "No Gemini API key is set.", "no_key");
  }

  if (serverKey) {
    // Only this site's pages may spend the shared key from a browser
    const origin = request.headers.get("origin");
    if (origin && originHost(origin) !== request.headers.get("host")) {
      return errorResponse(403, "Requests from other websites are not allowed.");
    }
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    if (rateLimited(ip)) {
      return errorResponse(429, "Too many messages. Please wait a few minutes and try again.", "rate_limited");
    }
  }

  let payload: { messages?: unknown; profile?: unknown };
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "The request was not valid JSON.");
  }

  const messages = cleanMessages(payload.messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return errorResponse(400, "Send at least one message.");
  }

  let upstream: Response;
  try {
    upstream = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt(cleanProfile(payload.profile)) }] },
        contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError")) {
      return errorResponse(504, "Gemini took too long to answer. Please try again.", "timeout");
    }
    return errorResponse(502, "Could not reach Gemini. Please try again.");
  }

  const data = await upstream.json().catch(() => null);
  if (!upstream.ok || !data || data.error) {
    const code = data?.error?.code || upstream.status || 502;
    return errorResponse(code, data?.error?.message || "Gemini returned an error.");
  }

  const parts: { text?: string; thought?: boolean }[] = data.candidates?.[0]?.content?.parts || [];
  const reply = parts
    .filter((p) => p.text && !p.thought)
    .map((p) => p.text)
    .join("");
  if (!reply) {
    return errorResponse(502, "Sorry, no response received. Please try again.");
  }

  const body: MentorResponse = { reply };
  return Response.json(body);
}
