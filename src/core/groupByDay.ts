import type { Task } from "./types";

// One display bucket: a scheduled day ("YYYY-MM-DD") or null for the single
// "unscheduled" bucket that collects tasks without a date.
export interface DayBucket {
  day: string | null;
  tasks: Task[];
}

// Groups tasks into day buckets by `scheduledFor`. A lens like sortTasks:
// pure, never mutates the input, and never reorders tasks inside a bucket —
// sort first (sortTasks), then group, and the chosen order survives.
// Buckets come back oldest day first; the unscheduled bucket, if any, is
// last (decided 2026-07-13). Days with no tasks simply don't appear.
export function groupTasksByDay(tasks: Task[]): DayBucket[] {
  const byDay = new Map<string, Task[]>();
  const unscheduled: Task[] = [];

  for (const task of tasks) {
    if (task.scheduledFor === null) {
      unscheduled.push(task);
    } else {
      const bucket = byDay.get(task.scheduledFor);
      if (bucket) bucket.push(task);
      else byDay.set(task.scheduledFor, [task]);
    }
  }

  const buckets: DayBucket[] = [...byDay.keys()]
    .sort()
    .map((day) => ({ day, tasks: byDay.get(day)! }));
  if (unscheduled.length > 0) buckets.push({ day: null, tasks: unscheduled });
  return buckets;
}
