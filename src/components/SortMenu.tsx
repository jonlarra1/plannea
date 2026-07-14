import { useEffect, useRef, useState } from "react";
import type { TaskSortMode } from "../core/sortTasks";

// Human labels for the sort modes. (Manual isn't offered on the pages — it's
// meaningless across projects — but a label is here for completeness.)
const LABELS: Record<TaskSortMode, string> = {
  manual: "Manual",
  urgency: "Urgency",
  importance: "Importance",
  deadline: "Deadline",
};

interface SortMenuProps {
  mode: TaskSortMode;
  allowed: TaskSortMode[]; // which modes this page offers (Deadline only on Scheduled)
  onChange: (mode: TaskSortMode) => void;
}

// A small custom dropdown. We render our own list (not a native <select>)
// because on Linux/WebKitGTK the native popup follows the system GTK theme and
// ignores our CSS — this one always matches the app's light/dark theme.
export function SortMenu({ mode, allowed, onChange }: SortMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape.
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
    <div className="sort-menu" ref={rootRef}>
      <span className="sort-menu__label">Sort</span>
      <button
        type="button"
        className="sort-menu__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {LABELS[mode]}
        <span className="sort-menu__chevron" aria-hidden="true" />
      </button>
      {open && (
        <ul className="sort-menu__list" role="listbox" aria-label="Sort tasks">
          {allowed.map((value) => (
            <li key={value} role="option" aria-selected={value === mode}>
              <button
                type="button"
                className={`sort-menu__option${value === mode ? " is-active" : ""}`}
                onClick={() => {
                  onChange(value);
                  setOpen(false);
                }}
              >
                {LABELS[value]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
