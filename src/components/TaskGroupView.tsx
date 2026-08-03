import type { Task } from "../core/types";
import { AddTaskRow } from "./AddTaskRow";
import { TaskItem, type PriorityTag } from "./TaskItem";

// A generic group of tasks under a heading — used for both a day bucket (on the
// date pages) and a section (in the project view). The parent decides the
// heading text and whether to show it.
interface TaskGroupViewProps {
  heading: string;
  showHeading: boolean;
  accent: boolean; // e.g. "today" — tints the heading
  level?: number; // priority level (0..3) — colours a level-group heading
  tasks: Task[];
  reorderable: boolean;
  projectNameFor: (task: Task) => string | null;
  tagFor: (task: Task) => PriorityTag | null;
  onToggle: (taskId: string) => void;
  onMove: (taskId: string, direction: "up" | "down") => void;
  onRename: (taskId: string, title: string) => Promise<void>;
  // given only where adding belongs INSIDE the group — i.e. a project's
  // sections. The date pages carry a single add row at the end instead.
  onAddTask?: (title: string) => Promise<void>;
}

export function TaskGroupView({
  heading,
  showHeading,
  accent,
  level,
  tasks,
  reorderable,
  projectNameFor,
  tagFor,
  onToggle,
  onMove,
  onRename,
  onAddTask,
}: TaskGroupViewProps) {
  return (
    <section className="day">
      {showHeading && (
        <h3 className={`day__heading ${accent ? "day__heading--today" : ""}`} data-level={level}>
          <span className="day__dot" />
          {heading}
        </h3>
      )}
      <ul className="day__tasks">
        {tasks.map((task, index) => (
          <TaskItem
            key={task.id}
            text={task.title}
            done={task.status === "done"}
            projectName={projectNameFor(task)}
            tag={tagFor(task)}
            isFirst={index === 0}
            isLast={index === tasks.length - 1}
            reorderable={reorderable}
            onToggle={() => onToggle(task.id)}
            onMoveUp={() => onMove(task.id, "up")}
            onMoveDown={() => onMove(task.id, "down")}
            onRename={(title) => onRename(task.id, title)}
          />
        ))}
        {onAddTask && <AddTaskRow onAdd={onAddTask} />}
      </ul>
    </section>
  );
}
