import type { Section, Task } from "./types";

// One display bucket for the project view: a section (by id) or null for the
// project's loose tasks (those with no section).
export interface SectionBucket {
  sectionId: string | null;
  tasks: Task[];
}

// Groups a project's tasks under their sections, for the project view (the
// date pages use groupByDay instead). Unlike day buckets, named sections are
// PERSISTENT containers, so every provided section appears even when empty —
// you can still add tasks to it. Tasks with no section (or an unknown/deleted
// section id) collect into one leading bucket, placed before the named
// sections. Sections come in the order given (the caller passes them by
// position). Pure: never sorts within a bucket, never mutates the inputs.
export function groupTasksBySection(tasks: Task[], sections: Section[]): SectionBucket[] {
  const bySection = new Map<string, Task[]>();
  for (const section of sections) bySection.set(section.id, []);
  const loose: Task[] = [];

  for (const task of tasks) {
    const bucket = task.sectionId !== null ? bySection.get(task.sectionId) : undefined;
    if (bucket) bucket.push(task);
    else loose.push(task); // no section, or a section that no longer exists
  }

  const buckets: SectionBucket[] = [];
  if (loose.length > 0) buckets.push({ sectionId: null, tasks: loose });
  for (const section of sections) buckets.push({ sectionId: section.id, tasks: bySection.get(section.id)! });
  return buckets;
}
