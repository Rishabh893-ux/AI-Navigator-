"use client";

import { COURSES } from "@/lib/content";

export default function Progress({ progress, onToggle }: { progress: boolean[]; onToggle: (index: number) => void }) {
  const done = progress.filter(Boolean).length;
  const total = COURSES.length;
  const pct = Math.round((done / total) * 100);
  const tagStyle = { fontSize: 11, padding: "2px 8px" };

  return (
    <div className="panel">
      <div>
        <h1 className="sec-head">Progress tracker</h1>
        <div className="sec-sub">Check off topics as you complete them. Progress saves automatically in your browser.</div>
      </div>
      <div className="grid3">
        <div className="metric">
          <div className="metric-lbl">Completed</div>
          <div className="metric-val" style={{ color: "var(--green)" }}>{done}</div>
        </div>
        <div className="metric">
          <div className="metric-lbl">Remaining</div>
          <div className="metric-val" style={{ color: "var(--amber)" }}>{total - done}</div>
        </div>
        <div className="metric">
          <div className="metric-lbl">Completion</div>
          <div className="metric-val" style={{ color: "var(--blue)" }}>{pct}%</div>
        </div>
      </div>
      <div className="card">
        <div className="card-title" style={{ marginBottom: 14 }}>
          Beginner track — {total} topics
        </div>
        <div>
          {COURSES.map((course, i) => {
            const checked = progress[i];
            return (
              <div className="course-item" key={course.title}>
                <button
                  className={`check-btn${checked ? " checked" : ""}`}
                  role="checkbox"
                  aria-checked={checked}
                  aria-label={course.title}
                  onClick={() => onToggle(i)}
                >
                  {checked ? "✓" : ""}
                </button>
                <div className={`course-title${checked ? " done" : ""}`}>{course.title}</div>
                {checked ? (
                  <span className="tag tag-done" style={tagStyle}>Done</span>
                ) : course.inProgress ? (
                  <span className="tag tag-prog" style={tagStyle}>In progress</span>
                ) : (
                  <span className="tag tag-pend" style={tagStyle}>Pending</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
