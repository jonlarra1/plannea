import type { Task } from "./types";

// How a task list can be viewed. "manual" is the stored truth — the user's
// hand-arranged positions. The other modes are lenses: they change how the
// list is SHOWN, never what is stored, and ties fall back to the manual
// order (decided 2026-07-07).
export type TaskSortMode = "manual" | "deadline" | "urgency" | "importance";

const byManual = (a: Task, b: Task): number =>
  a.position - b.position || a.createdAt.localeCompare(b.createdAt);

// Secondary keys (decided 2026-07-14): within one urgency level, the more
// important task wins, and vice-versa — so a group of equally-urgent tasks
// reads in importance order (and equally-important tasks in urgency order).
const byImportanceThenManual = (a: Task, b: Task): number =>
  b.importance - a.importance || byManual(a, b);

const byDeadline = (a: Task, b: Task): number => {
  if (a.dueAt === null && b.dueAt === null) return byImportanceThenManual(a, b);
  if (a.dueAt === null) return 1; // no deadline sinks to the bottom
  if (b.dueAt === null) return -1;
  // same deadline → order by importance (urgency already tracks the deadline)
  return a.dueAt.localeCompare(b.dueAt) || byImportanceThenManual(a, b);
};

const comparators: Record<TaskSortMode, (a: Task, b: Task) => number> = {
  manual: byManual,
  deadline: byDeadline,
  urgency: (a, b) => b.urgency - a.urgency || byImportanceThenManual(a, b),
  importance: (a, b) => b.importance - a.importance || b.urgency - a.urgency || byManual(a, b),
};

// Returns a new ordered list; the input array is never mutated.
export function sortTasks(tasks: Task[], mode: TaskSortMode): Task[] {
  return [...tasks].sort(comparators[mode]);
}
