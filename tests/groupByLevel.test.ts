import { describe, expect, it } from "vitest";
import { groupTasksByLevel } from "../src/core/groupByLevel";
import type { Task } from "../src/core/types";
import { makeTask } from "./helpers/makeTask";

const titles = (tasks: Task[]): string[] => tasks.map((t) => t.title);

describe("groupTasksByLevel — a lens over urgency/importance", () => {
  it("groups by urgency level, highest level first", () => {
    const input = [
      makeTask({ title: "Calm", urgency: 0 }),
      makeTask({ title: "Burning", urgency: 3 }),
      makeTask({ title: "Warm", urgency: 1 }),
    ];

    const buckets = groupTasksByLevel(input, "urgency");

    expect(buckets.map((b) => b.level)).toEqual([3, 1, 0]);
    expect(titles(buckets[0].tasks)).toEqual(["Burning"]);
    expect(titles(buckets[1].tasks)).toEqual(["Warm"]);
    expect(titles(buckets[2].tasks)).toEqual(["Calm"]);
  });

  it("groups by importance level when asked", () => {
    const input = [
      makeTask({ title: "Minor", importance: 1 }),
      makeTask({ title: "Major", importance: 3 }),
    ];

    const buckets = groupTasksByLevel(input, "importance");

    expect(buckets.map((b) => b.level)).toEqual([3, 1]);
    expect(titles(buckets[0].tasks)).toEqual(["Major"]);
  });

  it("omits levels with no tasks (only levels that appear show up)", () => {
    const input = [makeTask({ title: "A", urgency: 3 }), makeTask({ title: "B", urgency: 0 })];

    const buckets = groupTasksByLevel(input, "urgency");

    expect(buckets.map((b) => b.level)).toEqual([3, 0]); // no empty 2 or 1
  });

  it("keeps the incoming order within a bucket (never re-sorts)", () => {
    const input = [
      makeTask({ title: "First", urgency: 2 }),
      makeTask({ title: "Second", urgency: 2 }),
    ];

    const buckets = groupTasksByLevel(input, "urgency");

    expect(titles(buckets[0].tasks)).toEqual(["First", "Second"]);
  });

  it("returns new buckets and never mutates the input", () => {
    const input = [makeTask({ title: "A", urgency: 1 })];
    const before = [...input];

    groupTasksByLevel(input, "urgency");

    expect(input).toEqual(before);
  });
});
