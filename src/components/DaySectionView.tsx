import type { DayBucket } from "../core/groupByDay";
import { TaskItem } from "./TaskItem";

interface DaySectionViewProps {
  day: DayBucket;
  onToggle: (taskId: string) => void;
  onMove: (taskId: string, direction: "up" | "down") => void;
}

// The single dateless bucket (day === null) is shown under this heading.
const UNSCHEDULED_LABEL = "Unscheduled";

export function DaySectionView({ day, onToggle, onMove }: DaySectionViewProps) {
  return (
    <section className="day">
      <h3 className="day__heading">{day.day ?? UNSCHEDULED_LABEL}</h3>
      <ul className="day__tasks">
        {day.tasks.map((task, index) => (
          <TaskItem
            key={task.id}
            text={task.title}
            done={task.status === "done"}
            isFirst={index === 0}
            isLast={index === day.tasks.length - 1}
            onToggle={() => onToggle(task.id)}
            onMoveUp={() => onMove(task.id, "up")}
            onMoveDown={() => onMove(task.id, "down")}
          />
        ))}
      </ul>
    </section>
  );
}
