import { splitFrontmatter, joinFrontmatter } from "./frontmatter";

// The domain model for a single project. One project == one markdown file.
// Tasks live under day headings ("## 2026-06-29") or a special
// "Unscheduled" heading. The order of tasks in the file IS their order;
// there are no per-task ids in the MVP.

export type TaskStatus = "open" | "done";

export interface Task {
  text: string;
  status: TaskStatus;
}

export interface DaySection {
  heading: string; // "2026-06-29" or "Unscheduled"
  tasks: Task[];
}

export type ProjectStatus = "active" | "archived";

export interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  order: number;
  days: DaySection[];
}

const HEADING_LINE = /^##\s+(.+)$/;
const TASK_LINE = /^- \[([ xX])\]\s+(.*)$/;

export function parseProject(raw: string): Project {
  const { data, body } = splitFrontmatter(raw);
  const days: DaySection[] = [];
  let current: DaySection | null = null;

  for (const line of body.split("\n")) {
    const heading = line.match(HEADING_LINE);
    if (heading) {
      current = { heading: heading[1].trim(), tasks: [] };
      days.push(current);
      continue;
    }

    const task = line.match(TASK_LINE);
    if (task && current) {
      current.tasks.push({
        status: task[1].toLowerCase() === "x" ? "done" : "open",
        text: task[2],
      });
    }
  }

  return {
    id: String(data.id ?? ""),
    title: String(data.title ?? "Untitled"),
    status: data.status === "archived" ? "archived" : "active",
    order: typeof data.order === "number" ? data.order : 0,
    days,
  };
}

export function serializeProject(project: Project): string {
  const body = project.days
    .map((day) => {
      const lines = day.tasks.map(
        (task) => `- [${task.status === "done" ? "x" : " "}] ${task.text}`,
      );
      return [`## ${day.heading}`, ...lines].join("\n");
    })
    .join("\n\n");

  return joinFrontmatter(
    {
      id: project.id,
      title: project.title,
      status: project.status,
      order: project.order,
    },
    body,
  );
}

// All edit operations return a NEW Project rather than mutating, so React
// state updates stay predictable. Each finds the target day by heading.

export function toggleTask(project: Project, dayHeading: string, taskIndex: number): Project {
  return mapDay(project, dayHeading, (day) => ({
    ...day,
    tasks: day.tasks.map((task, index) =>
      index === taskIndex
        ? { ...task, status: task.status === "done" ? "open" : "done" }
        : task,
    ),
  }));
}

export function moveTask(
  project: Project,
  dayHeading: string,
  taskIndex: number,
  direction: "up" | "down",
): Project {
  const target = taskIndex + (direction === "up" ? -1 : 1);
  return mapDay(project, dayHeading, (day) => {
    if (target < 0 || target >= day.tasks.length) {
      return day;
    }
    const tasks = [...day.tasks];
    [tasks[taskIndex], tasks[target]] = [tasks[target], tasks[taskIndex]];
    return { ...day, tasks };
  });
}

function mapDay(
  project: Project,
  dayHeading: string,
  update: (day: DaySection) => DaySection,
): Project {
  return {
    ...project,
    days: project.days.map((day) => (day.heading === dayHeading ? update(day) : day)),
  };
}
