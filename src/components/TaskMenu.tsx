import { useEffect, useRef, useState } from "react";

interface TaskMenuProps {
  onRename: () => void;
}

// The "⋯" button on a task row, now a real little menu. It holds Rename today;
// Delete and the rest of the task actions land here in the following slices.
// Same manners as SortMenu: closes on outside click or Escape, and follows the
// app theme because we render the list ourselves.
export function TaskMenu({ onRename }: TaskMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="task-menu" ref={rootRef}>
      <button
        type="button"
        className="task__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Task options"
        onClick={() => setOpen((o) => !o)}
      >
        ⋯
      </button>
      {open && (
        <ul className="task-menu__list" role="menu">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="task-menu__option"
              onClick={() => {
                setOpen(false);
                onRename();
              }}
            >
              Rename
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
