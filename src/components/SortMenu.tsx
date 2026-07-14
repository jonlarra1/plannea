import { useEffect, useRef, useState } from "react";
import type { TaskSortMode } from "../core/sortTasks";

// The sort modes offered on the date pages (manual order is meaningless across
// projects, so it's not offered here). Order = how they read in the menu.
const OPTIONS: { value: TaskSortMode; label: string }[] = [
  { value: "urgency", label: "Urgency" },
  { value: "importance", label: "Importance" },
  { value: "deadline", label: "Deadline" },
];

interface SortMenuProps {
  mode: TaskSortMode;
  onChange: (mode: TaskSortMode) => void;
}

// A small custom dropdown. We render our own list (not a native <select>)
// because on Linux/WebKitGTK the native popup follows the system GTK theme and
// ignores our CSS — this one always matches the app's light/dark theme.
export function SortMenu({ mode, onChange }: SortMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((o) => o.value === mode) ?? OPTIONS[0];

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
        {current.label}
        <span className="sort-menu__chevron" aria-hidden="true" />
      </button>
      {open && (
        <ul className="sort-menu__list" role="listbox" aria-label="Sort tasks">
          {OPTIONS.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === mode}>
              <button
                type="button"
                className={`sort-menu__option${o.value === mode ? " is-active" : ""}`}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
