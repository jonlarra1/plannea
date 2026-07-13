// Small date helpers for the UI. Days are stored as "YYYY-MM-DD" strings;
// these turn them into human labels and compute today/tomorrow for the pages.

export function isoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayIso(): string {
  return isoDay(new Date());
}

export function tomorrowIso(): string {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return isoDay(t);
}

// Parse "YYYY-MM-DD" as a LOCAL date (new Date("...") would read it as UTC and
// can slip a day in negative-offset zones).
function parseLocal(dayIso: string): Date {
  const [y, m, d] = dayIso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Heading text for a day bucket, plus whether it's today (for accenting).
export function formatDayHeading(dayIso: string | null): { text: string; isToday: boolean } {
  if (dayIso === null) return { text: "Unscheduled", isToday: false };

  const date = parseLocal(dayIso);
  const short = date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
  if (dayIso === todayIso()) return { text: `Today · ${short}`, isToday: true };
  if (dayIso === tomorrowIso()) return { text: `Tomorrow · ${short}`, isToday: false };

  return {
    text: date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
    isToday: false,
  };
}

// Long, friendly date for a page subtitle (e.g. "Monday, 13 July").
export function longDate(dayIso: string): string {
  return parseLocal(dayIso).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
