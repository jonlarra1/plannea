// The sidebar's page list. The View/Page TYPES live in core/ (pure), so core
// rules can use them; this file adds the UI side — the pages and their labels.
export type { Page, View } from "../core/view";
import type { Page } from "../core/view";

export const PAGES: { key: Page; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "scheduled", label: "Scheduled" },
  { key: "unscheduled", label: "Unscheduled" },
];
