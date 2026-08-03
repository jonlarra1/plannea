import { useEffect, useRef, useState, type FormEvent } from "react";

interface NewProjectDialogProps {
  onCreate: (name: string) => Promise<void>; // throws if the write fails
  onCancel: () => void;
}

// A small modal for naming a new project. Our own element rather than a native
// OS dialog, for the same reason as SortMenu: this one follows the app's
// light/dark theme. Only a name for now — colour, emoji and description are
// later slices.
export function NewProjectDialog({ onCreate, onCancel }: NewProjectDialogProps) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open with the field ready to type in.
  useEffect(() => inputRef.current?.focus(), []);

  // Escape cancels from anywhere, as in any dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const trimmed = name.trim();

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (trimmed === "" || busy) return; // busy guard: a second Enter must not create a twin
    setBusy(true);
    setError(null);
    try {
      await onCreate(trimmed);
    } catch {
      // Stay open with what was typed — closing here would just lose the name.
      setError("Could not create the project. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onCancel}>
      {/* stop clicks inside the card from reaching the backdrop's cancel */}
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="dialog__title" id="new-project-title">
          New project
        </h2>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <label className="dialog__label" htmlFor="new-project-name">
            Name
          </label>
          <input
            id="new-project-name"
            ref={inputRef}
            className="dialog__input"
            value={name}
            placeholder="Groceries"
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
          />
          {error && <p className="dialog__error">{error}</p>}
          <div className="dialog__actions">
            <button type="button" className="dialog__button" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="submit"
              className="dialog__button dialog__button--primary"
              disabled={trimmed === "" || busy}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
