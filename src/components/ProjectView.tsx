import type { DayBucket } from "../core/groupByDay";
import type { Project, Task } from "../core/types";
import { DaySectionView } from "./DaySectionView";

interface ProjectViewProps {
  project: Project;
  days: DayBucket[];
  onToggle: (taskId: string) => void;
  // The day's tasks come along so reordering swaps a task with its visible
  // neighbor WITHIN that day (decided 2026-07-08).
  onMove: (dayTasks: Task[], taskId: string, direction: "up" | "down") => void;
}

export function ProjectView({ project, days, onToggle, onMove }: ProjectViewProps) {
  return (
    <main className="project">
      <h2 className="project__title">{project.name}</h2>
      {days.map((day) => (
        <DaySectionView
          key={day.day ?? "unscheduled"}
          day={day}
          onToggle={onToggle}
          onMove={(taskId, direction) => onMove(day.tasks, taskId, direction)}
        />
      ))}
    </main>
  );
}
