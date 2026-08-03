import { useEffect, useRef, useState, type FormEvent } from "react";

interface AddTaskRowProps {
  onAdd: (title: string) => Promise<void>; // throws if the write fails
}

// The "+ add task" row: a quiet button that becomes a text field in place.
// Capturing tasks is the most frequent thing in the app, so it stays open after
// each one (user decision, 2026-08-03) — type, Enter, type, Enter. Escape, or
// clicking away from an empty field, closes it again.
export function AddTaskRow({ onAdd }: AddTaskRowProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function close(): void {
    setOpen(false);
    setTitle("");
    setFailed(false);
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed === "" || busy) return; // busy guard: a second Enter must not create a twin
    setBusy(true);
    setFailed(false);
    try {
      await onAdd(trimmed);
      setTitle(""); // ready for the next one, still focused
    } catch {
      setFailed(true); // keep what was typed — closing here would just lose it
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <li>
        <button type="button" className="add-task" onClick={() => setOpen(true)}>
          <span className="add-task__plus">+</span> add task
        </button>
      </li>
    );
  }

  return (
    <li>
      <form className="add-task-form" onSubmit={(e) => void handleSubmit(e)}>
        <input
          ref={inputRef}
          className="add-task-form__input"
          value={title}
          placeholder="New task"
          autoComplete="off"
          aria-label="New task"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
          // clicking away abandons an empty field, but never a typed one
          onBlur={() => {
            if (title.trim() === "") close();
          }}
        />
      </form>
      {failed && <p className="add-task-form__error">Could not add that task. Please try again.</p>}
    </li>
  );
}
