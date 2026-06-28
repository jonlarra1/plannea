import type { Project } from "../core/project";
import { DaySectionView } from "./DaySectionView";

interface ProjectViewProps {
  project: Project;
  onToggle: (dayHeading: string, taskIndex: number) => void;
  onMove: (dayHeading: string, taskIndex: number, direction: "up" | "down") => void;
}

export function ProjectView({ project, onToggle, onMove }: ProjectViewProps) {
  return (
    <main className="project">
      <h2 className="project__title">{project.title}</h2>
      {project.days.map((day) => (
        <DaySectionView
          key={day.heading}
          day={day}
          onToggle={(taskIndex) => onToggle(day.heading, taskIndex)}
          onMove={(taskIndex, direction) => onMove(day.heading, taskIndex, direction)}
        />
      ))}
    </main>
  );
}
