import type { DayBucket } from "../core/groupByDay";
import type { Task } from "../core/types";
import { formatDayHeading } from "../app/dates";
import { DaySectionView } from "./DaySectionView";

interface MainViewProps {
  title: string;
  subtitle: string;
  days: DayBucket[];
  showDayHeadings: boolean;
  reorderable: boolean;
  projectNameFor: (task: Task) => string | null;
  emptyNote: string;
  onToggle: (taskId: string) => void;
  onMove: (dayTasks: Task[], taskId: string, direction: "up" | "down") => void;
}

export function MainView({
  title,
  subtitle,
  days,
  showDayHeadings,
  reorderable,
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
        {/* inactive placeholder — sort/view switcher comes later */}
        <span className="sort-switcher is-placeholder" title="Sort — coming soon">
          Sort: manual ⌄
        </span>
      </header>

      <div className="page-body">
        {days.length === 0 ? (
          <p className="empty-note">{emptyNote}</p>
        ) : (
          days.map((day) => {
            const { text, isToday } = formatDayHeading(day.day);
            return (
              <DaySectionView
                key={day.day ?? "unscheduled"}
                day={day}
                heading={text}
                showHeading={showDayHeadings}
                isToday={isToday}
                reorderable={reorderable}
                projectNameFor={projectNameFor}
                onToggle={onToggle}
                onMove={(taskId, direction) => onMove(day.tasks, taskId, direction)}
              />
            );
          })
        )}
      </div>
    </main>
  );
}
