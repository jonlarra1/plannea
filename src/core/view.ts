// What the app can be looking at: one of the date "pages", or a specific
// project. These are pure types so that core rules (e.g. where a new task
// belongs) can talk about the current view without reaching up into the UI.
export type Page = "today" | "tomorrow" | "scheduled" | "unscheduled";

export type View = { kind: "page"; page: Page } | { kind: "project"; projectId: string };
