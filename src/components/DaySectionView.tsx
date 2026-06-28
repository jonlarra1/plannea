import type { DaySection } from "../core/project";
import { TaskItem } from "./TaskItem";

interface DaySectionViewProps {
  day: DaySection;
  onToggle: (taskIndex: number) => void;
  onMove: (taskIndex: number, direction: "up" | "down") => void;
}

export function DaySectionView({ day, onToggle, onMove }: DaySectionViewProps) {
  return (
    <section className="day">
      <h3 className="day__heading">{day.heading}</h3>
      <ul className="day__tasks">
        {day.tasks.map((task, index) => (
          <TaskItem
            key={index}
            text={task.text}
            done={task.status === "done"}
            isFirst={index === 0}
            isLast={index === day.tasks.length - 1}
            onToggle={() => onToggle(index)}
            onMoveUp={() => onMove(index, "up")}
            onMoveDown={() => onMove(index, "down")}
          />
        ))}
      </ul>
    </section>
  );
}
