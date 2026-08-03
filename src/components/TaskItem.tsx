import { useEffect, useRef, useState } from "react";
import { TaskMenu } from "./TaskMenu";

// A small priority tag that clarifies the secondary sort: when a page groups by
// urgency, tasks inside a group are ordered by importance (and vice-versa), so
// we surface that other dial as a tag. `kind` picks its colour/tooltip.
export interface PriorityTag {
  kind: "urgency" | "importance";
  level: number; // 1..3 — drives the shade (higher = stronger)
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
  onRename: (title: string) => Promise<void>; // throws if the write fails
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
  onRename,
}: TaskItemProps) {
  // Renaming happens in place: the title turns into a field holding the current
  // text. Enter or clicking away saves; Escape abandons the edit (user
  // decisions, 2026-08-03).
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abandoned = useRef(false); // Escape must win over the blur that follows it

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function startEditing(): void {
    setDraft(text);
    setFailed(false);
    abandoned.current = false;
    setEditing(true);
  }

  async function save(): Promise<void> {
    if (busy || abandoned.current) return;
    const trimmed = draft.trim();
    // An emptied field, or no real change, simply closes — a task never loses
    // its name this way.
    if (trimmed === "" || trimmed === text) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await onRename(trimmed);
      setEditing(false);
      setFailed(false);
    } catch {
      setFailed(true); // stay open, keep what was typed
      inputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={`task ${done ? "task--done" : ""}`}>
      <input className="task__check" type="checkbox" checked={done} onChange={onToggle} />
      {editing ? (
        <form
          className="task__edit"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <input
            ref={inputRef}
            className={`task__edit-input ${failed ? "task__edit-input--failed" : ""}`}
            value={draft}
            aria-label="Task title"
            autoComplete="off"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                abandoned.current = true;
                setEditing(false);
              }
            }}
            onBlur={() => void save()}
          />
        </form>
      ) : (
        <span className="task__text">{text}</span>
      )}
      {tag && (
        <span
          className={`task__tag task__tag--${tag.kind}`}
          data-level={tag.level}
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
        <TaskMenu onRename={startEditing} />
      </div>
    </li>
  );
}
