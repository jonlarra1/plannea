// A small priority tag that clarifies the secondary sort: when a page groups by
// urgency, tasks inside a group are ordered by importance (and vice-versa), so
// we surface that other dial as a tag. `kind` picks its colour/tooltip.
export interface PriorityTag {
  kind: "urgency" | "importance";
  label: string;
}

interface TaskItemProps {
  text: string;
  done: boolean;
  projectName: string | null; // shown on cross-project pages; null → nothing
  tag: PriorityTag | null; // the secondary-sort dial, when a sort is active
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
  tag,
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
      {tag && (
        <span
          className={`task__tag task__tag--${tag.kind}`}
          title={`${tag.kind === "urgency" ? "Urgency" : "Importance"}: ${tag.label}`}
        >
          {tag.label}
        </span>
      )}
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
