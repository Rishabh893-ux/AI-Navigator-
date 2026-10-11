"use client";

import { LEVELS, ROADMAP, type Level } from "@/lib/content";
import { isDone, type ProgressMap } from "@/lib/skills";
import LearningPath from "../LearningPath";

interface Props {
  level: Level;
  onLevel: (level: Level) => void;
  progress: ProgressMap;
  onSelectSkill: (skillId: string) => void;
}

export default function Roadmap({ level, onLevel, progress, onSelectSkill }: Props) {
  const steps = ROADMAP[level];
  // Each step follows its skill: ✓ when complete, → for the first unfinished one
  const current = steps.findIndex((s) => !isDone(progress, s.skill));

  return (
    <div className="panel">
      <div>
        <h1 className="sec-head">Smart learning roadmap</h1>
        <div className="sec-sub">Step-by-step path tailored to your level. Free resources included.</div>
      </div>
      <div className="level-btns">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            className={`lvl-btn${level === l.id ? " sel" : ""}`}
            aria-pressed={level === l.id}
            onClick={() => onLevel(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="card">
        <div className="roadmap-steps">
          {steps.map((step, i) => {
            const last = i === steps.length - 1;
            const status = isDone(progress, step.skill) ? "done" : i === current ? "curr" : "pend";
            const marker = status === "done" ? "✓" : status === "curr" ? "→" : String(i + 1);
            return (
              <div className="step-row" key={step.title}>
                <div className="step-col">
                  <div className={`step-dot ${status}`}>{marker}</div>
                  {!last && <div className="step-line" />}
                </div>
                <div className="step-body" style={last ? { paddingBottom: 0 } : undefined}>
                  <div className="step-title">{step.title}</div>
                  <div className="step-detail">{step.detail}</div>
                  <div className="step-links">
                    <button className="res-link as-button" onClick={() => onSelectSkill(step.skill)}>
                      🌳 {status === "done" ? "Review" : "Practise"} in skill tree
                    </button>
                    {step.links.map((link) => (
                      <a key={link.label} className="res-link" href={link.href} target="_blank" rel="noopener noreferrer">
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="card">
        <div className="card-title" style={{ marginBottom: 14 }}>
          Visual learning path
        </div>
        <div className="flow-wrap">
          <LearningPath />
        </div>
      </div>
    </div>
  );
}
