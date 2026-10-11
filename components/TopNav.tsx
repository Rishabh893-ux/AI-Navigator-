"use client";

import { UPDATES } from "@/lib/content";
import { PAGES, type PanelId } from "@/lib/pages";

export type { PanelId };

interface Props {
  panel: PanelId;
  onSelect: (id: PanelId) => void;
  showBadge: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
}

export default function TopNav({ panel, onSelect, showBadge, theme, onToggleTheme, menuOpen, onToggleMenu }: Props) {
  return (
    <nav id="topnav">
      <div className="nav-logo">
        <div className="logo-icon">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="8" cy="8" r="3" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M11 3.5L9.5 5M4 11l-1.5 1.5" />
          </svg>
        </div>
        AI Navigator
      </div>
      <div className={`nav-tabs${menuOpen ? " open" : ""}`} id="nav-tabs-menu">
        {PAGES.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab${panel === tab.id ? " active" : ""}`}
            aria-current={panel === tab.id ? "page" : undefined}
            onClick={() => onSelect(tab.id)}
          >
            {tab.label}
            {tab.id === "updates" && showBadge && <span className="nav-badge">{UPDATES.length}</span>}
          </button>
        ))}
      </div>
      <button
        className="theme-btn"
        onClick={onToggleTheme}
        title="Toggle dark mode"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
      <button className="hamburger" onClick={onToggleMenu} aria-label="Open menu" aria-expanded={menuOpen}>
        &#9776;
      </button>
    </nav>
  );
}
