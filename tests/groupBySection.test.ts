import { describe, expect, it } from "vitest";
import { groupTasksBySection } from "../src/core/groupBySection";
import type { Section, Task } from "../src/core/types";
import { makeTask } from "./helpers/makeTask";

const titles = (tasks: Task[]): string[] => tasks.map((t) => t.title);

let sectionSeq = 0;
function makeSection(overrides: Partial<Section> & { id: string }): Section {
  return {
    projectId: "p1",
    name: overrides.id,
    position: sectionSeq++,
    createdAt: "2026-07-13T00:00:00Z",
    updatedAt: "2026-07-13T00:00:00Z",
    ...overrides,
  };
}

describe("groupTasksBySection — a project's tasks under their sections", () => {
  it("puts each task under its section, sections in the given order", () => {
    const planning = makeSection({ id: "planning" });
    const doing = makeSection({ id: "doing" });
    const input = [
      makeTask({ title: "Plan A", sectionId: "planning" }),
      makeTask({ title: "Do X", sectionId: "doing" }),
      makeTask({ title: "Plan B", sectionId: "planning" }),
    ];

    const buckets = groupTasksBySection(input, [planning, doing]);

    expect(buckets).toHaveLength(2);
    expect(buckets[0].sectionId).toBe("planning");
    expect(titles(buckets[0].tasks)).toEqual(["Plan A", "Plan B"]);
    expect(buckets[1].sectionId).toBe("doing");
    expect(titles(buckets[1].tasks)).toEqual(["Do X"]);
  });

  it("shows a named section even when it has no tasks (a container to add to)", () => {
    const planning = makeSection({ id: "planning" });
    const empty = makeSection({ id: "empty" });

    const buckets = groupTasksBySection(
      [makeTask({ title: "Only task", sectionId: "planning" })],
      [planning, empty],
    );

    expect(buckets.map((b) => b.sectionId)).toEqual(["planning", "empty"]);
    expect(buckets[1].tasks).toEqual([]);
  });

  it("collects tasks with no section into one leading bucket, before the named sections", () => {
    const planning = makeSection({ id: "planning" });
    const input = [
      makeTask({ title: "In section", sectionId: "planning" }),
      makeTask({ title: "Loose one" }),
      makeTask({ title: "Loose two" }),
    ];

    const buckets = groupTasksBySection(input, [planning]);

    expect(buckets[0].sectionId).toBeNull();
    expect(titles(buckets[0].tasks)).toEqual(["Loose one", "Loose two"]);
    expect(buckets[1].sectionId).toBe("planning");
  });

  it("omits the loose bucket when every task has a section", () => {
    const planning = makeSection({ id: "planning" });

    const buckets = groupTasksBySection(
      [makeTask({ title: "Tidy", sectionId: "planning" })],
      [planning],
    );

    expect(buckets.map((b) => b.sectionId)).toEqual(["planning"]);
  });

  it("treats an unknown section id as loose, so no task is ever dropped", () => {
    const planning = makeSection({ id: "planning" });
    const input = [makeTask({ title: "Orphan", sectionId: "deleted-section" })];

    const buckets = groupTasksBySection(input, [planning]);

    expect(buckets[0].sectionId).toBeNull();
    expect(titles(buckets[0].tasks)).toEqual(["Orphan"]);
  });

  it("keeps incoming task order and never mutates the input", () => {
    const planning = makeSection({ id: "planning" });
    const input = [
      makeTask({ title: "Shown first", position: 9, sectionId: "planning" }),
      makeTask({ title: "Shown second", position: 1, sectionId: "planning" }),
    ];

    const buckets = groupTasksBySection(input, [planning]);

    expect(titles(buckets[0].tasks)).toEqual(["Shown first", "Shown second"]);
    expect(titles(input)).toEqual(["Shown first", "Shown second"]);
  });

  it("handles an empty project (no tasks, no sections)", () => {
    expect(groupTasksBySection([], [])).toEqual([]);
  });
});
