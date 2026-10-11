"use client";

import { ROW_COUNT, SKILLS, SKILL_BY_ID, progressOf, statusOf, type ProgressMap, type SkillStatus } from "@/lib/skills";

const ROW_HEIGHT = 104; // px per row
const NODE_HEIGHT = 70;

const STATUS_TEXT: Record<SkillStatus, (best: number | null) => string> = {
  mastered: (best) => `✅ Mastered${best !== null ? ` · ${best}%` : ""}`,
  known: () => "☑️ Known",
  "in-progress": (best) => `📝 Best ${best ?? 0}%`,
  available: () => "▶ Ready",
  locked: () => "🔒 Locked",
};

const rows = Array.from({ length: ROW_COUNT }, (_, r) => SKILLS.filter((s) => s.row === r));

/** Horizontal centre of a skill, in % of the tree's width */
function centreX(id: string): number {
  const skill = SKILL_BY_ID[id];
  const row = rows[skill.row];
  return ((row.indexOf(skill) + 0.5) / row.length) * 100;
}

interface Props {
  progress: ProgressMap;
  recommendedId?: string;
  selectedId?: string;
  onSelect: (id: string) => void;
}

export default function SkillTree({ progress, recommendedId, selectedId, onSelect }: Props) {
  const height = ROW_COUNT * ROW_HEIGHT - (ROW_HEIGHT - NODE_HEIGHT);

  return (
    <div className="skill-tree" style={{ height }}>
      {/* Prerequisite lines. x is stretched to the width; y stays in pixels. */}
      <svg className="tree-lines" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
        {SKILLS.flatMap((skill) =>
          skill.prereqs.map((pre) => {
            const x1 = centreX(pre);
            const y1 = SKILL_BY_ID[pre].row * ROW_HEIGHT + NODE_HEIGHT;
            const x2 = centreX(skill.id);
            const y2 = skill.row * ROW_HEIGHT;
            const mid = (y1 + y2) / 2;
            const lit = progressOf(progress, pre).done;
            return (
              <path
                key={`${pre}-${skill.id}`}
                d={`M${x1} ${y1} C${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
                className={lit ? "tree-line lit" : "tree-line"}
              />
            );
          }),
        )}
      </svg>

      {rows.map((row) =>
        row.map((skill, i) => {
          const status = statusOf(progress, skill.id);
          const best = progressOf(progress, skill.id).best;
          const classes = [
            "skill-node",
            status,
            skill.id === recommendedId ? "next" : "",
            skill.id === selectedId ? "selected" : "",
          ].join(" ");
          return (
            <button
              key={skill.id}
              className={classes}
              style={{
                left: `calc(${((i + 0.5) / row.length) * 100}% - var(--node-w) / 2)`,
                top: skill.row * ROW_HEIGHT,
                height: NODE_HEIGHT,
              }}
              aria-pressed={skill.id === selectedId}
              aria-label={`${skill.title}: ${STATUS_TEXT[status](best)}${skill.id === recommendedId ? ", recommended next" : ""}`}
              onClick={() => onSelect(skill.id)}
            >
              <span className="skill-node-title">
                <span aria-hidden="true">{skill.emoji}</span> {skill.title}
              </span>
              <span className="skill-node-status">{STATUS_TEXT[status](best)}</span>
              {skill.id === recommendedId && <span className="skill-node-badge">Up next</span>}
            </button>
          );
        }),
      )}
    </div>
  );
}
