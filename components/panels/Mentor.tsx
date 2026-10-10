"use client";

import { useEffect, useRef, useState } from "react";
import { formatReply } from "@/lib/formatReply";
import { MAX_MESSAGES, type ChatMessage, type LearnerProfile, type MentorResponse } from "@/lib/mentor";
import { KEYS, readJson, readString, writeJson, writeString } from "@/lib/storage";

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 60_000;

/** A chat bubble. Only bubbles with `saved` are part of the conversation sent to Gemini. */
interface Bubble extends ChatMessage {
  saved: boolean;
  error?: boolean;
}

type Pending = null | { note?: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Loads saved chat, accepting the old single-file app format ({ role, parts: [{ text }] }) too. */
function loadSavedChat(): Bubble[] {
  const raw = readJson<unknown[]>(KEYS.chat, []);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): Bubble[] => {
    const m = item as { role?: string; text?: string; parts?: { text?: string }[] };
    const text = m.text ?? m.parts?.[0]?.text ?? "";
    return (m.role === "user" || m.role === "model") && text ? [{ role: m.role, text, saved: true }] : [];
  });
}

function saveChat(bubbles: Bubble[]) {
  writeJson(
    KEYS.chat,
    bubbles.filter((b) => b.saved).slice(-MAX_MESSAGES).map(({ role, text }) => ({ role, text })),
  );
}

async function askMentor(messages: ChatMessage[], profile: LearnerProfile, userKey: string | null) {
  const res = await fetch("/api/mentor", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(userKey ? { "x-user-gemini-key": userKey } : {}) },
    body: JSON.stringify({ messages, profile }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return (await res.json()) as MentorResponse;
}

export default function Mentor({ profile }: { profile: LearnerProfile }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [pending, setPending] = useState<Pending>(null);
  const [input, setInput] = useState("");
  const [serverKey, setServerKey] = useState<boolean | null>(null);
  const [userKey, setUserKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- syncing from localStorage, which only exists in the browser */
    setBubbles(loadSavedChat());
    setUserKey(readString(KEYS.apiKey));
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch("/api/mentor")
      .then((r) => r.json())
      .then((d: { serverKey?: boolean }) => setServerKey(Boolean(d.serverKey)))
      .catch(() => setServerKey(false));
  }, []);

  // Keep the newest message in view
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [bubbles, pending]);

  const busy = pending !== null;
  const needsKey = serverKey === false && !userKey;

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");

    const userBubble: Bubble = { role: "user", text, saved: !needsKey };
    const conversation = [...bubbles, userBubble];
    setBubbles(conversation);

    if (needsKey) {
      setBubbles([
        ...conversation,
        {
          role: "model",
          text: "⚠️ **API key not set.** Please read the yellow box below — it takes about 2 minutes to get a free key from Google AI Studio and paste it in.",
          saved: false,
          error: true,
        },
      ]);
      return;
    }

    setPending({});
    const history = conversation.filter((b) => b.saved).map(({ role, text }) => ({ role, text }));
    let result: MentorResponse;
    try {
      for (let attempt = 0; ; attempt++) {
        result = await askMentor(history, profile, serverKey ? null : userKey);
        const err = "error" in result ? result.error : null;
        const retryable = err && (err.code === 503 || (err.code === 429 && err.reason !== "rate_limited"));
        if (!retryable || attempt >= MAX_RETRIES) break;
        const wait = 2000 * 2 ** attempt;
        setPending({ note: `Gemini is busy — retrying in ${wait / 1000}s (attempt ${attempt + 1} of ${MAX_RETRIES})…` });
        await sleep(wait);
      }
    } catch (err) {
      const timedOut = err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError");
      result = {
        error: {
          code: 0,
          message: timedOut
            ? "Gemini took too long to answer (over 60s). Please try again."
            : "Network error. Please check your internet connection and try again.",
        },
      };
    }

    setPending(null);
    let next: Bubble[];
    if ("reply" in result) {
      next = [...conversation, { role: "model", text: result.reply, saved: true }];
    } else {
      const { code, message, reason } = result.error;
      const hint =
        reason === "no_key" ? "" : code === 503 || code === 429 ? " — please try again in a minute." : code >= 400 && code < 500 && !reason ? " — check your API key." : "";
      // The failed question stays on screen but isn't sent again with the next message
      next = conversation.map((b) => (b === userBubble ? { ...b, saved: false } : b));
      next.push({ role: "model", text: `⚠️ ${message}${hint}`, saved: false, error: true });
    }
    setBubbles(next);
    saveChat(next);
  }

  function clearChat() {
    setBubbles([]);
    saveChat([]);
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
        <div className="sec-sub">Ask anything about your AI learning journey. Powered by Google Gemini.</div>
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
              Hi! I&apos;m your AI Mentor. I can help you figure out what to learn next, explain any AI concept
              simply, recommend free courses, or answer career questions. What&apos;s on your mind?
            </div>
          </div>
          <div className="msg">
            <div className="msg-av ai">AI</div>
            <div className="msg-bub">
              Try asking:
              <br />• &quot;What should I learn after Python basics?&quot;
              <br />• &quot;Explain transformers simply&quot;
              <br />• &quot;How do I get a job in AI?&quot;
              <br />• &quot;What&apos;s the difference between ML and deep learning?&quot;
            </div>
          </div>
          {bubbles.map((b, i) => (
            <div key={i} className={b.role === "user" ? "msg user-msg" : "msg"}>
              <div className={b.role === "user" ? "msg-av usr" : "msg-av ai"}>{b.role === "user" ? "U" : "AI"}</div>
              {b.role === "user" ? (
                <div className="msg-bub">{b.text}</div>
              ) : (
                <div className="msg-bub" dangerouslySetInnerHTML={{ __html: formatReply(b.text) }} />
              )}
            </div>
          ))}
          {pending && (
            <div className="msg">
              <div className="msg-av ai">AI</div>
              <div className="msg-bub">
                <div className="typing" aria-label="Mentor is typing">
                  <div className="t-dot" />
                  <div className="t-dot" />
                  <div className="t-dot" />
                </div>
                {pending.note && <div className="card-sub">{pending.note}</div>}
              </div>
            </div>
          )}
        </div>
        <form
          className="chat-row"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            type="text"
            aria-label="Message the AI mentor"
            placeholder="Ask your AI mentor..."
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
