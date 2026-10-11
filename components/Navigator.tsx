"use client";

import { useCallback, useEffect, useState } from "react";
import { FOCUS_AREAS, LEVELS, TOPICS, UPDATES_VERSION, type Focus, type Level } from "@/lib/content";
import type { ToolOutcome } from "@/lib/mentor";
import { PAGES, PAGE_IDS, type PanelId } from "@/lib/pages";
import { sanitizePlan } from "@/lib/plan";
import { SKILLS, SKILL_BY_ID, doneCount, isUnlocked, progressOf } from "@/lib/skills";
import { KEYS, readString, writeString } from "@/lib/storage";
import QuizDialog from "./QuizDialog";
import Sidebar from "./Sidebar";
import Toasts from "./Toasts";
import TopNav from "./TopNav";
import { useLearner } from "./useLearner";
import Dashboard from "./panels/Dashboard";
import Mentor from "./panels/Mentor";
import Roadmap from "./panels/Roadmap";
import Skills from "./panels/Skills";
import Stats from "./panels/Stats";
import Topics from "./panels/Topics";
import Updates from "./panels/Updates";

type Theme = "light" | "dark";

const levelLabel = (id: string) => LEVELS.find((l) => l.id === id)?.label ?? id;
const pageLabel = (id: string) => PAGES.find((p) => p.id === id)?.label ?? id;

