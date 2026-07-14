import { useCallback, useEffect, useMemo, useState } from "react";
import { groupTasksByDay } from "../core/groupByDay";
import { groupTasksBySection } from "../core/groupBySection";
import { findReorderSwap } from "../core/reorder";
import { sortTasks, type TaskSortMode } from "../core/sortTasks";
import type { Project, Section, Task } from "../core/types";
import { listProjects, listSections, listTasks, setTaskStatus, swapTaskPositions } from "../data/repo";
import { seedWelcomeProjectIfEmpty } from "../data/seed";
import { Sidebar } from "../components/Sidebar";
import { MainView, type RenderGroup } from "../components/MainView";
import { formatDayHeading, longDate, todayIso, tomorrowIso } from "./dates";
import { type Page, type View } from "./view";
import { logError, logInfo } from "./logging";

// The shell owns navigation (which page/project is shown), the loaded data
// (all projects, their tasks and sections), and the theme. The sidebar picks a
// view; the main pane renders that view's tasks — grouped by DAY on the date
// pages, and by SECTION inside a project. Data comes from repo.ts; components
// stay presentational.
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
  const [sections, setSections] = useState<Section[]>([]);
  const [view, setView] = useState<View>({ kind: "page", page: "today" });
  const [theme, setTheme] = useState<"light" | "dark">(initialTheme);
  // How the date pages order their tasks (default: most urgent first). The
  // project view ignores this — it stays in stored manual order (see below).
  const [sortMode, setSortMode] = useState<TaskSortMode>("urgency");

  // Apply + persist the theme by stamping it on the root element.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("plannea-theme", theme);
  }, [theme]);

  // Reload every task + section across every project (pages need a cross-project
  // view; the project view needs that project's sections).
  const reloadData = useCallback(async (loaded: Project[]): Promise<void> => {
    try {
      const [perProjectTasks, perProjectSections] = await Promise.all([
        Promise.all(loaded.map((p) => listTasks(p.id))),
        Promise.all(loaded.map((p) => listSections(p.id))),
      ]);
      setTasks(perProjectTasks.flat());
      setSections(perProjectSections.flat());
    } catch (err) {
      void logError(`failed to load data: ${String(err)}`);
    }
  }, []);

  // Startup: seed if needed, load projects, then load their tasks + sections.
  useEffect(() => {
    let cancelled = false;
    bootstrapOnce()
      .then((loaded) => {
        if (cancelled) return;
        setProjects(loaded);
        void logInfo(`loaded ${loaded.length} project(s)`);
        return reloadData(loaded);
      })
      .catch((err) => void logError(`failed to start: ${String(err)}`));
    return () => {
      cancelled = true;
    };
  }, [reloadData]);

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

  // Build the groups to render: by SECTION inside a project, by DAY on the
  // date pages. Both resolve to the same RenderGroup shape.
  const groups = useMemo<RenderGroup[]>(() => {
    if (view.kind === "project") {
      const projectSections = sections.filter((s) => s.projectId === view.projectId);
      return groupTasksBySection(viewTasks, projectSections).map((bucket) => ({
        key: bucket.sectionId ?? "__loose",
        // loose tasks (no section) render at the top with no heading
        heading:
          bucket.sectionId === null
            ? ""
            : projectSections.find((s) => s.id === bucket.sectionId)?.name ?? "Section",
        showHeading: bucket.sectionId !== null,
        accent: false,
        tasks: bucket.tasks,
      }));
    }
    // Single-day pages (Today/Tomorrow/Unscheduled) don't repeat the day in a
    // heading — the page title already says it; Scheduled spans days, so it does.
    const showHeadings = view.page === "scheduled";
    // filter → SORT → group: pages open in a chosen order (default urgency),
    // then split into day buckets so each bucket is internally sorted.
    return groupTasksByDay(sortTasks(viewTasks, sortMode)).map((bucket) => {
      const { text, isToday } = formatDayHeading(bucket.day);
      return {
        key: bucket.day ?? "__unscheduled",
        heading: text,
        showHeading: showHeadings,
        accent: isToday,
        tasks: bucket.tasks,
      };
    });
  }, [view, viewTasks, sections, sortMode]);

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
      await reloadData(projects);
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
      await reloadData(projects);
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
        groups={groups}
        reorderable={view.kind === "project"} // manual order only within a project
        showCompletedToggle={view.kind === "project"}
        showSort={view.kind === "page"} // sorting is a page lens; projects stay manual
        sortMode={sortMode}
        onSortChange={setSortMode}
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
