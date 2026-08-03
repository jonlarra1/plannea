import type { TaskSortMode } from "../core/sortTasks";
import type { Task } from "../core/types";
import { AddTaskRow } from "./AddTaskRow";
import { SortMenu } from "./SortMenu";
import { TaskGroupView } from "./TaskGroupView";
import type { PriorityTag } from "./TaskItem";

// A group ready to render: a day bucket or a section, already resolved to a
// heading by the parent (App). This keeps MainView agnostic about whether it's
// showing dates or sections.
export interface RenderGroup {
  key: string;
  heading: string;
  showHeading: boolean;
  accent: boolean;
  level?: number; // priority level (0..3) — colours a level-group heading
  sectionId?: string | null; // set on a project's section groups; a task added here joins that section
  tasks: Task[];
}

interface MainViewProps {
  title: string;
  subtitle: string;
  groups: RenderGroup[];
  reorderable: boolean;
  showCompletedToggle: boolean; // only in a project view, and only if something is completed
  showCompleted: boolean; // are those completed tasks currently revealed?
  completedCount: number;
  onToggleCompleted: () => void;
  showSort: boolean; // sort control only on the date pages (projects stay manual)
  sortMode: TaskSortMode;
  allowedSortModes: TaskSortMode[]; // which modes this page offers
  onSortChange: (mode: TaskSortMode) => void;
  projectNameFor: (task: Task) => string | null;
  tagFor: (task: Task) => PriorityTag | null;
  emptyNote: string;
  // Where the add row appears: inside each group (a project's sections), at the
  // end of the page (the date pages, and an empty project), or nowhere at all
  // (Scheduled — see the roadmap: it needs a date field first).
  addTaskInGroups: boolean;
  addTaskAtEnd: boolean;
  onAddTask: (title: string, sectionId: string | null) => Promise<void>;
  onToggle: (taskId: string) => void;
  onMove: (dayTasks: Task[], taskId: string, direction: "up" | "down") => void;
  onRename: (taskId: string, title: string) => Promise<void>;
}

export function MainView({
  title,
  subtitle,
  groups,
  reorderable,
  showCompletedToggle,
  showCompleted,
  completedCount,
  onToggleCompleted,
  showSort,
  sortMode,
  allowedSortModes,
  onSortChange,
  projectNameFor,
  tagFor,
  emptyNote,
  addTaskInGroups,
  addTaskAtEnd,
  onAddTask,
  onToggle,
  onMove,
  onRename,
}: MainViewProps) {
  return (
    <main className="main">
      <header className="page-header">
        <div className="page-header__titles">
          <h2 className="page-header__title">{title}</h2>
          <span className="page-header__subtitle">{subtitle}</span>
        </div>
        <div className="page-header__controls">
          {showCompletedToggle && (
            <button
              type="button"
              className={`pill pill--button ${showCompleted ? "pill--active" : ""}`}
              aria-pressed={showCompleted}
              onClick={onToggleCompleted}
            >
              {showCompleted ? "Hide completed" : `Show completed · ${completedCount}`}
            </button>
          )}
          {showSort && (
            <SortMenu mode={sortMode} allowed={allowedSortModes} onChange={onSortChange} />
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
              level={group.level}
              tasks={group.tasks}
              reorderable={reorderable}
              projectNameFor={projectNameFor}
              tagFor={tagFor}
              onToggle={onToggle}
              onMove={(taskId, direction) => onMove(group.tasks, taskId, direction)}
              onRename={onRename}
              onAddTask={
                addTaskInGroups
                  ? (title) => onAddTask(title, group.sectionId ?? null)
                  : undefined
              }
            />
          ))
        )}
        {addTaskAtEnd && (
          <ul className="day__tasks">
            <AddTaskRow onAdd={(title) => onAddTask(title, null)} />
          </ul>
        )}
      </div>
    </main>
  );
}
