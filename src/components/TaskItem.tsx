interface TaskItemProps {
  text: string;
  done: boolean;
  projectName: string | null; // shown on cross-project pages; null → nothing
  isFirst: boolean;
  isLast: boolean;
  reorderable: boolean; // arrows show only where a manual order exists
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function TaskItem({
  text,
  done,
  projectName,
  isFirst,
  isLast,
  reorderable,
  onToggle,
  onMoveUp,
  onMoveDown,
}: TaskItemProps) {
  return (
    <li className={`task ${done ? "task--done" : ""}`}>
      <input className="task__check" type="checkbox" checked={done} onChange={onToggle} />
      <span className="task__text">{text}</span>
      {projectName && <span className="task__project">{projectName}</span>}
      <div className="task__actions">
        {reorderable && (
          <>
            <button className="task__btn" onClick={onMoveUp} disabled={isFirst} aria-label="Move task up">
              ↑
            </button>
            <button className="task__btn" onClick={onMoveDown} disabled={isLast} aria-label="Move task down">
              ↓
            </button>
          </>
        )}
        {/* inactive placeholder — task menu (rename / reschedule / delete) comes later */}
        <button className="task__btn is-placeholder" title="Task options — coming soon" aria-label="Task options">
          ⋯
        </button>
      </div>
    </li>
  );
}
