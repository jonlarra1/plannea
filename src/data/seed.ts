import { countAllProjects, createProject, createTask } from "./repo";

// First-run convenience (decided 2026-07-13): if the database has never held a
// project, create a small "Welcome to plannea" project so the app has
// something to show and the user can try toggling and reordering before the
// create-task UI exists (roadmap 2.5). Guarded on the RAW project count, so it
// runs exactly once in a database's life — archiving or completing the welcome
// project later must not bring it back.
export async function seedWelcomeProjectIfEmpty(): Promise<void> {
  if ((await countAllProjects()) > 0) return;

  const project = await createProject({
    name: "Welcome to plannea",
    description: "A sample project so you can try things out. Delete it whenever you like.",
  });

  const today = isoDay(new Date());
  const tomorrow = isoDay(addDays(new Date(), 1));

  // A couple of dated days plus one undated task, so every kind of day bucket
  // (including the "unscheduled" one) shows up.
  await createTask({ projectId: project.id, title: "Check off this task", scheduledFor: today });
  await createTask({ projectId: project.id, title: "Reorder me with the arrows", scheduledFor: today });
  await createTask({ projectId: project.id, title: "Plan something for tomorrow", scheduledFor: tomorrow });
  await createTask({ projectId: project.id, title: "An idea with no date yet" });
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}
