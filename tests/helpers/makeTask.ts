import type { Task } from "../../src/core/types";

// Minimal task factory for pure-core specs: only the fields relevant to the
// behavior under test vary; everything else gets a sensible default.
let nextPosition = 0;
export function makeTask(overrides: Partial<Task> & { title: string }): Task {
  return {
    id: overrides.title,
    projectId: "p1",
    sectionId: null,
    parentId: null,
    description: null,
    status: "open",
    importance: 0,
    urgency: 0,
    scheduledFor: null,
    dueAt: null,
    position: nextPosition++,
    completedAt: null,
    isArchived: false,
    createdAt: "2026-07-07T00:00:00Z",
    updatedAt: "2026-07-07T00:00:00Z",
    ...overrides,
  };
}
