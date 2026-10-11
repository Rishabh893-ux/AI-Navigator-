"use client";

import { useEffect, useMemo, useState } from "react";
import { ACHIEVEMENTS, type QuizAttempt } from "@/lib/achievements";
import { dayKey, daysAgo, type ActivityMap, type Streak } from "@/lib/activity";
import { LEVELS } from "@/lib/content";
import {
  PASS_MARK,
  SKILLS,
  SKILL_BY_ID,
  TIERS,
  doneCount,
  type ProgressMap,
} from "@/lib/skills";

const WEEKS = 26;
const RECENT_QUIZZES = 12;

interface Props {
  progress: ProgressMap;
  quizLog: QuizAttempt[];
  activity: ActivityMap;
  streak: Streak;
  achievements: Record<string, string>;
}

interface Tip {
  x: number;
  y: number;
  value: string;
  label: string;
}

/** A small tooltip positioned inside a chart container. Values lead, labels follow. */
function Tooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  return (
    <div
      className="viz-tip"
      style={{ left: tip.x, top: tip.y }}
      role="presentation"
    >
      <strong>{tip.value}</strong>
      <span>{tip.label}</span>
    </div>
  );
}

/** Position for a tooltip above the hovered or focused element, relative to its chart. */
function tipFor(el: Element, value: string, label: string): Tip {
  const box = el.getBoundingClientRect();
  const frame = el.closest(".viz-frame")!.getBoundingClientRect();
  return {
    x: box.left - frame.left + box.width / 2,
    y: box.top - frame.top - 6,
    value,
    label,
  };
}

const heatLevel = (n: number) =>
  n <= 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4;
const fmtDay = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

