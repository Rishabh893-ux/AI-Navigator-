"use client";

import { useCallback, useEffect, useState } from "react";
import { COURSES, FOCUS_AREAS, UPDATES_VERSION, type Focus, type Level } from "@/lib/content";
import { KEYS, readJson, readString, writeJson, writeString } from "@/lib/storage";
import TopNav, { type PanelId } from "./TopNav";
import Sidebar from "./Sidebar";
import Dashboard from "./panels/Dashboard";
import Roadmap from "./panels/Roadmap";
import Topics from "./panels/Topics";
import Progress from "./panels/Progress";
import Mentor from "./panels/Mentor";
import Updates from "./panels/Updates";

type Theme = "light" | "dark";

const LEVEL_IDS: Level[] = ["beginner", "intermediate", "advanced"];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Counts consecutive days the app was opened, and records today's visit. */
function recordVisit(): number {
  const data = readJson<{ last?: string; count?: number }>(KEYS.streak, {});
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  let streak = 1;
  if (data.last === dayKey(today)) streak = data.count || 1;
  else if (data.last === dayKey(yesterday)) streak = (data.count || 0) + 1;
  writeJson(KEYS.streak, { last: dayKey(today), count: streak });
  return streak;
}

export default function Navigator() {
  const [panel, setPanel] = useState<PanelId>("dashboard");
  const [level, setLevel] = useState<Level>("beginner");
  const [focus, setFocus] = useState<Focus | null>(null);
  const [progress, setProgress] = useState<boolean[]>(() => COURSES.map((c) => c.initiallyDone));
  const [theme, setTheme] = useState<Theme>("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [updatesSeen, setUpdatesSeen] = useState(true);
  const [streak, setStreak] = useState(1);
  const [loaded, setLoaded] = useState(false);

  // Load everything saved in the browser once, after the first render
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- syncing from localStorage, which only exists in the browser */
    const saved = readJson<boolean[] | null>(KEYS.progress, null);
    if (Array.isArray(saved)) setProgress(COURSES.map((_, i) => !!saved[i]));
    const savedLevel = readString(KEYS.level) as Level | null;
    if (savedLevel && LEVEL_IDS.includes(savedLevel)) setLevel(savedLevel);
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    setUpdatesSeen(readString(KEYS.updatesSeen) === UPDATES_VERSION);
    setStreak(recordVisit());
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const showPanel = useCallback((id: PanelId) => {
    setPanel(id);
    setMenuOpen(false);
    if (id === "updates") {
      writeString(KEYS.updatesSeen, UPDATES_VERSION);
      setUpdatesSeen(true);
    }
  }, []);

  const chooseLevel = useCallback(
    (next: Level, openRoadmap: boolean) => {
      setLevel(next);
      writeString(KEYS.level, next);
      if (openRoadmap) showPanel("roadmap");
    },
    [showPanel],
  );

  const chooseFocus = useCallback(
    (next: Focus) => {
      setFocus((current) => (current === next ? null : next));
      showPanel("topics");
    },
    [showPanel],
  );

  const toggleCourse = useCallback((index: number) => {
    setProgress((current) => {
      const next = current.map((done, i) => (i === index ? !done : done));
      writeJson(KEYS.progress, next);
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      writeString(KEYS.theme, next);
      return next;
    });
  }, []);

  const done = progress.filter(Boolean).length;
  const total = COURSES.length;
  const pct = Math.round((done / total) * 100);
  const profile = {
    level,
    done: COURSES.filter((_, i) => progress[i]).map((c) => c.title),
    todo: COURSES.filter((_, i) => !progress[i]).map((c) => c.title),
  };
  const focusLabel = FOCUS_AREAS.find((f) => f.id === focus)?.label;

  return (
    <>
      <TopNav
        panel={panel}
        onSelect={showPanel}
        showBadge={loaded && !updatesSeen}
        theme={theme}
        onToggleTheme={toggleTheme}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
      />
      <div id="main">
        <Sidebar
          open={menuOpen}
          level={level}
          onLevel={(l) => chooseLevel(l, true)}
          focus={focus}
          onFocus={chooseFocus}
          pct={pct}
        />
        <main id="content">
          {/* Every tab stays mounted (just hidden), so a half-typed search or a pending mentor reply survives switching tabs */}
          <div hidden={panel !== "dashboard"}>
            <Dashboard done={done} total={total} streak={streak} onNavigate={showPanel} />
          </div>
          <div hidden={panel !== "roadmap"}>
            <Roadmap level={level} onLevel={(l) => chooseLevel(l, false)} />
          </div>
          <div hidden={panel !== "topics"}>
            <Topics focus={focus} focusLabel={focusLabel} />
          </div>
          <div hidden={panel !== "progress"}>
            <Progress progress={progress} onToggle={toggleCourse} />
          </div>
          <div hidden={panel !== "mentor"}>
            <Mentor profile={profile} />
          </div>
          <div hidden={panel !== "updates"}>
            <Updates />
          </div>
        </main>
      </div>
    </>
  );
}
