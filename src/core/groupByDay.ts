import type { Task } from "./types";

// One display bucket: a scheduled day ("YYYY-MM-DD") or null for the single
// "unscheduled" bucket that collects tasks without a date.
export interface DayBucket {
  day: string | null;
  tasks: Task[];
}

// Groups tasks into day buckets. A lens like sortTasks: pure, never mutates the
// input, and never reorders tasks inside a bucket — sort first (sortTasks), then
// group, and the chosen order survives. Buckets come back oldest day first; the
// bucket for tasks with no day (null), if any, is last (decided 2026-07-13).
// Days with no tasks simply don't appear.
//
// `dayOf` picks which date drives the grouping — `scheduledFor` by default, but
// e.g. the due day for the deadline view. It returns a "YYYY-MM-DD" string or
// null (a full timestamp is trimmed to its day by the caller).
export function groupTasksByDay(
  tasks: Task[],
  dayOf: (task: Task) => string | null = (t) => t.scheduledFor,
): DayBucket[] {
  const byDay = new Map<string, Task[]>();
  const undated: Task[] = [];

  for (const task of tasks) {
    const day = dayOf(task);
    if (day === null) {
      undated.push(task);
    } else {
      const bucket = byDay.get(day);
      if (bucket) bucket.push(task);
      else byDay.set(day, [task]);
    }
  }

  const buckets: DayBucket[] = [...byDay.keys()]
    .sort()
    .map((day) => ({ day, tasks: byDay.get(day)! }));
  if (undated.length > 0) buckets.push({ day: null, tasks: undated });
  return buckets;
}
