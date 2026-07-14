import type { TaskSortMode } from "../core/sortTasks";
import type { Task } from "../core/types";
import { TaskGroupView } from "./TaskGroupView";

// A group ready to render: a day bucket or a section, already resolved to a
// heading by the parent (App). This keeps MainView agnostic about whether it's
// showing dates or sections.
export interface RenderGroup {
  key: string;
  heading: string;
  showHeading: boolean;
  accent: boolean;
  tasks: Task[];
}

interface MainViewProps {
  title: string;
  subtitle: string;
  groups: RenderGroup[];
  reorderable: boolean;
  showCompletedToggle: boolean; // only in a project view (where completed tasks matter)
  showSort: boolean; // sort control only on the date pages (projects stay manual)
  sortMode: TaskSortMode;
  onSortChange: (mode: TaskSortMode) => void;
  projectNameFor: (task: Task) => string | null;
  emptyNote: string;
  onToggle: (taskId: string) => void;
  onMove: (dayTasks: Task[], taskId: string, direction: "up" | "down") => void;
}

export function MainView({
  title,
  subtitle,
  groups,
  reorderable,
  showCompletedToggle,
  showSort,
  sortMode,
  onSortChange,
  projectNameFor,
  emptyNote,
  onToggle,
  onMove,
}: MainViewProps) {
  return (
    <main className="main">
      <header className="page-header">
        <div className="page-header__titles">
          <h2 className="page-header__title">{title}</h2>
          <span className="page-header__subtitle">{subtitle}</span>
        </div>
        <div className="page-header__controls">
          {/* still a placeholder — wired in the completed-tasks slice */}
          {showCompletedToggle && (
            <span className="pill is-placeholder" title="Show completed tasks — coming soon">
              Show completed
            </span>
          )}
          {showSort && (
            <label className="sort-select">
              Sort:
              <select
                value={sortMode}
                onChange={(e) => onSortChange(e.target.value as TaskSortMode)}
                aria-label="Sort tasks"
              >
                <option value="urgency">Urgency</option>
                <option value="importance">Importance</option>
                <option value="deadline">Deadline</option>
              </select>
            </label>
          )}
        </div>
      </header>

      <div className="page-body">
        {groups.length === 0 ? (
          <p className="empty-note">{emptyNote}</p>
        ) : (
          groups.map((group) => (
            <TaskGroupView
              key={group.key}
              heading={group.heading}
              showHeading={group.showHeading}
              accent={group.accent}
              tasks={group.tasks}
              reorderable={reorderable}
              projectNameFor={projectNameFor}
              onToggle={onToggle}
              onMove={(taskId, direction) => onMove(group.tasks, taskId, direction)}
            />
          ))
        )}
      </div>
    </main>
  );
}
