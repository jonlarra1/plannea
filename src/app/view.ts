// What the sidebar can point at: one of the date "pages", or a specific project.
export type Page = "today" | "tomorrow" | "scheduled" | "unscheduled";

export type View = { kind: "page"; page: Page } | { kind: "project"; projectId: string };

export const PAGES: { key: Page; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "scheduled", label: "Scheduled" },
  { key: "unscheduled", label: "Unscheduled" },
];
