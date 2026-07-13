import { describe, expect, it } from "vitest";
import { groupTasksByDay } from "../src/core/groupByDay";
import type { Task } from "../src/core/types";
import { makeTask } from "./helpers/makeTask";

const titles = (tasks: Task[]): string[] => tasks.map((t) => t.title);

describe("groupTasksByDay — buckets tasks by scheduled day", () => {
  it("puts each task in the bucket of its scheduled day", () => {
    const input = [
      makeTask({ title: "Monday chore", scheduledFor: "2026-07-13" }),
      makeTask({ title: "Tuesday chore", scheduledFor: "2026-07-14" }),
      makeTask({ title: "Monday errand", scheduledFor: "2026-07-13" }),
    ];

    const buckets = groupTasksByDay(input);

    expect(buckets).toHaveLength(2);
    expect(buckets[0].day).toBe("2026-07-13");
    expect(titles(buckets[0].tasks)).toEqual(["Monday chore", "Monday errand"]);
    expect(buckets[1].day).toBe("2026-07-14");
    expect(titles(buckets[1].tasks)).toEqual(["Tuesday chore"]);
  });

  it("orders day buckets oldest to newest, whatever order tasks arrive in", () => {
    const input = [
      makeTask({ title: "Late", scheduledFor: "2026-07-20" }),
      makeTask({ title: "Early", scheduledFor: "2026-07-01" }),
      makeTask({ title: "Middle", scheduledFor: "2026-07-10" }),
    ];

    const days = groupTasksByDay(input).map((b) => b.day);

    expect(days).toEqual(["2026-07-01", "2026-07-10", "2026-07-20"]);
  });

  it("collects tasks without a date into one unscheduled bucket, placed last", () => {
    const input = [
      makeTask({ title: "Someday" }),
      makeTask({ title: "Dated", scheduledFor: "2026-07-13" }),
      makeTask({ title: "Whenever" }),
    ];

    const buckets = groupTasksByDay(input);

    expect(buckets).toHaveLength(2);
    expect(buckets[0].day).toBe("2026-07-13");
    expect(buckets[1].day).toBeNull();
    expect(titles(buckets[1].tasks)).toEqual(["Someday", "Whenever"]);
  });

  it("keeps the incoming order inside a bucket — grouping never sorts", () => {
    // Arrival order deliberately disagrees with position: the helper must
    // respect arrival order so a sort lens applied BEFORE grouping survives.
    const input = [
      makeTask({ title: "Shown first", position: 5, scheduledFor: "2026-07-13" }),
      makeTask({ title: "Shown second", position: 1, scheduledFor: "2026-07-13" }),
    ];

    expect(titles(groupTasksByDay(input)[0].tasks)).toEqual([
      "Shown first",
      "Shown second",
    ]);
  });

  it("creates no empty buckets and handles an empty list", () => {
    expect(groupTasksByDay([])).toEqual([]);
  });

  it("never mutates the input array", () => {
    const input = [
      makeTask({ title: "B", scheduledFor: "2026-07-14" }),
      makeTask({ title: "A", scheduledFor: "2026-07-13" }),
    ];

    groupTasksByDay(input);

    expect(titles(input)).toEqual(["B", "A"]);
  });
});
