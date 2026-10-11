"use client";

import { useEffect, useState } from "react";
import { ACHIEVEMENT_BY_ID } from "@/lib/achievements";

const SHOW_MS = 9000;

function Toast({ id, onDismiss }: { id: string; onDismiss: (id: string) => void }) {
  const badge = ACHIEVEMENT_BY_ID[id];
  const [paused, setPaused] = useState(false);

  // Auto-close, but never while the pointer or keyboard focus is on the toast
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => onDismiss(id), SHOW_MS);
    return () => clearTimeout(timer);
  }, [id, onDismiss, paused]);

  if (!badge) return null;
  return (
    <div
      className="toast"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="toast-emoji" aria-hidden="true">
        {badge.emoji}
      </span>
      <div>
        <div className="toast-kicker">Achievement unlocked!</div>
        <div className="toast-title">{badge.title}</div>
        <div className="card-sub">{badge.description}</div>
      </div>
      <button className="icon-btn" onClick={() => onDismiss(id)} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

/** Pop-ups for newly earned badges. */
export default function Toasts({ ids, onDismiss }: { ids: string[]; onDismiss: (id: string) => void }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {ids.slice(0, 3).map((id) => (
        <Toast key={id} id={id} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
