import { NEWS_SOURCES, UPDATES, UPDATES_REVIEWED } from "@/lib/content";
import Tags from "../Tags";

export default function Updates() {
  return (
    <div className="panel">
      <div>
        <h1 className="sec-head">AI updates</h1>
        <div className="sec-sub">Important AI changes for students, plus trusted places to follow the news yourself.</div>
      </div>
      <div className="card">
        <div className="week-lbl">Last reviewed {UPDATES_REVIEWED}</div>
        {UPDATES.map((u) => (
          <div className="update-row" key={u.title}>
            <div className="update-date">{u.date}</div>
            <div className="update-content">
              <div className="update-title">{u.title}</div>
              <div className="update-body">{u.body}</div>
              <Tags tags={u.tags} className="update-tags" />
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-title" style={{ marginBottom: 6 }}>
          Follow the news yourself
        </div>
        <div className="card-sub" style={{ marginBottom: 12 }}>
          Reliable, free sources — check one each week.
        </div>
        <div className="step-links">
          {NEWS_SOURCES.map((s) => (
            <a key={s.label} className="res-link" href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
