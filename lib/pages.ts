// The app's tabs. Shared by the navigation, the dashboard links and the mentor's open_page tool.

export const PAGES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "skills", label: "Skill Tree" },
  { id: "roadmap", label: "Roadmap" },
  { id: "topics", label: "Topics" },
  { id: "stats", label: "Stats" },
  { id: "mentor", label: "AI Mentor" },
  { id: "updates", label: "Updates" },
] as const;

export type PanelId = (typeof PAGES)[number]["id"];

export const PAGE_IDS = PAGES.map((p) => p.id) as PanelId[];
