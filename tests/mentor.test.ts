import { describe, expect, it } from "vitest";
import { formatReply } from "@/lib/formatReply";
import { buildSystemPrompt, trimHistory, type Content } from "@/lib/mentor";
import { MENTOR_TOOLS } from "@/lib/mentorTools";
import { sanitizePlan } from "@/lib/plan";
import { SKILLS, applyQuizResult } from "@/lib/skills";

const user = (text: string): Content => ({ role: "user", parts: [{ text }] });
const model = (text: string): Content => ({ role: "model", parts: [{ text }] });
const call: Content = { role: "model", parts: [{ functionCall: { name: "set_level", args: { level: "advanced" } } }] };
const result: Content = { role: "user", parts: [{ functionResponse: { name: "set_level", response: { ok: true } } }] };

describe("mentor prompt", () => {
  it("lists every skill with its status, and the learner's weak spots", () => {
    const progress = applyQuizResult({}, "python", 25, new Date());
    const prompt = buildSystemPrompt({ level: "beginner", progress, streak: 3 });
    for (const s of SKILLS) expect(prompt).toContain(`- ${s.id}: ${s.title}`);
    expect(prompt).toContain("python: Python basics [beginner] — attempted, best quiz 25%");
    expect(prompt).toContain("Weak spots (failed quizzes): python");
    expect(prompt).toContain("Recommended next skill: python");
  });

  it("ignores junk in the learner profile", () => {
    const prompt = buildSystemPrompt({ level: "wizard", progress: { evil: { done: true } } as never, streak: -5 });
    expect(prompt).toContain("Chosen level: beginner");
    expect(prompt).toContain("Daily streak: 0 day(s)");
    expect(prompt).not.toContain("evil");
  });
});

describe("mentor tools", () => {
  it("declares five tools whose skill enums match the skill tree", () => {
    expect(MENTOR_TOOLS.map((t) => t.name)).toEqual([
      "mark_skill_complete",
      "start_quiz",
      "open_page",
      "save_study_plan",
      "set_level",
    ]);
    const skillEnum = (MENTOR_TOOLS[0].parameters.properties as { skill_id: { enum: string[] } }).skill_id.enum;
    expect(skillEnum).toEqual(SKILLS.map((s) => s.id));
  });
});

describe("trimHistory", () => {
  it("keeps short conversations as they are", () => {
    const h = [user("a"), model("b")];
    expect(trimHistory(h, 10)).toBe(h);
  });

  it("never starts with a tool call or a tool result", () => {
    const h = [user("a"), call, result, model("ok"), user("b"), model("c")];
    const trimmed = trimHistory(h, 4); // naive cut would start at `result`
    expect(trimmed[0]).toEqual(user("b"));
    expect(trimmed).toHaveLength(2);
  });
});

describe("sanitizePlan", () => {
  it("keeps valid weeks and skills, drops the rest", () => {
    const plan = sanitizePlan({
      title: "  4-week path  ",
      weeks: [
        { week: 9, focus: "Basics", skill_ids: ["python", "not-a-skill", "python"] },
        { week: 2, focus: "", skill_ids: [] },
        "junk",
        { focus: "ML", skill_ids: ["ml-basics"] },
      ],
    });
    expect(plan?.title).toBe("4-week path");
    expect(plan?.weeks).toEqual([
      { week: 1, focus: "Basics", skillIds: ["python"] },
      { week: 2, focus: "ML", skillIds: ["ml-basics"] },
    ]);
  });

  it("rejects plans with nothing usable", () => {
    expect(sanitizePlan({ title: "x", weeks: [] })).toBeNull();
    expect(sanitizePlan(null)).toBeNull();
  });
});

describe("formatReply", () => {
  it("formats Markdown and escapes HTML", () => {
    const html = formatReply('**bold** and *it* <img src=x onerror="alert(1)"> [x](javascript:alert(1)) [ok](https://a.dev)');
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>it</em>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain('href="javascript');
    expect(html).toContain('<a href="https://a.dev" target="_blank" rel="noopener">ok</a>');
  });
});
