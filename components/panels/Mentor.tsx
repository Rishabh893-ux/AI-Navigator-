"use client";

import { useEffect, useRef, useState } from "react";
import { formatReply } from "@/lib/formatReply";
import {
  MAX_TOOL_ROUNDS,
  trimHistory,
  type Content,
  type LearnerProfile,
  type MentorResponse,
  type Part,
  type ToolOutcome,
} from "@/lib/mentor";
import { KEYS, readJson, readString, writeJson, writeString } from "@/lib/storage";

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_DISPLAY = 80;

/** What the chat shows. The conversation sent to Gemini is kept separately (`history`). */
type DisplayItem =
  | { kind: "user"; text: string }
  | { kind: "model"; text: string }
  | { kind: "error"; text: string }
  | { kind: "action"; icon: string; label: string; ok: boolean; undo?: ToolOutcome["undo"]; undone?: boolean };

interface SavedChat {
  v: 2;
  history: Content[];
  display: DisplayItem[];
}

type Pending = null | { note?: string };

const SUGGESTIONS = [
  "What should I learn next?",
  "Quiz me on my next skill",
  "Make me a 3-week study plan",
  "I already know Python — mark it done",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Loads saved chat, upgrading the older text-only format ([{ role, text }] or [{ role, parts }]). */
function loadChat(): SavedChat {
  const raw = readJson<unknown>(KEYS.chat, null);
  if (raw && typeof raw === "object" && !Array.isArray(raw) && (raw as SavedChat).v === 2) {
    const saved = raw as SavedChat;
    return {
      v: 2,
      history: Array.isArray(saved.history) ? saved.history : [],
      display: Array.isArray(saved.display) ? saved.display : [],
    };
  }
  const chat: SavedChat = { v: 2, history: [], display: [] };
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const m = item as { role?: string; text?: string; parts?: { text?: string }[] };
      const text = m.text ?? m.parts?.[0]?.text ?? "";
      if ((m.role !== "user" && m.role !== "model") || !text) continue;
      chat.history.push({ role: m.role, parts: [{ text }] });
      chat.display.push({ kind: m.role, text });
    }
  }
  return chat;
}

