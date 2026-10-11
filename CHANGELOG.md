# Changelog

All notable changes to AI Navigator. The newest version is first.

## [3.0.0] — 2026-10-11

**Skill tree, agent mentor, achievements and stats.**

### Added
- **Skill tree:** 17 skills, from *What is AI?* to *AI agents*, each with prerequisites, free resources and a 4-question quiz. Score 80%+ to master a skill, or mark it as already known.
- **Adaptive path:** an "Up next" recommendation (failed quizzes first, then the unlocked skill closest to your level) and a suggested learning path.
- **Agent mentor:** Gemini tool calling with 5 tools: mark a skill complete (with Undo), start a quiz, open a page, save a study plan, and set your level.
- **Study plans** saved by the mentor to the dashboard, where weeks tick off as you progress.
- **14 achievements**, with pop-ups that pause while you hover over them.
- **Stats tab:** an activity heatmap, skills by level, quiz score history and a trophy shelf, each chart with a table view.
- **Unit tests** with Vitest (`npm test`).

### Changed
- The 10-item progress checklist is replaced by the skill tree. Saved progress carries over automatically.
- Roadmap ticks now follow real skill progress.
- The dashboard shows real progress, the next skill, the study plan and recent badges.
- The per-visitor limit for the server key is now 40 requests every 10 minutes, because each tool step counts as a request.

### Fixed
- Used-up Gemini quotas are no longer retried, and the error message explains what happened.

## [2.0.1] — 2026-10-10

### Fixed
- The mentor route may now run for up to 60 seconds on Vercel, so slow Gemini replies aren't cut off.

## [2.0.0] — 2026-10-10

**Rebuilt as a Next.js app.**

### Added
- Next.js 16, React 19 and TypeScript, with one component per tab.
- A `/api/mentor` server route. With `GEMINI_API_KEY` set, visitors chat without their own key, and the key never reaches the browser.
- Input validation, a per-visitor rate limit, blocking of other websites, and a 55-second timeout on the server route.
- `.env.example`, a redesigned README with screenshots, an MIT license and a `.gitignore`.

## [1.1.0] — 2026-10-10

**Single-file app: fixes and new features.**

### Added
- Dark mode, chat memory, auto-retry when Gemini is busy, a real learning streak, and a working sidebar (levels and focus areas).
- The mentor knows your level and finished topics.

### Fixed
- The API key is entered in the page instead of being hard-coded in the file.
- Retired Gemini models were replaced with `gemini-3.8-flash`.
- A broken HTML tag, progress that didn't persist, a dead Papers with Code link, and keyboard access to the cards.
- Mentor replies now display Markdown properly, and a hung request stops after 60 seconds.

## [1.0.0] — 2026-04-18

### Added
- The first version: a single `ai-navigator.html` with a dashboard, roadmap, topic explainers, a progress checklist, weekly updates and a Gemini-powered AI mentor.
