import type { View } from "./view";

// Where a new task belongs, and where the row that creates it appears. Both are
// decisions, not rendering, so they live here: the UI asks and obeys.
// Rules agreed with the user on 2026-08-03 — see the roadmap's 2.5 "Add task".

export interface NewTaskTarget {
  projectId: string;
  sectionId: string | null;
  scheduledFor: string | null;
}

export interface AddTaskContext {
  today: string; // "YYYY-MM-DD"
  tomorrow: string;
  inboxProjectId: string; // home for tasks that belong to no project in particular
}

// The task a row would create, or null where adding isn't offered.
// `sectionId` is the section the row sits in — only meaningful inside a project.
export function newTaskTarget(
  view: View,
  sectionId: string | null,
  ctx: AddTaskContext,
): NewTaskTarget | null {
  if (view.kind === "project") {
    return { projectId: view.projectId, sectionId, scheduledFor: null };
  }
  // A page has no sections of its own, so any section id is dropped here.
  const inbox = (scheduledFor: string | null): NewTaskTarget => ({
    projectId: ctx.inboxProjectId,
    sectionId: null,
    scheduledFor,
  });
  switch (view.page) {
    case "today":
      return inbox(ctx.today);
    case "tomorrow":
      return inbox(ctx.tomorrow);
    case "unscheduled":
      return inbox(null);
    case "scheduled":
      // Many days at once: there is no honest date to give the task, so the row
      // waits until it can carry a date of its own (roadmap 2.5).
      return null;
  }
}

export type AddRowPlacement =
  | "in-groups" // one row per group — a project's sections
  | "at-end" // a single row after everything
  | "none";

// Where to draw the add row. `groupCount` matters only for a project: with no
// groups there is nothing to put a row inside, so it falls to the end.
export function addRowPlacement(view: View, groupCount: number): AddRowPlacement {
  if (view.kind === "project") return groupCount === 0 ? "at-end" : "in-groups";
  return view.page === "scheduled" ? "none" : "at-end";
}
