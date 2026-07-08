import type { Task } from "./types";

// Reordering = swapping places with your visible neighbor (decided
// 2026-07-08). This function only DECIDES which two tasks swap; the data
// layer performs the swap. `tasks` is the group as displayed in manual view
// (lenses hide reordering entirely). Returns [task, neighbor], or null when
// the move is impossible (at an edge, or the id is not in the group).
export function findReorderSwap(
  tasks: Task[],
  id: string,
  direction: "up" | "down",
): [Task, Task] | null {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const neighborIndex = direction === "up" ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= tasks.length) return null;

  return [tasks[index], tasks[neighborIndex]];
}
