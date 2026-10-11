"use client";

import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID } from "@/lib/achievements";
import { TOOLS, type Level } from "@/lib/content";
import type { PanelId } from "@/lib/pages";
import type { StudyPlan } from "@/lib/plan";
import { SKILLS, SKILL_BY_ID, doneCount, progressOf, recommend, type ProgressMap } from "@/lib/skills";
import Tags from "../Tags";

interface Props {
  progress: ProgressMap;
  level: Level;
  streak: number;
  plan: StudyPlan | null;
  achievements: Record<string, string>;
  onNavigate: (id: PanelId) => void;
  onQuiz: (skillId: string) => void;
  onSelectSkill: (skillId: string) => void;
  onAskMentor: (text: string) => void;
  onClearPlan: () => void;
}

export default function Dashboard(props: Props) {
  const { progress, level, streak, plan, achievements, onNavigate, onQuiz, onSelectSkill, onAskMentor, onClearPlan } = props;
  const done = doneCount(progress);
  const rec = recommend(progress, level);
  const earned = Object.entries(achievements)
    .filter(([id]) => ACHIEVEMENT_BY_ID[id])
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, 3)
    .map(([id]) => ACHIEVEMENT_BY_ID[id]);

  return (
    <div className="panel">
      <div>
        <h1 className="sec-head">Welcome to AI Navigator</h1>
        <div className="sec-sub">Your personalized AI learning hub — structured, clear, and always up to date.</div>
      </div>

      <div className="grid3">
        <button className="metric metric-link" onClick={() => onNavigate("skills")}>
          <div className="metric-lbl">Skills complete</div>
          <div className="metric-val" style={{ color: "var(--blue)" }}>
            {done} / {SKILLS.length}
          </div>
        </button>
        <button className="metric metric-link" onClick={() => onNavigate("stats")}>
          <div className="metric-lbl">Learning streak</div>
          <div className="metric-val" style={{ color: "var(--green)" }}>
            {streak} {streak === 1 ? "day" : "days"}
          </div>
        </button>
        <button className="metric metric-link" onClick={() => onNavigate("stats")}>
          <div className="metric-lbl">Badges earned</div>
          <div className="metric-val" style={{ color: "var(--amber)" }}>
            {Object.keys(achievements).filter((id) => ACHIEVEMENT_BY_ID[id]).length} / {ACHIEVEMENTS.length}
          </div>
        </button>
      </div>

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
          </div>
          <div className="up-next-actions">
            <button className="btn primary" onClick={() => onQuiz(rec.skill.id)}>
              Take the quiz
            </button>
            <button className="btn" onClick={() => onSelectSkill(rec.skill.id)}>
              Open skill tree
            </button>
          </div>
        </div>
      ) : (
        <div className="card up-next">
          <div className="up-next-main">
            <div className="up-next-title">🏆 You&apos;ve completed every skill!</div>
            <div className="card-sub">Ask the AI Mentor what to explore next.</div>
          </div>
        </div>
      )}

      <div className="grid2">
        <div className="card">
          <div className="card-title">🗓️ Study plan</div>
          {plan ? (
            <>
              <div className="card-sub" style={{ marginBottom: 12 }}>
                {plan.title} · made by your AI Mentor
              </div>
              <ol className="plan-weeks">
                {plan.weeks.map((w) => {
                  const weekDone = w.skillIds.length > 0 && w.skillIds.every((id) => progressOf(progress, id).done);
                  return (
                    <li key={w.week} className={weekDone ? "done" : undefined}>
                      <div className="plan-week-head">
                        Week {w.week} {weekDone && "✅"}
                      </div>
                      {w.focus && <div className="card-sub">{w.focus}</div>}
                      <div className="path-chips">
                        {w.skillIds.map((id) => (
                          <button
                            key={id}
                            className={`chip ${progressOf(progress, id).done ? "chip-done" : ""}`}
                            onClick={() => onSelectSkill(id)}
                          >
                            {progressOf(progress, id).done ? "✓ " : ""}
                            {SKILL_BY_ID[id].title}
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <div className="detail-actions">
                <button className="btn small" onClick={() => onAskMentor("Please adjust my study plan: ")}>
                  Change it with the mentor
                </button>
                <button className="link-btn" onClick={onClearPlan}>
                  Remove plan
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="card-sub" style={{ margin: "6px 0 12px" }}>
                No plan yet. Your AI Mentor can build a week-by-week plan around your progress and save it here.
              </div>
              <button
                className="btn primary small"
                onClick={() => onAskMentor("Make me a 4-week study plan based on my progress, about 5 hours per week.")}
              >
                Ask the mentor for a plan
              </button>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-title">🏆 Latest achievements</div>
          {earned.length ? (
            <div className="mini-badges">
              {earned.map((a) => (
                <div key={a.id} className="badge earned">
                  <span className="badge-emoji" aria-hidden="true">
                    {a.emoji}
                  </span>
                  <div>
                    <div className="badge-title">{a.title}</div>
                    <div className="card-sub">{a.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-sub" style={{ margin: "6px 0 12px" }}>
              No badges yet — take your first quiz to earn <strong>Quiz Rookie</strong> 📝
            </div>
          )}
          <button className="link-btn" onClick={() => onNavigate("stats")}>
            See all stats and badges →
          </button>
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
    </div>
  );
}