export default function Navigator() {
  const learner = useLearner();
  const [panel, setPanel] = useState<PanelId>("dashboard");
  const [focus, setFocus] = useState<Focus | null>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [updatesSeen, setUpdatesSeen] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [revealSkill, setRevealSkill] = useState(0);
  const [revealTopic, setRevealTopic] = useState<{ id: string; n: number } | null>(null);
  const [quizSkill, setQuizSkill] = useState<string | null>(null);
  const [mentorDraft, setMentorDraft] = useState<{ text: string; n: number } | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- syncing from the browser, which only exists after mount */
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    setUpdatesSeen(readString(KEYS.updatesSeen) === UPDATES_VERSION);
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

  const selectSkill = useCallback(
    (id: string) => {
      setSelectedSkill(id);
      setRevealSkill((n) => n + 1);
      showPanel("skills");
    },
    [showPanel],
  );

  const openTopic = useCallback(
    (id: string) => {
      setRevealTopic((r) => ({ id, n: (r?.n ?? 0) + 1 }));
      showPanel("topics");
    },
    [showPanel],
  );

  const chooseLevel = useCallback(
    (next: Level, openRoadmap: boolean) => {
      learner.setLevel(next);
      if (openRoadmap) showPanel("roadmap");
    },
    [learner, showPanel],
  );

  const chooseFocus = useCallback(
    (next: Focus) => {
      setFocus((current) => (current === next ? null : next));
      showPanel("topics");
    },
    [showPanel],
  );

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      writeString(KEYS.theme, next);
      return next;
    });
  }, []);

  const askMentor = useCallback(
    (text: string) => {
      setMentorDraft((d) => ({ text, n: (d?.n ?? 0) + 1 }));
      showPanel("mentor");
    },
    [showPanel],
  );

  /** Runs a tool the AI Mentor asked for. Validates everything — the request comes from the model. */
  const runTool = useCallback(
    (name: string, args: Record<string, unknown>): ToolOutcome => {
      const skillId = typeof args.skill_id === "string" ? args.skill_id : "";
      const skill = SKILL_BY_ID[skillId];
      const fail = (message: string): ToolOutcome => ({ ok: false, message, icon: "⚠️", label: message });
      const progress = learner.getProgress();

      switch (name) {
        case "mark_skill_complete": {
          if (!skill) return fail(`Unknown skill “${skillId}”.`);
          if (progressOf(progress, skill.id).done) {
            return { ok: true, message: `${skill.title} was already complete.`, icon: "✅", label: `${skill.title} is already complete` };
          }
          const previous = learner.markKnown(skill.id);
          return {
            ok: true,
            message: `Marked ${skill.title} as complete (as already known, not quiz-verified).`,
            icon: "✅",
            label: `Marked ${skill.title} as complete`,
            undo: { skillId: skill.id, previous },
          };
        }
        case "start_quiz": {
          if (!skill) return fail(`Unknown skill “${skillId}”.`);
          if (!isUnlocked(progress, skill.id)) {
            const missing = skill.prereqs.filter((id) => !progressOf(progress, id).done).map((id) => SKILL_BY_ID[id].title);
            return fail(`The ${skill.title} quiz is locked until ${missing.join(" and ")} ${missing.length > 1 ? "are" : "is"} complete.`);
          }
          setQuizSkill(skill.id);
          return {
            ok: true,
            message: `Opened the ${skill.title} quiz. The learner is taking it now; their score will update the skill tree.`,
            icon: "📝",
            label: `Opened the ${skill.title} quiz`,
          };
        }
        case "open_page": {
          const page = args.page as PanelId;
          if (!PAGE_IDS.includes(page)) return fail(`Unknown page “${String(args.page)}”.`);
          if (page === "skills" && skill) {
            selectSkill(skill.id);
            return { ok: true, message: `Showing ${skill.title} in the skill tree.`, icon: "📍", label: `Opened Skill Tree → ${skill.title}` };
          }
          const topic = TOPICS.find((t) => t.id === args.topic_id);
          if (page === "topics" && topic) {
            openTopic(topic.id);
            return { ok: true, message: `Opened the “${topic.title}” explainer.`, icon: "📍", label: `Opened Topics → ${topic.title}` };
          }
          showPanel(page);
          return { ok: true, message: `Opened the ${pageLabel(page)} page.`, icon: "📍", label: `Opened ${pageLabel(page)}` };
        }
        case "save_study_plan": {
          const plan = sanitizePlan(args);
          if (!plan) return fail("That study plan had no valid weeks, so nothing was saved.");
          learner.savePlan(plan);
          return {
            ok: true,
            message: `Saved “${plan.title}” (${plan.weeks.length} weeks) to the learner's dashboard.`,
            icon: "🗓️",
            label: `Saved study plan “${plan.title}” · ${plan.weeks.length} ${plan.weeks.length === 1 ? "week" : "weeks"} — see Dashboard`,
          };
        }
        case "set_level": {
          const level = LEVELS.find((l) => l.id === args.level)?.id;
          if (!level) return fail(`Unknown level “${String(args.level)}”.`);
          learner.setLevel(level);
          return { ok: true, message: `Level set to ${levelLabel(level)}.`, icon: "🎚️", label: `Level set to ${levelLabel(level)}` };
        }
        default:
          return fail(`Unknown action “${name}”.`);
      }
    },
    [learner, selectSkill, openTopic, showPanel],
  );

  const focusLabel = FOCUS_AREAS.find((f) => f.id === focus)?.label;
  const quiz = quizSkill ? SKILL_BY_ID[quizSkill] : null;
  const mentorProfile = {
    level: learner.level,
    progress: learner.progress,
    streak: learner.streak.count,
    plan: learner.plan?.title ?? null,
  };

  return (
    <>
      <TopNav
        panel={panel}
        onSelect={showPanel}
        showBadge={!updatesSeen}
        theme={theme}
        onToggleTheme={toggleTheme}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
      />
      <div id="main">
        <Sidebar
          open={menuOpen}
          level={learner.level}
          onLevel={(l) => chooseLevel(l, true)}
          focus={focus}
          onFocus={chooseFocus}
          done={doneCount(learner.progress)}
          total={SKILLS.length}
        />
        <main id="content">
          {/* Every tab stays mounted (just hidden), so a half-typed search or a pending mentor reply survives switching tabs */}
          <div hidden={panel !== "dashboard"}>
            <Dashboard
              progress={learner.progress}
              level={learner.level}
              streak={learner.streak.count}
              plan={learner.plan}
              achievements={learner.achievements}
              onNavigate={showPanel}
              onQuiz={setQuizSkill}
              onSelectSkill={selectSkill}
              onAskMentor={askMentor}
              onClearPlan={() => learner.savePlan(null)}
            />
          </div>
          <div hidden={panel !== "skills"}>
            <Skills
              progress={learner.progress}
              level={learner.level}
              selectedId={selectedSkill}
              onSelect={setSelectedSkill}
              onQuiz={setQuizSkill}
              onMarkKnown={(id) => learner.markKnown(id)}
              onReset={learner.resetSkill}
              onMarkTierKnown={learner.markTierKnown}
              onOpenTopic={openTopic}
              revealKey={revealSkill}
            />
          </div>
          <div hidden={panel !== "roadmap"}>
            <Roadmap
              level={learner.level}
              onLevel={(l) => chooseLevel(l, false)}
              progress={learner.progress}
              onSelectSkill={selectSkill}
            />
          </div>
          <div hidden={panel !== "topics"}>
            <Topics focus={focus} focusLabel={focusLabel} reveal={revealTopic} onOpen={() => learner.logActivity()} />
          </div>
          <div hidden={panel !== "stats"}>
            <Stats
              progress={learner.progress}
              quizLog={learner.quizLog}
              activity={learner.activity}
              streak={learner.streak}
              achievements={learner.achievements}
            />
          </div>
          <div hidden={panel !== "mentor"}>
            <Mentor
              profile={mentorProfile}
              runTool={runTool}
              onUndo={({ skillId, previous }) => learner.restoreSkill(skillId, previous)}
              onMessageSent={learner.countMentorMessage}
              draft={mentorDraft}
            />
          </div>
          <div hidden={panel !== "updates"}>
            <Updates />
          </div>
        </main>
      </div>

      {quiz && (
        <QuizDialog
          key={quiz.id}
          skill={quiz}
          previousBest={progressOf(learner.progress, quiz.id).best}
          onComplete={(score) => learner.recordQuiz(quiz.id, score)}
          onClose={() => setQuizSkill(null)}
        />
      )}
      <Toasts ids={learner.toasts} onDismiss={learner.dismissToast} />
    </>
  );
}
