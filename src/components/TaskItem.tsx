interface TaskItemProps {
  text: string;
  done: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function TaskItem({
  text,
  done,
  isFirst,
  isLast,
  onToggle,
  onMoveUp,
  onMoveDown,
}: TaskItemProps) {
  return (
    <li className={`task ${done ? "task--done" : ""}`}>
      <input type="checkbox" checked={done} onChange={onToggle} />
      <span className="task__text">{text}</span>
      <div className="task__actions">
        <button onClick={onMoveUp} disabled={isFirst} aria-label="Move task up">
          ↑
        </button>
        <button onClick={onMoveDown} disabled={isLast} aria-label="Move task down">
          ↓
        </button>
      </div>
    </li>
  );
}
