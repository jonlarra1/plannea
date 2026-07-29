// The theme setting has three choices; only two are ever painted. "system"
// means "ask the OS", so it resolves to light or dark at render time — the rest
// of the app (and all of styles.css) only ever sees the resolved value on the
// root element's data-theme attribute.

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "plannea-theme";

// What the user actually sees, given their choice and what the OS reports.
export function resolveTheme(choice: ThemeChoice, osPrefersDark: boolean): ResolvedTheme {
  if (choice === "system") return osPrefersDark ? "dark" : "light";
  return choice;
}

// The sidebar button cycles through the three choices in this order.
export function nextChoice(choice: ThemeChoice): ThemeChoice {
  if (choice === "light") return "dark";
  if (choice === "dark") return "system";
  return "light";
}

// Anything unrecognised (including nothing saved yet) means System — the
// default for a fresh install. Earlier versions only ever saved light/dark, so
// an existing choice still reads back the same.
export function parseChoice(saved: string | null): ThemeChoice {
  if (saved === "light" || saved === "dark" || saved === "system") return saved;
  return "system";
}

export function loadChoice(): ThemeChoice {
  return parseChoice(localStorage.getItem(STORAGE_KEY));
}

export function saveChoice(choice: ThemeChoice): void {
  localStorage.setItem(STORAGE_KEY, choice);
}

// True when the OS asks for a dark UI. Guarded because matchMedia is missing in
// non-browser environments (tests).
export function osPrefersDark(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false;
}

// Call `onChange` whenever the OS flips light/dark. Returns an unsubscribe
// function; a no-op where matchMedia isn't available.
export function watchOsTheme(onChange: (prefersDark: boolean) => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};

  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (event: MediaQueryListEvent) => onChange(event.matches);
  query.addEventListener("change", handler);
  return () => query.removeEventListener("change", handler);
}
