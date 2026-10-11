"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ACHIEVEMENTS, newlyUnlocked, type QuizAttempt } from "@/lib/achievements";
import { addActivity, pruneActivity, recordVisit, type ActivityMap, type Streak } from "@/lib/activity";
import { LEVELS, type Level } from "@/lib/content";
import { sanitizePlan, type StudyPlan } from "@/lib/plan";
import {
  SKILLS,
  applyQuizResult,
  markKnown as markKnownIn,
  migrateLegacyChecklist,
  resetSkill as resetSkillIn,
  sanitizeProgress,
  type ProgressMap,
  type SkillProgress,
  type Tier,
} from "@/lib/skills";
import { KEYS, readJson, readString, writeJson, writeString } from "@/lib/storage";

const MAX_QUIZ_LOG = 200;
const LEVEL_IDS = LEVELS.map((l) => l.id);

function loadQuizLog(): QuizAttempt[] {
  const raw = readJson<unknown>(KEYS.quizLog, []);
  return Array.isArray(raw)
    ? raw.filter(
        (a): a is QuizAttempt =>
          !!a && typeof a.skill === "string" && typeof a.score === "number" && typeof a.at === "string",
      )
    : [];
}

/** All the learner's progress, saved in localStorage, plus the actions that change it. */
export function useLearner() {
  const [loaded, setLoaded] = useState(false);
  const [level, setLevelState] = useState<Level>("beginner");
  const [progress, setProgress] = useState<ProgressMap>({});
  const [quizLog, setQuizLog] = useState<QuizAttempt[]>([]);
  const [activity, setActivity] = useState<ActivityMap>({});
  const [streak, setStreak] = useState<Streak>({ count: 1, best: 1 });
  const [mentorMessages, setMentorMessages] = useState(0);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [achievements, setAchievements] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<string[]>([]);
  const firstCheck = useRef(true);
  // Latest values, so several actions in a row (e.g. the mentor marking 3 skills at once) all apply
  const progressRef = useRef<ProgressMap>({});
  const quizLogRef = useRef<QuizAttempt[]>([]);

  // Load once, in the browser
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- syncing from localStorage, which only exists in the browser */
    const now = new Date();
    const savedLevel = readString(KEYS.level) as Level | null;
    if (savedLevel && LEVEL_IDS.includes(savedLevel)) setLevelState(savedLevel);

    let map: ProgressMap;
    if (readString(KEYS.skills) !== null) {
      map = sanitizeProgress(readJson(KEYS.skills, {}));
    } else {
      // First visit since the skill tree arrived: carry over the old checklist, if any
      map = migrateLegacyChecklist(readJson<unknown>(KEYS.progress, null), now);
      writeJson(KEYS.skills, map);
    }
    progressRef.current = map;
    setProgress(map);
    quizLogRef.current = loadQuizLog();
    setQuizLog(quizLogRef.current);

    const act = pruneActivity(readJson<ActivityMap>(KEYS.activity, {}), now);
    setActivity(act);
    const visit = recordVisit(readJson<Partial<Streak> | null>(KEYS.streak, null), now);
    writeJson(KEYS.streak, visit);
    setStreak(visit);

    setMentorMessages(Math.max(0, Number(readJson<{ mentorMessages?: number }>(KEYS.counters, {}).mentorMessages) || 0));
    setPlan(sanitizePlan(readJson(KEYS.plan, null)));
    setAchievements(readJson<Record<string, string>>(KEYS.achievements, {}));
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Award badges whenever progress changes. Badges earned by data that existed before this
  // version (e.g. a migrated checklist) are recorded silently instead of popping up.
  useEffect(() => {
    if (!loaded) return;
    const ids = newlyUnlocked(
      { progress, quizLog, streak: streak.count, bestStreak: streak.best, mentorMessages, hasPlan: !!plan },
      achievements,
    );
    const silent = firstCheck.current;
    firstCheck.current = false;
    if (!ids.length) return;
    const at = new Date().toISOString();
    const next = { ...achievements, ...Object.fromEntries(ids.map((id) => [id, at])) };
    writeJson(KEYS.achievements, next);
    /* eslint-disable react-hooks/set-state-in-effect -- badges are derived from the progress above */
    setAchievements(next);
    if (!silent) setToasts((t) => [...t, ...ids]);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [loaded, progress, quizLog, streak, mentorMessages, plan, achievements]);

  const bumpActivity = useCallback((amount = 1) => {
    setActivity((current) => {
      const next = addActivity(current, new Date(), amount);
      writeJson(KEYS.activity, next);
      return next;
    });
  }, []);

  const saveProgress = useCallback((next: ProgressMap) => {
    progressRef.current = next;
    writeJson(KEYS.skills, next);
    setProgress(next);
  }, []);

  const setLevel = useCallback((next: Level) => {
    setLevelState(next);
    writeString(KEYS.level, next);
  }, []);

  const recordQuiz = useCallback(
    (skillId: string, score: number) => {
      saveProgress(applyQuizResult(progressRef.current, skillId, score, new Date()));
      const nextLog = [...quizLogRef.current, { skill: skillId, score, at: new Date().toISOString() }].slice(-MAX_QUIZ_LOG);
      quizLogRef.current = nextLog;
      writeJson(KEYS.quizLog, nextLog);
      setQuizLog(nextLog);
      bumpActivity();
    },
    [saveProgress, bumpActivity],
  );

  /** Marks a skill as already known. Returns its previous state so the change can be undone. */
  const markKnown = useCallback(
    (skillId: string): SkillProgress | undefined => {
      const before = progressRef.current[skillId];
      saveProgress(markKnownIn(progressRef.current, skillId, new Date()));
      bumpActivity();
      return before;
    },
    [saveProgress, bumpActivity],
  );

  const markTierKnown = useCallback(
    (tier: Tier) => {
      const now = new Date();
      const tierSkills = SKILLS.filter((s) => s.tier === tier);
      saveProgress(tierSkills.reduce((map, s) => markKnownIn(map, s.id, now), progressRef.current));
      bumpActivity();
    },
    [saveProgress, bumpActivity],
  );

  const restoreSkill = useCallback(
    (skillId: string, previous: SkillProgress | undefined) => {
      const next = { ...progressRef.current };
      if (previous) next[skillId] = previous;
      else delete next[skillId];
      saveProgress(next);
    },
    [saveProgress],
  );

  const resetSkill = useCallback(
    (skillId: string) => saveProgress(resetSkillIn(progressRef.current, skillId)),
    [saveProgress],
  );

  const savePlan = useCallback((next: StudyPlan | null) => {
    writeJson(KEYS.plan, next);
    setPlan(next);
  }, []);

  const countMentorMessage = useCallback(() => {
    setMentorMessages((n) => {
      writeJson(KEYS.counters, { mentorMessages: n + 1 });
      return n + 1;
    });
    bumpActivity();
  }, [bumpActivity]);

  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x !== id)), []);

  /** Always the latest progress, even between renders (used by the mentor's tools) */
  const getProgress = useCallback(() => progressRef.current, []);

  return {
    loaded,
    getProgress,
    level,
    progress,
    quizLog,
    activity,
    streak,
    mentorMessages,
    plan,
    achievements,
    toasts,
    totalAchievements: ACHIEVEMENTS.length,
    setLevel,
    recordQuiz,
    markKnown,
    markTierKnown,
    restoreSkill,
    resetSkill,
    savePlan,
    countMentorMessage,
    logActivity: bumpActivity,
    dismissToast,
  };
}

export type Learner = ReturnType<typeof useLearner>;
