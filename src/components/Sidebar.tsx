import type { Project } from "../core/types";
import { type Page, PAGES, type View } from "../app/view";
import type { ThemeChoice } from "../app/theme";

interface SidebarProps {
  view: View;
  projects: Project[];
  counts: Record<Page, number>;
  themeChoice: ThemeChoice;
  onSelectPage: (page: Page) => void;
  onSelectProject: (id: string) => void;
  onCycleTheme: () => void;
}

// The theme button names the choice that is ACTIVE (not the one a click leads
// to), so "System theme" can be shown honestly.
const THEME_LABELS: Record<ThemeChoice, string> = {
  light: "☀ Light theme",
  dark: "🌙 Dark theme",
  system: "◐ System theme", // half light / half dark — the usual "auto" mark
};

export function Sidebar({
  view,
  projects,
  counts,
  themeChoice,
  onSelectPage,
  onSelectProject,
  onCycleTheme,
}: SidebarProps) {
  const pageActive = (page: Page) => view.kind === "page" && view.page === page;

  return (
    <nav className="sidebar">
      <h1 className="sidebar__brand">plannea</h1>

      <div className="nav-group">
        <p className="nav-group__label">Pages</p>
        {PAGES.map(({ key, label }) => (
          <button
            key={key}
            className={`nav-item ${pageActive(key) ? "nav-item--active" : ""}`}
            onClick={() => onSelectPage(key)}
          >
            <span className="nav-item__dot" />
            {label}
            {counts[key] > 0 && <span className="nav-item__count">{counts[key]}</span>}
          </button>
        ))}
        {/* inactive placeholder — calendar view comes last */}
        <button className="nav-item nav-item--placeholder" title="Calendar — coming later">
          <span className="nav-item__dot" />
          Calendar
          <span className="nav-item__soon">soon</span>
        </button>
      </div>

      <div className="nav-group">
        <p className="nav-group__label">Projects</p>
        {projects.map((project) => (
          <button
            key={project.id}
            className={`nav-item ${
              view.kind === "project" && view.projectId === project.id ? "nav-item--active" : ""
            }`}
            onClick={() => onSelectProject(project.id)}
          >
            <span className="nav-item__dot" />
            {project.name}
          </button>
        ))}
        {/* inactive placeholder — creating projects comes in roadmap 2.5 */}
        <button className="nav-item nav-item--placeholder nav-add" title="New project — coming soon">
          <span className="add-task__plus">+</span> new project
        </button>
      </div>

      <div className="sidebar__spacer" />

      <div className="sidebar__footer">
        <button className="theme-toggle" onClick={onCycleTheme} title="Switch theme">
          {THEME_LABELS[themeChoice]}
        </button>
      </div>
    </nav>
  );
}
