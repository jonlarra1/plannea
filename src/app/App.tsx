import { useCallback, useEffect, useState } from "react";
import { groupTasksByDay } from "../core/groupByDay";
import { findReorderSwap } from "../core/reorder";
import type { Project, Task } from "../core/types";
import { listProjects, listTasks, setTaskStatus, swapTaskPositions } from "../data/repo";
import { seedWelcomeProjectIfEmpty } from "../data/seed";
import { Sidebar } from "../components/Sidebar";
import { ProjectView } from "../components/ProjectView";
import { logError, logInfo } from "./logging";

// The shell owns the state more than one component needs: the project list,
// which project is selected, and that project's tasks. Projects and tasks are
// separate queries against the database (via repo.ts) — the shell keeps them in
// sync. Components stay presentational: they receive data + callbacks and never
// touch the database or core directly.

// One-time startup (seed the welcome project, then load the list). Held at
// module scope as a single shared promise so it runs EXACTLY once per page
// load: React 19 StrictMode invokes mount effects twice in dev, and the seed
// is not idempotent — without this guard both invocations race the emptiness
// check and create duplicate welcome projects. A real page reload makes a new
// module (promise reset), but by then the DB is non-empty so the seed no-ops.
let bootstrap: Promise<Project[]> | null = null;
function bootstrapOnce(): Promise<Project[]> {
  if (!bootstrap) {
    bootstrap = (async () => {
      await seedWelcomeProjectIfEmpty();
      return listProjects();
    })();
  }
  return bootstrap;
}

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load the project list once, seeding a welcome project on a brand-new DB.
  useEffect(() => {
    let cancelled = false;
    bootstrapOnce()
      .then((loaded) => {
        if (cancelled) return;
        setProjects(loaded);
        setSelectedId((current) => current ?? loaded[0]?.id ?? null);
        void logInfo(`loaded ${loaded.length} project(s)`);
      })
      .catch((err) => void logError(`failed to load projects: ${String(err)}`));
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-read the selected project's tasks from the database. Every edit calls
  // this afterwards, so the screen always mirrors what is actually stored
  // (the DB is the source of truth — no optimistic in-memory updates).
  const reloadTasks = useCallback(async (projectId: string): Promise<void> => {
    try {
      setTasks(await listTasks(projectId));
    } catch (err) {
      void logError(`failed to load tasks for project ${projectId}: ${String(err)}`);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void reloadTasks(selectedId);
    else setTasks([]);
  }, [selectedId, reloadTasks]);

  const selected = projects.find((project) => project.id === selectedId) ?? null;
  const days = groupTasksByDay(tasks);

  async function handleToggle(taskId: string): Promise<void> {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !selectedId) return;
    try {
      await setTaskStatus(taskId, task.status === "done" ? "open" : "done");
      await reloadTasks(selectedId);
    } catch (err) {
      void logError(`failed to toggle task ${taskId}: ${String(err)}`);
    }
  }

  async function handleMove(
    dayTasks: Task[],
    taskId: string,
    direction: "up" | "down",
  ): Promise<void> {
    if (!selectedId) return;
    const swap = findReorderSwap(dayTasks, taskId, direction);
    if (!swap) return; // at an edge — nothing to do
    try {
      await swapTaskPositions(swap[0].id, swap[1].id);
      await reloadTasks(selectedId);
    } catch (err) {
      void logError(`failed to move task ${taskId}: ${String(err)}`);
    }
  }

  return (
    <div className="layout">
      <Sidebar projects={projects} selectedId={selectedId} onSelect={setSelectedId} />
      {selected ? (
        <ProjectView
          project={selected}
          days={days}
          onToggle={(taskId) => void handleToggle(taskId)}
          onMove={(dayTasks, taskId, direction) => void handleMove(dayTasks, taskId, direction)}
        />
      ) : (
        <main className="project project--empty">
          <p>No project selected.</p>
        </main>
      )}
    </div>
  );
}
