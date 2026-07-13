import type { Project } from "../core/types";

interface SidebarProps {
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function Sidebar({ projects, selectedId, onSelect }: SidebarProps) {
  return (
    <nav className="sidebar">
      <h1 className="sidebar__brand">plannea</h1>
      <ul className="sidebar__list">
        {projects.map((project) => (
          <li key={project.id}>
            <button
              className={`sidebar__item ${
                project.id === selectedId ? "sidebar__item--active" : ""
              }`}
              onClick={() => onSelect(project.id)}
            >
              {project.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
