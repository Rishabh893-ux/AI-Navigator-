"use client";

import { FOCUS_AREAS, LEVELS, type Focus, type Level } from "@/lib/content";

interface Props {
  open: boolean;
  level: Level;
  onLevel: (level: Level) => void;
  focus: Focus | null;
  onFocus: (focus: Focus) => void;
  pct: number;
}

export default function Sidebar({ open, level, onLevel, focus, onFocus, pct }: Props) {
  return (
    <aside id="sidebar" className={open ? "open" : undefined}>
      <div className="sb-label">My level</div>
      {LEVELS.map((l) => (
        <button key={l.id} className={`sb-item${level === l.id ? " active" : ""}`} onClick={() => onLevel(l.id)}>
          <span className="sb-dot" style={{ background: l.color }} />
          {l.label}
        </button>
      ))}
      <div className="sb-label">Focus areas</div>
      {FOCUS_AREAS.map((f) => (
        <button
          key={f.id}
          className={`sb-item${focus === f.id ? " active" : ""}`}
          aria-pressed={focus === f.id}
          onClick={() => onFocus(f.id)}
        >
          <span className="sb-dot" style={{ background: f.color }} />
          {f.label}
        </button>
      ))}
      <div className="prog-wrap">
        <div className="prog-label">
          <span>Overall progress</span>
          <span>{pct}%</span>
        </div>
        <div className="prog-track">
          <div className="prog-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </aside>
  );
}