function ActivityHeatmap({ activity }: { activity: ActivityMap }) {
  const [tip, setTip] = useState<Tip | null>(null);
  const [asTable, setAsTable] = useState(false);
  // "Today" is only known in the browser (the page itself is pre-built ahead of time)
  const [today, setToday] = useState<Date | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the clock after mount
  useEffect(() => setToday(new Date()), []);

  // Columns are weeks (oldest → newest), rows are Monday → Sunday
  const { weeks, months, activeDays, total } = useMemo(() => {
    if (!today) return { weeks: [], months: [], activeDays: 0, total: 0 };
    const mondayOffset = (today.getDay() + 6) % 7; // days since Monday
    const start = daysAgo(today, mondayOffset + (WEEKS - 1) * 7);
    const weeks: {
      date: Date;
      key: string;
      count: number;
      future: boolean;
    }[][] = [];
    const months: { col: number; label: string }[] = [];
    let total = 0;
    let activeDays = 0;
    for (let w = 0; w < WEEKS; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + w * 7 + d,
        );
        const key = dayKey(date);
        const future = date > today;
        const count = future ? 0 : activity[key] || 0;
        if (count) {
          total += count;
          activeDays++;
        }
        col.push({ date, key, count, future });
      }
      const first = col[0].date;
      if (w === 0 || first.getDate() <= 7)
        months.push({
          col: w,
          label: first.toLocaleDateString(undefined, { month: "short" }),
        });
      weeks.push(col);
    }
    return { weeks, months, activeDays, total };
  }, [activity, today]);

  const rows = weeks
    .flat()
    .filter((d) => d.count > 0)
    .reverse();

  return (
    <div className="card">
      <div className="viz-head">
        <div>
          <h2 className="card-title">Study activity</h2>
          <div className="card-sub">
            {total} study actions on {activeDays} days in the last {WEEKS} weeks
            — quizzes, skills, mentor chats and topics
          </div>
        </div>
        <button
          className="link-btn"
          onClick={() => setAsTable((v) => !v)}
          aria-pressed={asTable}
        >
          {asTable ? "Show chart" : "Show as table"}
        </button>
      </div>

      {asTable ? (
        <table className="viz-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Study actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((d) => (
                <tr key={d.key}>
                  <td>{fmtDay(d.date)}</td>
                  <td>{d.count}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2}>
                  No activity yet — take a quiz to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <div
          className="viz-frame heat-frame"
          onPointerLeave={() => setTip(null)}
        >
          <div className="heat-inner">
            <div
              className="heat-months"
              aria-hidden="true"
              style={{ gridTemplateColumns: `repeat(${WEEKS}, var(--cell))` }}
            >
              {months.map((m) => (
                <span key={m.col} style={{ gridColumn: m.col + 1 }}>
                  {m.label}
                </span>
              ))}
            </div>
            <div className="heat-body">
              <div className="heat-days" aria-hidden="true">
                <span>Mon</span>
                <span />
                <span>Wed</span>
                <span />
                <span>Fri</span>
                <span />
                <span />
              </div>
              <div
                className="heat-grid"
                role="img"
                aria-label={`Study activity heatmap: ${total} actions on ${activeDays} days. Use “Show as table” for the values.`}
              >
                {weeks.map((col, w) => (
                  <div key={w} className="heat-col">
                    {col.map((d) => (
                      <span
                        key={d.key}
                        className={`heat-cell h${heatLevel(d.count)}${d.future ? " future" : ""}`}
                        onPointerEnter={(e) =>
                          !d.future &&
                          setTip(
                            tipFor(
                              e.currentTarget,
                              `${d.count} ${d.count === 1 ? "action" : "actions"}`,
                              fmtDay(d.date),
                            ),
                          )
                        }
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="heat-legend" aria-hidden="true">
              Less
              {[0, 1, 2, 3, 4].map((l) => (
                <span key={l} className={`heat-cell h${l}`} />
              ))}
              More
            </div>
          </div>
          <Tooltip tip={tip} />
        </div>
      )}
    </div>
  );
}

function MasteryByLevel({ progress }: { progress: ProgressMap }) {
  return (
    <div className="card">
      <h2 className="card-title">Skills complete by level</h2>
      <div className="card-sub" style={{ marginBottom: 14 }}>
        Passed quiz or marked as known
      </div>
      <div className="meters">
        {TIERS.map((tier) => {
          const total = SKILLS.filter((s) => s.tier === tier).length;
          const done = doneCount(progress, tier);
          const label = LEVELS.find((l) => l.id === tier)?.label ?? tier;
          return (
            <div key={tier} className="meter-row">
              <div className="meter-label">
                <span>{label}</span>
                <span className="meter-value">
                  {done} / {total}
                </span>
              </div>
              <div
                className="meter-track"
                role="meter"
                aria-label={`${label} skills complete`}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={done}
              >
                <div
                  className="meter-fill"
                  style={{ width: `${(done / total) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuizScores({ quizLog }: { quizLog: QuizAttempt[] }) {
  const [tip, setTip] = useState<Tip | null>(null);
  const [asTable, setAsTable] = useState(false);
  const recent = quizLog.slice(-RECENT_QUIZZES);
  const H = 160; // plot height in px
  const describe = (a: QuizAttempt) =>
    `${SKILL_BY_ID[a.skill]?.title ?? a.skill} · ${new Date(a.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${a.score >= PASS_MARK ? "passed" : "not passed"}`;

  return (
    <div className="card">
      <div className="viz-head">
        <div>
          <h2 className="card-title">Recent quiz scores</h2>
          <div className="card-sub">
            Last {Math.min(RECENT_QUIZZES, recent.length) || RECENT_QUIZZES}{" "}
            attempts · pass mark {PASS_MARK}%
          </div>
        </div>
        {recent.length > 0 && (
          <button
            className="link-btn"
            onClick={() => setAsTable((v) => !v)}
            aria-pressed={asTable}
          >
            {asTable ? "Show chart" : "Show as table"}
          </button>
        )}
      </div>

      {!recent.length ? (
        <div className="empty-state">
          📝 No quizzes yet. Take one from the Skill Tree to see your scores
          here.
        </div>
      ) : asTable ? (
        <table className="viz-table">
          <thead>
            <tr>
              <th>Skill</th>
              <th>Date</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {[...recent].reverse().map((a, i) => (
              <tr key={`${a.at}-${i}`}>
                <td>{SKILL_BY_ID[a.skill]?.title ?? a.skill}</td>
                <td>{new Date(a.at).toLocaleDateString()}</td>
                <td>
                  {a.score}% {a.score >= PASS_MARK ? "✅" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div
          className="viz-frame bars-frame"
          onPointerLeave={() => setTip(null)}
        >
          <div className="bars-axis" aria-hidden="true">
            {[100, 50, 0].map((t) => (
              <span key={t} style={{ top: H - (t / 100) * H }}>
                {t}%
              </span>
            ))}
          </div>
          <div className="bars-plot" style={{ height: H }}>
            {[100, 50].map((t) => (
              <div
                key={t}
                className="bars-grid"
                style={{ top: H - (t / 100) * H }}
              />
            ))}
            <div
              className="bars-pass"
              style={{ top: H - (PASS_MARK / 100) * H }}
            >
              <span>Pass {PASS_MARK}%</span>
            </div>
            <div className="bars-row">
              {recent.map((a, i) => {
                const last = i === recent.length - 1;
                return (
                  <button
                    key={`${a.at}-${i}`}
                    className="bar-slot"
                    aria-label={`${a.score}% — ${describe(a)}`}
                    onPointerEnter={(e) =>
                      setTip(
                        tipFor(
                          e.currentTarget.firstElementChild!,
                          `${a.score}%`,
                          describe(a),
                        ),
                      )
                    }
                    onFocus={(e) =>
                      setTip(
                        tipFor(
                          e.currentTarget.firstElementChild!,
                          `${a.score}%`,
                          describe(a),
                        ),
                      )
                    }
                    onBlur={() => setTip(null)}
                  >
                    <span
                      className="bar"
                      style={{ height: Math.max(2, (a.score / 100) * H) }}
                    >
                      {last && <span className="bar-label">{a.score}%</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="bars-base" />
          </div>
          <Tooltip tip={tip} />
        </div>
      )}
    </div>
  );
}

export default function Stats({
  progress,
  quizLog,
  activity,
  streak,
  achievements,
}: Props) {
  const done = doneCount(progress);
  const avg = quizLog.length
    ? Math.round(quizLog.reduce((sum, a) => sum + a.score, 0) / quizLog.length)
    : null;
  const earned = ACHIEVEMENTS.filter((a) => achievements[a.id]).length;

  return (
    <div className="panel">
      <div>
        <h1 className="sec-head">Your stats</h1>
        <div className="sec-sub">
          How you&apos;re learning, at a glance. Everything is calculated from
          your activity in this browser.
        </div>
      </div>

      <div className="grid4">
        <div className="metric">
          <div className="metric-lbl">Skills complete</div>
          <div className="metric-val">
            {done} <span className="metric-of">/ {SKILLS.length}</span>
          </div>
        </div>
        <div className="metric">
          <div className="metric-lbl">Quizzes taken</div>
          <div className="metric-val">{quizLog.length}</div>
        </div>
        <div className="metric">
          <div className="metric-lbl">Average quiz score</div>
          <div className="metric-val">{avg === null ? "—" : `${avg}%`}</div>
        </div>
        <div className="metric">
          <div className="metric-lbl">Streak</div>
          <div className="metric-val">
            {streak.count} {streak.count === 1 ? "day" : "days"}
          </div>
          <div className="metric-note">Best: {streak.best}</div>
        </div>
      </div>

      <ActivityHeatmap activity={activity} />

      <div className="grid2 stats-pair">
        <MasteryByLevel progress={progress} />
        <QuizScores quizLog={quizLog} />
      </div>

      <div className="card">
        <h2 className="card-title">
          Achievements · {earned} / {ACHIEVEMENTS.length}
        </h2>
        <div className="card-sub" style={{ marginBottom: 14 }}>
          Earn badges by learning, practising and keeping your streak alive.
        </div>
        <div className="badges">
          {ACHIEVEMENTS.map((a) => {
            const at = achievements[a.id];
            return (
              <div key={a.id} className={`badge${at ? " earned" : ""}`}>
                <span className="badge-emoji" aria-hidden="true">
                  {at ? a.emoji : "🔒"}
                </span>
                <div>
                  <div className="badge-title">{a.title}</div>
                  <div className="card-sub">{a.description}</div>
                  {at && (
                    <div className="badge-date">
                      Earned {new Date(at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
