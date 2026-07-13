import type { DayBucket } from "../core/groupByDay";
import { TaskItem } from "./TaskItem";

interface DaySectionViewProps {
  day: DayBucket;
  heading: string; // formatted for display (e.g. "Today · Mon 13")
  showHeading: boolean; // hidden on single-day pages where the title already says the day
  isToday: boolean;
  reorderable: boolean;
  // Resolve a task's project label; returns null to show none (e.g. inside a
  // single project's view, where the label would be redundant).
  projectNameFor: (task: DayBucket["tasks"][number]) => string | null;
  onToggle: (taskId: string) => void;
  onMove: (taskId: string, direction: "up" | "down") => void;
}

export function DaySectionView({
  day,
  heading,
  showHeading,
  isToday,
  reorderable,
  projectNameFor,
  onToggle,
  onMove,
}: DaySectionViewProps) {
  return (
    <section className="day">
      {showHeading && (
        <h3 className={`day__heading ${isToday ? "day__heading--today" : ""}`}>
          <span className="day__dot" />
          {heading}
        </h3>
      )}
      <ul className="day__tasks">
        {day.tasks.map((task, index) => (
          <TaskItem
            key={task.id}
            text={task.title}
            done={task.status === "done"}
            projectName={projectNameFor(task)}
            isFirst={index === 0}
            isLast={index === day.tasks.length - 1}
            reorderable={reorderable}
            onToggle={() => onToggle(task.id)}
            onMoveUp={() => onMove(task.id, "up")}
            onMoveDown={() => onMove(task.id, "down")}
          />
        ))}
        {/* inactive placeholder — adding tasks comes in roadmap 2.5 */}
        <li>
          <button className="add-task is-placeholder" title="Add task — coming soon">
            <span className="add-task__plus">+</span> add task
          </button>
        </li>
      </ul>
    </section>
  );
}
