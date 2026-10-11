"use client";

import { useEffect, useState } from "react";
import { TOPICS, type Focus } from "@/lib/content";

interface Props {
  focus: Focus | null;
  focusLabel?: string;
  /** Expand and scroll to this topic (e.g. from the skill tree or the AI Mentor) */
  reveal: { id: string; n: number } | null;
  onOpen: (topicId: string) => void;
}

export default function Topics({ focus, focusLabel, reveal, onOpen }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!reveal) return;
    /* eslint-disable react-hooks/set-state-in-effect -- a one-off request from another tab */
    setQuery("");
    setOpen((current) => new Set(current).add(reveal.id));
    /* eslint-enable react-hooks/set-state-in-effect */
    requestAnimationFrame(() =>
      document.getElementById(`topic-card-${reveal.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  }, [reveal]);

  const q = query.toLowerCase().trim();
  const visible = TOPICS.filter(
    (t) =>
      (!focus || t.focus.includes(focus) || t.id === reveal?.id) &&
      (!q || t.keywords.includes(q) || t.title.toLowerCase().includes(q)),
  );

  const toggle = (id: string) => {
    if (!open.has(id)) onOpen(id);
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="panel">
      <div>
        <h1 className="sec-head">AI topic explainer</h1>
        <div className="sec-sub">Complex topics made simple. Click any topic to expand, or search below.</div>
      </div>
      <input
        className="search-input"
        type="search"
        aria-label="Search topics"
        placeholder="Search topics (e.g. neural network, LLM, RAG...)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {focusLabel && (
        <div className="card-sub">
          Showing topics for <strong>{focusLabel}</strong> — click it again in the sidebar to show all.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.map((topic) => {
          const isOpen = open.has(topic.id);
          return (
            <div key={topic.id} id={`topic-card-${topic.id}`} className={`topic-card${isOpen ? " open" : ""}`}>
              <button
                className="topic-hdr"
                aria-expanded={isOpen}
                aria-controls={`topic-${topic.id}`}
                onClick={() => toggle(topic.id)}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className={`tag tag-${topic.tag.kind}`}>{topic.tag.label}</span>
                  <span className="card-title">{topic.title}</span>
                </span>
                <span className="topic-chevron" aria-hidden="true">
                  ▾
                </span>
              </button>
              <div className="topic-body" id={`topic-${topic.id}`}>
                {topic.body}
              </div>
            </div>
          );
        })}
        {!visible.length && <div className="card-sub">No topics match your search.</div>}
      </div>
    </div>
  );
}
