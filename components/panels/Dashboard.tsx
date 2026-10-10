"use client";

import { TOOLS, UPDATES } from "@/lib/content";
import Tags from "../Tags";
import type { PanelId } from "../TopNav";

interface Props {
  done: number;
  total: number;
  streak: number;
  onNavigate: (id: PanelId) => void;
}

const RECOMMENDATIONS: { to: PanelId; label: string; color: string; title: string; sub: string }[] = [
  { to: "roadmap", label: "Next step →", color: "var(--blue)", title: "Python for ML", sub: "NumPy, Pandas fundamentals" },
  { to: "topics", label: "Explore →", color: "var(--green)", title: "What is a Neural Network?", sub: "Clear explanation, no jargon" },
  { to: "mentor", label: "Ask AI →", color: "var(--purple)", title: "Get a personalized plan", sub: "Chat with your AI mentor" },
  { to: "updates", label: "Read →", color: "var(--amber)", title: "Latest in AI", sub: `${UPDATES.length} updates to explore` },
];

export default function Dashboard({ done, total, streak, onNavigate }: Props) {
  return (
    <div className="panel">
      <div>
        <h1 className="sec-head">Welcome to AI Navigator</h1>
        <div className="sec-sub">Your personalized AI learning hub — structured, clear, and always up to date.</div>
      </div>
      <div className="grid3">
        <div className="metric">
          <div className="metric-lbl">Topics covered</div>
          <div className="metric-val" style={{ color: "var(--blue)" }}>
            {done} / {total}
          </div>
        </div>
        <div className="metric">
          <div className="metric-lbl">Learning streak</div>
          <div className="metric-val" style={{ color: "var(--green)" }}>
            {streak} {streak === 1 ? "day" : "days"}
          </div>
        </div>
        <div className="metric">
          <div className="metric-lbl">AI updates</div>
          <div className="metric-val" style={{ color: "var(--amber)" }}>
            {UPDATES.length}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-title" style={{ marginBottom: 14 }}>
          Popular AI tools to try
        </div>
        {TOOLS.map((tool) => (
          <div className="tool-row" key={tool.name}>
            <div className="tool-icon" style={{ background: tool.iconBg }} aria-hidden="true">
              {tool.icon}
            </div>
            <div className="tool-info">
              <div className="tool-name">{tool.name}</div>
              <div className="tool-desc">{tool.desc}</div>
              <Tags tags={tool.tags} className="tool-tags" />
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-title">Recommended for you</div>
        <div className="card-sub" style={{ marginBottom: 14 }}>
          Based on your level and recent activity
        </div>
        <div className="grid2">
          {RECOMMENDATIONS.map((r) => (
            <button key={r.to} className="rec-card" onClick={() => onNavigate(r.to)}>
              <div className="rec-lbl" style={{ color: r.color }}>
                {r.label}
              </div>
              <div className="rec-title">{r.title}</div>
              <div className="rec-sub">{r.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
