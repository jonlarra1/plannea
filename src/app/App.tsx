import { useCallback, useEffect, useMemo, useState } from "react";
import { groupTasksByDay } from "../core/groupByDay";
import { findReorderSwap } from "../core/reorder";
import type { Project, Task } from "../core/types";
import { listProjects, listTasks, setTaskStatus, swapTaskPositions } from "../data/repo";
import { seedWelcomeProjectIfEmpty } from "../data/seed";
import { Sidebar } from "../components/Sidebar";
import { MainView } from "../components/MainView";
import { longDate, todayIso, tomorrowIso } from "./dates";
import { type Page, type View } from "./view";
import { logError, logInfo } from "./logging";

// The shell owns navigation (which page/project is shown), the loaded data
// (all projects + all their tasks), and the theme. The sidebar picks a view;
// the main pane renders the tasks that view selects, grouped by day. Data comes
// from repo.ts; components stay presentational.
//
// NOTE (design pass, 2026-07-13): the pages filter the ALREADY-loaded tasks
// client-side. Making them robust cross-project lenses (sorting, empty states)
// is the near-future task in ROADMAP 2.4.1.

// One-time startup, guarded so React 19 StrictMode's double mount can't double-seed.
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

function initialTheme(): "light" | "dark" {
  const saved = localStorage.getItem("plannea-theme");
  return saved === "dark" ? "dark" : "light";
}

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<View>({ kind: "page", page: "today" });
  const [theme, setTheme] = useState<"light" | "dark">(initialTheme);

  // Apply + persist the theme by stamping it on the root element.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("plannea-theme", theme);
  }, [theme]);

  // Reload every task across every project (the pages need a cross-project view).
  const reloadTasks = useCallback(async (loaded: Project[]): Promise<void> => {
    try {
      const perProject = await Promise.all(loaded.map((p) => listTasks(p.id)));
      setTasks(perProject.flat());
    } catch (err) {
      void logError(`failed to load tasks: ${String(err)}`);
    }
  }, []);

  // Startup: seed if needed, load projects, then load their tasks.
  useEffect(() => {
    let cancelled = false;
    bootstrapOnce()
      .then((loaded) => {
        if (cancelled) return;
        setProjects(loaded);
        void logInfo(`loaded ${loaded.length} project(s)`);
        return reloadTasks(loaded);
      })
      .catch((err) => void logError(`failed to start: ${String(err)}`));
    return () => {
      cancelled = true;
    };
  }, [reloadTasks]);

  const today = todayIso();
  const tomorrow = tomorrowIso();

  // Tasks the current view selects (a date lens, or one project).
  const viewTasks = useMemo(() => {
    if (view.kind === "project") return tasks.filter((t) => t.projectId === view.projectId);
    switch (view.page) {
      case "today":
        return tasks.filter((t) => t.scheduledFor === today);
      case "tomorrow":
        return tasks.filter((t) => t.scheduledFor === tomorrow);
      case "scheduled":
        return tasks.filter((t) => t.scheduledFor !== null);
      case "unscheduled":
        return tasks.filter((t) => t.scheduledFor === null);
    }
  }, [tasks, view, today, tomorrow]);

  const days = useMemo(() => groupTasksByDay(viewTasks), [viewTasks]);

  const counts = useMemo<Record<Page, number>>(
    () => ({
      today: tasks.filter((t) => t.scheduledFor === today).length,
      tomorrow: tasks.filter((t) => t.scheduledFor === tomorrow).length,
      scheduled: tasks.filter((t) => t.scheduledFor !== null).length,
      unscheduled: tasks.filter((t) => t.scheduledFor === null).length,
    }),
    [tasks, today, tomorrow],
  );

  async function handleToggle(taskId: string): Promise<void> {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      await setTaskStatus(taskId, task.status === "done" ? "open" : "done");
      await reloadTasks(projects);
    } catch (err) {
      void logError(`failed to toggle task ${taskId}: ${String(err)}`);
    }
  }

  async function handleMove(
    dayTasks: Task[],
    taskId: string,
    direction: "up" | "down",
  ): Promise<void> {
    const swap = findReorderSwap(dayTasks, taskId, direction);
    if (!swap) return;
    try {
      await swapTaskPositions(swap[0].id, swap[1].id);
      await reloadTasks(projects);
    } catch (err) {
      void logError(`failed to move task ${taskId}: ${String(err)}`);
    }
  }

  // Header text + empty message for the current view.
  const { title, subtitle, emptyNote } = describeView(view, projects, today, tomorrow, counts);

  // On the cross-project pages, label each task with its project; inside a
  // single project's view that label is redundant, so show none.
  const projectNameById = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects],
  );
  const projectNameFor = useCallback(
    (task: Task): string | null =>
      view.kind === "project" ? null : projectNameById.get(task.projectId) ?? null,
    [view, projectNameById],
  );

  return (
    <div className="app">
      <Sidebar
        view={view}
        projects={projects}
        counts={counts}
        theme={theme}
        onSelectPage={(page) => setView({ kind: "page", page })}
        onSelectProject={(projectId) => setView({ kind: "project", projectId })}
        onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
      />
      <MainView
        title={title}
        subtitle={subtitle}
        days={days}
        // Day headings only where a view spans multiple days; on Today/Tomorrow/
        // Unscheduled the page title already names the day, so they'd just repeat it.
        showDayHeadings={view.kind === "project" || (view.kind === "page" && view.page === "scheduled")}
        reorderable={view.kind === "project"} // manual order only within a project
        projectNameFor={projectNameFor}
        emptyNote={emptyNote}
        onToggle={(taskId) => void handleToggle(taskId)}
        onMove={(dayTasks, taskId, direction) => void handleMove(dayTasks, taskId, direction)}
      />
    </div>
  );
}

function describeView(
  view: View,
  projects: Project[],
  today: string,
  tomorrow: string,
  counts: Record<Page, number>,
): { title: string; subtitle: string; emptyNote: string } {
  if (view.kind === "project") {
    const project = projects.find((p) => p.id === view.projectId);
    return {
      title: project?.name ?? "Project",
      subtitle: "Project",
      emptyNote: "No tasks in this project yet.",
    };
  }
  switch (view.page) {
    case "today":
      return { title: "Today", subtitle: longDate(today), emptyNote: "Nothing scheduled for today." };
    case "tomorrow":
      return { title: "Tomorrow", subtitle: longDate(tomorrow), emptyNote: "Nothing scheduled for tomorrow." };
    case "scheduled":
      return {
        title: "Scheduled",
        subtitle: `${counts.scheduled} task${counts.scheduled === 1 ? "" : "s"} with a date`,
        emptyNote: "No scheduled tasks.",
      };
    case "unscheduled":
      return {
        title: "Unscheduled",
        subtitle: `${counts.unscheduled} task${counts.unscheduled === 1 ? "" : "s"} without a date`,
        emptyNote: "Nothing here — every task has a date.",
      };
  }
}
