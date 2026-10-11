"use client";

import { useEffect, useRef, useState } from "react";
import { PASS_MARK, type Skill } from "@/lib/skills";

/** Random order of option indexes, so the right answer isn't always in the same place. */
function shuffledOrders(skill: Skill): number[][] {
  return skill.quiz.map((q) => {
    const order = q.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  });
}

interface Props {
  skill: Skill;
  previousBest: number | null;
  onComplete: (score: number) => void;
  onClose: () => void;
}

export default function QuizDialog({ skill, previousBest, onComplete, onClose }: Props) {
  const [bestBefore, setBestBefore] = useState(previousBest); // the best before this attempt, not after
  const [orders, setOrders] = useState(() => shuffledOrders(skill));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const firstOption = useRef<HTMLButtonElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  const total = skill.quiz.length;
  const question = skill.quiz[index];

  // Close with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Move keyboard focus to where the learner needs it next
  useEffect(() => {
    if (score !== null) closeButton.current?.focus();
    else if (picked === null) firstOption.current?.focus();
    else nextButton.current?.focus();
  }, [index, picked, score]);

  function choose(option: number) {
    if (picked !== null) return;
    setPicked(option);
    if (option === question.answer) setCorrect((c) => c + 1);
  }

  function next() {
    if (index + 1 < total) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    const final = Math.round((correct / total) * 100);
    setScore(final);
    onComplete(final);
  }

  function retry() {
    if (score !== null) setBestBefore((b) => Math.max(b ?? 0, score));
    setOrders(shuffledOrders(skill));
    setIndex(0);
    setPicked(null);
    setCorrect(0);
    setScore(null);
  }

  const passed = score !== null && score >= PASS_MARK;

  return (
    <div className="modal-backdrop">
      <div className="modal quiz" role="dialog" aria-modal="true" aria-labelledby="quiz-title">
        <div className="modal-head">
          <div>
            <div className="card-sub">Skill quiz · pass with {PASS_MARK}%</div>
            <h2 id="quiz-title" className="card-title">
              {skill.emoji} {skill.title}
            </h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close quiz">
            ✕
          </button>
        </div>

        {score === null ? (
          <>
            <div className="quiz-progress" aria-hidden="true">
              {skill.quiz.map((_, i) => (
                <span key={i} className={i < index ? "seg done" : i === index ? "seg now" : "seg"} />
              ))}
            </div>
            <div className="card-sub">
              Question {index + 1} of {total}
            </div>
            <p className="quiz-q">{question.q}</p>
            <div className="quiz-options">
              {orders[index].map((optionIndex, i) => {
                const isAnswer = optionIndex === question.answer;
                const state =
                  picked === null ? "" : isAnswer ? " right" : optionIndex === picked ? " wrong" : " dim";
                return (
                  <button
                    key={optionIndex}
                    ref={i === 0 ? firstOption : undefined}
                    className={`quiz-option${state}`}
                    onClick={() => choose(optionIndex)}
                    disabled={picked !== null}
                    aria-pressed={picked === optionIndex}
                  >
                    <span className="quiz-letter">{String.fromCharCode(65 + i)}</span>
                    {question.options[optionIndex]}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className={`quiz-feedback ${picked === question.answer ? "ok" : "bad"}`} role="status">
                <strong>{picked === question.answer ? "✅ Correct!" : "❌ Not quite."}</strong> {question.explain}
              </div>
            )}
            <div className="modal-actions">
              <button ref={nextButton} className="btn primary" onClick={next} disabled={picked === null}>
                {index + 1 < total ? "Next question →" : "See my score"}
              </button>
            </div>
          </>
        ) : (
          <div className="quiz-result" role="status">
            <div className={`quiz-score ${passed ? "ok" : "bad"}`}>{score}%</div>
            <p>
              {passed
                ? `🎉 Skill mastered! You got ${correct} of ${total} right.`
                : `You got ${correct} of ${total} right. You need ${PASS_MARK}% to master this skill — review the resources and try again.`}
            </p>
            {bestBefore !== null && <p className="card-sub">Previous best: {bestBefore}%</p>}
            <div className="modal-actions">
              <button className="btn" onClick={retry}>
                Try again
              </button>
              <button ref={closeButton} className="btn primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
