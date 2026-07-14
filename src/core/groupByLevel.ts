import type { Task } from "./types";

// Which priority dial to group by.
export type LevelDimension = "urgency" | "importance";

// One display bucket: a priority level (3..0) and the tasks at that level.
export interface LevelBucket {
  level: number;
  tasks: Task[];
}

// Groups tasks by their urgency or importance level, highest level first. A
// lens like groupTasksByDay: pure, never mutates the input, and never reorders
// tasks inside a bucket — sort first (sortTasks), then group, and the chosen
// order survives. Levels with no tasks simply don't appear.
export function groupTasksByLevel(tasks: Task[], dimension: LevelDimension): LevelBucket[] {
  const byLevel = new Map<number, Task[]>();

  for (const task of tasks) {
    const level = dimension === "urgency" ? task.urgency : task.importance;
    const bucket = byLevel.get(level);
    if (bucket) bucket.push(task);
    else byLevel.set(level, [task]);
  }

  return [...byLevel.keys()]
    .sort((a, b) => b - a) // highest level first
    .map((level) => ({ level, tasks: byLevel.get(level)! }));
}
