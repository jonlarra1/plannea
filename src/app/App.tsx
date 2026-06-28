import { useEffect, useState } from "react";
import { type Project, toggleTask, moveTask } from "../core/project";
import { listProjects, saveProject } from "../data/projectsRepo";
import { Sidebar } from "../components/Sidebar";
import { ProjectView } from "../components/ProjectView";

// The shell owns the only state that more than one component needs: the list
// of projects and which one is selected. Everything below it is presentational
// and receives data + callbacks as props.

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    listProjects().then((loaded) => {
      setProjects(loaded);
      setSelectedId(loaded[0]?.id ?? null);
    });
  }, []);

  const selected = projects.find((project) => project.id === selectedId) ?? null;

  // One place computes the next project (via a pure core function) and
  // persists it. Components never call core or the repo directly.
  function applyChange(updated: Project): void {
    setProjects((previous) =>
      previous.map((project) => (project.id === updated.id ? updated : project)),
    );
    void saveProject(updated);
  }

  function handleToggle(dayHeading: string, taskIndex: number): void {
    if (!selected) return;
    applyChange(toggleTask(selected, dayHeading, taskIndex));
  }

  function handleMove(
    dayHeading: string,
    taskIndex: number,
    direction: "up" | "down",
  ): void {
    if (!selected) return;
    applyChange(moveTask(selected, dayHeading, taskIndex, direction));
  }

  return (
    <div className="layout">
      <Sidebar projects={projects} selectedId={selectedId} onSelect={setSelectedId} />
      {selected ? (
        <ProjectView project={selected} onToggle={handleToggle} onMove={handleMove} />
      ) : (
        <main className="project project--empty">
          <p>No project selected.</p>
        </main>
      )}
    </div>
  );
}
