"use client";

import { useEffect, useRef } from "react";
import { LEVELS, type Level } from "@/lib/content";
import {
  PASS_MARK,
  SKILLS,
  SKILL_BY_ID,
  TIERS,
  doneCount,
  isUnlocked,
  learningPath,
  progressOf,
  recommend,
  statusOf,
  type ProgressMap,
} from "@/lib/skills";
import SkillTree from "../SkillTree";

interface Props {
  progress: ProgressMap;
  level: Level;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onQuiz: (id: string) => void;
  onMarkKnown: (id: string) => void;
  onReset: (id: string) => void;
  onMarkTierKnown: (tier: Level) => void;
  onOpenTopic: (topicId: string) => void;
  /** Changes when something outside (e.g. the mentor) selects a skill, to scroll it into view */
  revealKey: number;
}

const tierLabel = (tier: Level) => LEVELS.find((l) => l.id === tier)?.label ?? tier;

export default function Skills(props: Props) {
  const { progress, level, selectedId, onSelect, onQuiz, onMarkKnown, onReset, onMarkTierKnown, onOpenTopic, revealKey } =
    props;
  const detailRef = useRef<HTMLDivElement>(null);
  const rec = recommend(progress, level);
  const path = learningPath(progress, level, 4);
  const selected = SKILL_BY_ID[selectedId ?? ""] ?? rec?.skill ?? SKILLS[0];
  const status = statusOf(progress, selected.id);
  const p = progressOf(progress, selected.id);
  const unlocked = isUnlocked(progress, selected.id);
  const missing = selected.prereqs.filter((id) => !progressOf(progress, id).done);

  // Tiers below the chosen level that aren't finished yet — offer to skip them
  const skippable = TIERS.slice(0, TIERS.indexOf(level)).filter(
    (t) => doneCount(progress, t) < SKILLS.filter((s) => s.tier === t).length,
  );

  useEffect(() => {
    if (revealKey) detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [revealKey]);

  const select = (id: string) => {
    onSelect(id);
    // On phones the details sit below the tree, so bring them into view
    if (window.matchMedia("(max-width: 760px)").matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  return (
    <div className="panel">
      <div>
        <h1 className="sec-head">Skill tree</h1>
        <div className="sec-sub">
          Master a skill by scoring {PASS_MARK}%+ on its quiz. New skills unlock as you finish their prerequisites.
        </div>
      </div>

      {skippable.length > 0 && (
        <div className="banner">
          <span>
            You chose <strong>{tierLabel(level)}</strong>. Already know the {skippable.map(tierLabel).join(" and ")}{" "}
            skills?
          </span>
          <button className="btn small" onClick={() => skippable.forEach(onMarkTierKnown)}>
            Mark them as known
          </button>
        </div>
      )}

      {rec ? (
        <div className="card up-next">
          <div className="up-next-main">
            <div className="rec-lbl" style={{ color: "var(--blue)" }}>
              ⭐ Up next for you
            </div>
            <div className="up-next-title">
              {rec.skill.emoji} {rec.skill.title}
            </div>
            <div className="card-sub">{rec.reason}</div>
            {path.length > 1 && (
              <div className="path-chips" aria-label="Your learning path">
                {path.map((s, i) => (
                  <button key={s.id} className="chip" onClick={() => select(s.id)}>
                    {i + 1}. {s.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="up-next-actions">
            <button className="btn primary" onClick={() => onQuiz(rec.skill.id)}>
              Take the quiz
            </button>
            <button className="btn" onClick={() => select(rec.skill.id)}>
              View skill
            </button>
          </div>
        </div>
      ) : (
        <div className="card up-next">
          <div className="up-next-main">
            <div className="up-next-title">🏆 Every skill is complete!</div>
            <div className="card-sub">Retake quizzes to turn “known” skills into mastered ones, or ask the AI Mentor what to explore next.</div>
          </div>
        </div>
      )}

      <div className="skills-layout">
        <div className="card tree-card">
          <div className="tree-legend" aria-label="Legend">
            <span><i className="dot mastered" /> Mastered</span>
            <span><i className="dot known" /> Known</span>
            <span><i className="dot in-progress" /> Attempted</span>
            <span><i className="dot available" /> Ready</span>
            <span><i className="dot locked" /> Locked</span>
          </div>
          <SkillTree progress={progress} recommendedId={rec?.skill.id} selectedId={selected.id} onSelect={select} />
        </div>

        <div className="card skill-detail" ref={detailRef} aria-live="polite">
          <div className="card-sub">
            {tierLabel(selected.tier)} skill · {doneCount(progress)}/{SKILLS.length} complete
          </div>
          <h2 className="detail-title">
            {selected.emoji} {selected.title}
          </h2>
          <span className={`status-pill ${status}`}>
            {status === "mastered" && `✅ Mastered · best ${p.best}%`}
            {status === "known" && "☑️ Marked as known — take the quiz to master it"}
            {status === "in-progress" && `📝 Best score ${p.best}% — ${PASS_MARK}% to master`}
            {status === "available" && "▶ Ready to learn"}
            {status === "locked" && "🔒 Locked"}
          </span>
          <p className="detail-summary">{selected.summary}</p>

          {selected.prereqs.length > 0 && (
            <div className="detail-section">
              <div className="detail-label">Prerequisites</div>
              <div className="path-chips">
                {selected.prereqs.map((id) => (
                  <button key={id} className={`chip ${progressOf(progress, id).done ? "chip-done" : ""}`} onClick={() => select(id)}>
                    {progressOf(progress, id).done ? "✓ " : ""}
                    {SKILL_BY_ID[id].title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="detail-section">
            <div className="detail-label">Learn it (free)</div>
            <div className="step-links">
              {selected.resources.map((r) => (
                <a key={r.href} className="res-link" href={r.href} target="_blank" rel="noopener noreferrer">
                  {r.label}
                </a>
              ))}
              {selected.topic && (
                <button className="res-link as-button" onClick={() => onOpenTopic(selected.topic!)}>
                  📚 Read the explainer
                </button>
              )}
            </div>
          </div>

          <div className="detail-actions">
            <button className="btn primary" onClick={() => onQuiz(selected.id)} disabled={!unlocked}>
              {status === "mastered" ? "Retake quiz" : "Take the quiz"}
            </button>
            {p.done ? (
              <button className="btn" onClick={() => onReset(selected.id)}>
                Reset progress
              </button>
            ) : (
              <button className="btn" onClick={() => onMarkKnown(selected.id)}>
                I already know this
              </button>
            )}
          </div>
          {!unlocked && (
            <div className="card-sub" style={{ marginTop: 8 }}>
              Unlocks after: {missing.map((id) => SKILL_BY_ID[id].title).join(", ")}. You can still mark it as known.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