async function askMentor(contents: Content[], profile: LearnerProfile, userKey: string | null) {
  const res = await fetch("/api/mentor", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(userKey ? { "x-user-gemini-key": userKey } : {}) },
    body: JSON.stringify({ contents, profile }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return (await res.json()) as MentorResponse;
}

interface Props {
  profile: LearnerProfile;
  runTool: (name: string, args: Record<string, unknown>) => ToolOutcome;
  onUndo: (undo: NonNullable<ToolOutcome["undo"]>) => void;
  onMessageSent: () => void;
  /** Text to put in the message box (e.g. from the dashboard's "Ask the mentor for a plan") */
  draft: { text: string; n: number } | null;
}

export default function Mentor({ profile, runTool, onUndo, onMessageSent, draft }: Props) {
  const [history, setHistory] = useState<Content[]>([]);
  const [display, setDisplay] = useState<DisplayItem[]>([]);
  const [pending, setPending] = useState<Pending>(null);
  const [input, setInput] = useState("");
  const [serverKey, setServerKey] = useState<boolean | null>(null);
  const [userKey, setUserKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // The latest learner profile, so each tool round sends progress the previous round changed
  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  });

  useEffect(() => {
    const saved = loadChat();
    /* eslint-disable react-hooks/set-state-in-effect -- syncing from localStorage, which only exists in the browser */
    setHistory(saved.history);
    setDisplay(saved.display);
    setUserKey(readString(KEYS.apiKey));
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch("/api/mentor")
      .then((r) => r.json())
      .then((d: { serverKey?: boolean }) => setServerKey(Boolean(d.serverKey)))
      .catch(() => setServerKey(false));
  }, []);

  // A draft from elsewhere in the app fills the message box
  useEffect(() => {
    if (!draft) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a one-off request from another tab
    setInput(draft.text);
    inputRef.current?.focus();
  }, [draft]);

  // Keep the newest message in view
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [display, pending]);

  const busy = pending !== null;
  const needsKey = serverKey === false && !userKey;

  function save(nextHistory: Content[], nextDisplay: DisplayItem[]) {
    const h = trimHistory(nextHistory);
    const d = nextDisplay.slice(-MAX_DISPLAY);
    setHistory(h);
    setDisplay(d);
    writeJson(KEYS.chat, { v: 2, history: h, display: d } satisfies SavedChat);
  }

  /** One request to Gemini, retrying when it's busy. Throws on network errors and timeouts. */
  async function requestWithRetry(contents: Content[]): Promise<MentorResponse> {
    for (let attempt = 0; ; attempt++) {
      const result = await askMentor(contents, profileRef.current, serverKey ? null : userKey);
      const err = "error" in result ? result.error : null;
      // 429 can mean "slow down" (worth a retry) or "quota used up" (retrying won't help)
      const quota = err && /quota/i.test(err.message);
      const retryable = err && !quota && (err.code === 503 || (err.code === 429 && err.reason !== "rate_limited"));
      if (!retryable || attempt >= MAX_RETRIES) return result;
      const wait = 2000 * 2 ** attempt;
      setPending({ note: `Gemini is busy — retrying in ${wait / 1000}s (attempt ${attempt + 1} of ${MAX_RETRIES})…` });
      await sleep(wait);
      setPending({});
    }
  }

  async function send(raw?: string) {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    setInput("");
    let shown: DisplayItem[] = [...display, { kind: "user", text }];
    setDisplay(shown);

    if (needsKey) {
      shown = [
        ...shown,
        {
          kind: "error",
          text: "⚠️ **API key not set.** Please read the yellow box below — it takes about 2 minutes to get a free key from Google AI Studio and paste it in.",
        },
      ];
      save(history, shown);
      return;
    }

    onMessageSent();
    setPending({});
    let contents: Content[] = [...history, { role: "user", parts: [{ text }] }];
    let failure: string | null = null;

    try {
      for (let round = 0; ; round++) {
        const result = await requestWithRetry(contents);
        if ("error" in result) {
          const { code, message, reason } = result.error;
          const hint =
            reason === "no_key"
              ? ""
              : /quota/i.test(message)
                ? " — the free Gemini quota for this key is used up. Try again later, or use another key."
                : code === 503 || code === 429
                ? " — please try again in a minute."
                : code >= 400 && code < 500 && !reason
                  ? " — check your API key."
                  : "";
          failure = `⚠️ ${message}${hint}`;
          break;
        }

        const parts = result.parts;
        contents = [...contents, { role: "model", parts }];
        const reply = parts
          .filter((p): p is Extract<Part, { text: string }> => "text" in p)
          .map((p) => p.text)
          .join("");
        if (reply) shown = [...shown, { kind: "model", text: reply }];

        const calls = parts.filter((p): p is Extract<Part, { functionCall: unknown }> => "functionCall" in p);
        if (!calls.length) break;

        // Run each requested tool here in the browser, show it, and send the results back
        const responses: Part[] = [];
        for (const { functionCall } of calls) {
          const outcome = runTool(functionCall.name, functionCall.args ?? {});
          shown = [...shown, { kind: "action", icon: outcome.icon, label: outcome.label, ok: outcome.ok, undo: outcome.undo }];
          responses.push({
            functionResponse: {
              name: functionCall.name,
              ...(functionCall.id ? { id: functionCall.id } : {}),
              response: { ok: outcome.ok, result: outcome.message },
            },
          });
        }
        setDisplay(shown);
        contents = [...contents, { role: "user", parts: responses }];

        if (round + 1 >= MAX_TOOL_ROUNDS) {
          // The actions above already happened; just don't keep a half-finished exchange for Gemini
          failure = "I stopped after several steps — tell me if you'd like me to continue.";
          break;
        }
      }
    } catch (err) {
      const timedOut = err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError");
      failure = timedOut
        ? "Gemini took too long to answer (over 60s). Please try again."
        : "Network error. Please check your internet connection and try again.";
    }

    setPending(null);
    if (failure) {
      // Keep what happened on screen, but don't send a broken exchange back to Gemini next time
      save(history, [...shown, { kind: "error", text: failure }]);
    } else {
      save(contents, shown);
    }
  }

  function undo(index: number) {
    const item = display[index];
    if (item?.kind !== "action" || !item.undo || item.undone) return;
    onUndo(item.undo);
    save(
      history,
      display.map((d, i) => (i === index ? { ...item, undone: true } : d)),
    );
  }

  function clearChat() {
    save([], []);
  }

  function saveKey() {
    const key = keyInput.trim() || null;
    writeString(KEYS.apiKey, key);
    setUserKey(key);
    setKeyInput("");
  }

  return (
    <div className="panel">
      <div>
        <h1 className="sec-head">AI mentor</h1>
        <div className="sec-sub">
          Ask anything — or ask it to <strong>do</strong> things: quiz you, plan your weeks, mark skills done, open pages.
          Powered by Google Gemini.
        </div>
      </div>
      <div className="card mentor-card">
        <div className="chat-tools">
          <button className="link-btn" onClick={clearChat} disabled={busy}>
            Clear chat
          </button>
        </div>
        <div className="chat-wrap" ref={chatRef} aria-live="polite">
          <div className="msg">
            <div className="msg-av ai">AI</div>
            <div className="msg-bub">
              Hi! I&apos;m your AI Mentor. I can see your skill tree, so I know what you&apos;ve finished and what&apos;s
              next. I can explain anything, quiz you, build a study plan and update your progress — just ask.
            </div>
          </div>
          {display.map((item, i) => {
            if (item.kind === "action") {
              return (
                <div key={i} className={`action-card${item.ok ? "" : " failed"}${item.undone ? " undone" : ""}`}>
                  <span aria-hidden="true">{item.icon}</span>
                  <span className="action-text">
                    {item.label}
                    {item.undone && " — undone"}
                  </span>
                  {item.undo && !item.undone && (
                    <button className="link-btn" onClick={() => undo(i)}>
                      Undo
                    </button>
                  )}
                </div>
              );
            }
            const user = item.kind === "user";
            return (
              <div key={i} className={user ? "msg user-msg" : "msg"}>
                <div className={user ? "msg-av usr" : "msg-av ai"}>{user ? "U" : "AI"}</div>
                {user ? (
                  <div className="msg-bub">{item.text}</div>
                ) : (
                  <div
                    className={`msg-bub${item.kind === "error" ? " err" : ""}`}
                    dangerouslySetInnerHTML={{ __html: formatReply(item.text) }}
                  />
                )}
              </div>
            );
          })}
          {pending && (
            <div className="msg">
              <div className="msg-av ai">AI</div>
              <div className="msg-bub">
                <div className="typing" aria-label="Mentor is working">
                  <div className="t-dot" />
                  <div className="t-dot" />
                  <div className="t-dot" />
                </div>
                {pending.note && <div className="card-sub">{pending.note}</div>}
              </div>
            </div>
          )}
        </div>
        {!busy && (
          <div className="suggestions" aria-label="Suggested requests">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          className="chat-row"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            ref={inputRef}
            type="text"
            aria-label="Message the AI mentor"
            placeholder="Ask, or tell the mentor what to do…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" disabled={busy}>
            Send ↗
          </button>
        </form>
      </div>

      {serverKey === true ? (
        <div className="api-banner ok">
          <div className="api-banner-title">✅ AI Mentor is ready</div>
          <div className="api-banner-body">This site has its own Gemini key, so you don&apos;t need one. Just start chatting.</div>
        </div>
      ) : serverKey === false ? (
        <div className="api-banner">
          <div className="api-banner-title">⚙️ Activate AI Mentor — enter your API key</div>
          <div className="api-banner-body">
            1. Go to{" "}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
              aistudio.google.com/app/apikey
            </a>{" "}
            → sign in → click <strong>&quot;Create API key&quot;</strong>
            <br />
            2. Copy the key
            <br />
            3. Paste it below and click <strong>Save key</strong> — it is stored only in this browser and sent only
            with your own messages
          </div>
          <form
            className="chat-row"
            style={{ marginTop: 10 }}
            onSubmit={(e) => {
              e.preventDefault();
              saveKey();
            }}
          >
            {/* The username field lets password managers handle the key properly */}
            <input type="text" name="username" autoComplete="username" value="gemini-api-key" readOnly hidden />
            <input
              type="password"
              aria-label="Gemini API key"
              autoComplete="off"
              placeholder="Paste your Gemini API key"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
            <button type="submit">Save key</button>
          </form>
          <div className="api-banner-body" style={{ marginTop: 6 }}>
            {userKey ? "✅ Key saved in this browser." : "No key saved yet."}
          </div>
        </div>
      ) : null}
    </div>
  );
}
