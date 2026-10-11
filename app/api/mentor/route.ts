import { connection, type NextRequest } from "next/server";
import {
  buildSystemPrompt,
  MAX_CONTENTS,
  MAX_TEXT_CHARS,
  type Content,
  type LearnerProfile,
  type MentorResponse,
  type Part,
} from "@/lib/mentor";
import { MENTOR_TOOL_NAMES, MENTOR_TOOLS } from "@/lib/mentorTools";

// Server-side proxy to Google Gemini, with tool calling for the agent mentor.
// - If GEMINI_API_KEY is set, the key stays on the server and visitors don't need one.
// - Otherwise the visitor's own key (saved in their browser) is forwarded for that request only.
// The browser runs the tools (learner data lives there) and sends the results back in `contents`.

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const UPSTREAM_TIMEOUT_MS = 55_000;

// Let hosts such as Vercel run this route long enough for a slow Gemini reply (55s timeout + margin)
export const maxDuration = 60;

// Simple per-visitor limit for the shared server key. Each tool round trip counts as a request.
// It lives in memory, so it resets when the server restarts and isn't shared across serverless
// instances — good enough to stop casual abuse.
const RATE_LIMIT = 40;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

const MAX_PARTS = 10;
const MAX_JSON_CHARS = 6000;
const MAX_SIGNATURE_CHARS = 40_000;
const TOOL_NAMES = new Set<string>(MENTOR_TOOL_NAMES);

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

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const smallJson = (v: unknown) => JSON.stringify(v ?? {}).length <= MAX_JSON_CHARS;
const signature = (v: unknown) =>
  typeof v === "string" && v.length <= MAX_SIGNATURE_CHARS ? { thoughtSignature: v } : {};

/** Keeps only the part shapes the mentor uses, with size limits. Returns null for anything else. */
function cleanPart(raw: unknown, role: Content["role"]): Part | null {
  if (!isObject(raw)) return null;
  if (typeof raw.text === "string" && raw.text.trim()) {
    return { text: raw.text.slice(0, MAX_TEXT_CHARS), ...(role === "model" ? signature(raw.thoughtSignature) : {}) };
  }
  if (role === "model" && isObject(raw.functionCall)) {
    const call = raw.functionCall;
    if (typeof call.name !== "string" || !TOOL_NAMES.has(call.name)) return null;
    const args = isObject(call.args) && smallJson(call.args) ? call.args : {};
    const id = typeof call.id === "string" ? { id: call.id.slice(0, 100) } : {};
    return { functionCall: { name: call.name, args, ...id }, ...signature(raw.thoughtSignature) };
  }
  if (role === "user" && isObject(raw.functionResponse)) {
    const res = raw.functionResponse;
    if (typeof res.name !== "string" || !TOOL_NAMES.has(res.name)) return null;
    if (!isObject(res.response) || !smallJson(res.response)) return null;
    const id = typeof res.id === "string" ? { id: res.id.slice(0, 100) } : {};
    return { functionResponse: { name: res.name, ...id, response: res.response } };
  }
  return null;
}

function cleanContents(input: unknown): Content[] {
  if (!Array.isArray(input)) return [];
  const contents: Content[] = [];
  for (const item of input.slice(-MAX_CONTENTS)) {
    if (!isObject(item) || (item.role !== "user" && item.role !== "model") || !Array.isArray(item.parts)) continue;
    const role = item.role;
    const parts = item.parts
      .slice(0, MAX_PARTS)
      .map((p) => cleanPart(p, role))
      .filter((p): p is Part => p !== null);
    if (parts.length) contents.push({ role, parts });
  }
  // Gemini expects the conversation to start with a plain user message
  while (contents.length && !(contents[0].role === "user" && contents[0].parts.some((p) => "text" in p))) {
    contents.shift();
  }
  return contents;
}

function cleanProfile(input: unknown): LearnerProfile {
  const p = isObject(input) ? input : {};
  return {
    level: typeof p.level === "string" ? p.level.slice(0, 20) : "beginner",
    progress: isObject(p.progress) && smallJson(p.progress) ? (p.progress as LearnerProfile["progress"]) : {},
    streak: typeof p.streak === "number" ? p.streak : 0,
    plan: typeof p.plan === "string" ? p.plan.slice(0, 120) : null,
  };
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

  let payload: { contents?: unknown; profile?: unknown };
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "The request was not valid JSON.");
  }

  const contents = cleanContents(payload.contents);
  if (!contents.length || contents[contents.length - 1].role !== "user") {
    return errorResponse(400, "Send at least one message.");
  }

  let upstream: Response;
  try {
    upstream = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt(cleanProfile(payload.profile)) }] },
        contents,
        tools: [{ functionDeclarations: MENTOR_TOOLS }],
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

  // Return the model's turn as-is (minus hidden "thought" text), so its thought signatures
  // can be sent back with the tool results — Gemini rejects tool results without them.
  const rawParts: unknown[] = data.candidates?.[0]?.content?.parts || [];
  const parts = rawParts
    .filter((p) => !(isObject(p) && p.thought === true))
    .map((p) => cleanPart(p, "model"))
    .filter((p): p is Part => p !== null);
  if (!parts.length) {
    return errorResponse(502, "Sorry, no response received. Please try again.");
  }

  const body: MentorResponse = { parts };
  return Response.json(body);
}
