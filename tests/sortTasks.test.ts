import { describe, expect, it } from "vitest";
import { sortTasks } from "../src/core/sortTasks";
import type { Task } from "../src/core/types";
import { makeTask } from "./helpers/makeTask";

const titles = (tasks: Task[]): string[] => tasks.map((t) => t.title);

describe("sortTasks — a lens, never a rearrangement", () => {
  it("returns a new list and leaves the input untouched", () => {
    const input = [
      makeTask({ title: "B", position: 1 }),
      makeTask({ title: "A", position: 0 }),
    ];

    const sorted = sortTasks(input, "manual");

    expect(titles(sorted)).toEqual(["A", "B"]);
    expect(titles(input)).toEqual(["B", "A"]); // the original order survives
    expect(sorted).not.toBe(input);
  });

  it("manual mode follows the user's hand-arranged positions", () => {
    const input = [
      makeTask({ title: "Third", position: 2 }),
      makeTask({ title: "First", position: 0 }),
      makeTask({ title: "Second", position: 1 }),
    ];

    expect(titles(sortTasks(input, "manual"))).toEqual(["First", "Second", "Third"]);
  });

  it("deadline mode: earliest first, tasks without a deadline sink to the bottom", () => {
    const input = [
      makeTask({ title: "No deadline", position: 0 }),
      makeTask({ title: "Next week", position: 1, dueAt: "2026-07-14T09:00:00Z" }),
      makeTask({ title: "Tomorrow", position: 2, dueAt: "2026-07-08T09:00:00Z" }),
    ];

    expect(titles(sortTasks(input, "deadline"))).toEqual([
      "Tomorrow",
      "Next week",
      "No deadline",
    ]);
  });

  it("urgency mode: highest dial first", () => {
    const input = [
      makeTask({ title: "Calm", position: 0, urgency: 0 }),
      makeTask({ title: "Burning", position: 1, urgency: 3 }),
      makeTask({ title: "Warm", position: 2, urgency: 1 }),
    ];

    expect(titles(sortTasks(input, "urgency"))).toEqual(["Burning", "Warm", "Calm"]);
  });

  it("importance mode: highest dial first", () => {
    const input = [
      makeTask({ title: "Minor", position: 0, importance: 1 }),
      makeTask({ title: "Major", position: 1, importance: 3 }),
    ];

    expect(titles(sortTasks(input, "importance"))).toEqual(["Major", "Minor"]);
  });

  it("urgency mode breaks ties by importance (more important first)", () => {
    const input = [
      makeTask({ title: "Urgent, minor", position: 0, urgency: 3, importance: 1 }),
      makeTask({ title: "Urgent, major", position: 1, urgency: 3, importance: 3 }),
      makeTask({ title: "Calm", position: 2, urgency: 0, importance: 3 }),
    ];

    expect(titles(sortTasks(input, "urgency"))).toEqual([
      "Urgent, major",
      "Urgent, minor",
      "Calm",
    ]);
  });

  it("importance mode breaks ties by urgency (more urgent first)", () => {
    const input = [
      makeTask({ title: "Major, calm", position: 0, importance: 3, urgency: 0 }),
      makeTask({ title: "Major, urgent", position: 1, importance: 3, urgency: 3 }),
      makeTask({ title: "Minor", position: 2, importance: 1, urgency: 3 }),
    ];

    expect(titles(sortTasks(input, "importance"))).toEqual([
      "Major, urgent",
      "Major, calm",
      "Minor",
    ]);
  });

  it("deadline mode breaks same-day ties by importance", () => {
    const input = [
      makeTask({ title: "Due Fri, minor", position: 0, dueAt: "2026-07-17", importance: 0 }),
      makeTask({ title: "Due Fri, major", position: 1, dueAt: "2026-07-17", importance: 3 }),
      makeTask({ title: "Due Thu", position: 2, dueAt: "2026-07-16", importance: 0 }),
    ];

    expect(titles(sortTasks(input, "deadline"))).toEqual([
      "Due Thu",
      "Due Fri, major",
      "Due Fri, minor",
    ]);
  });

  it("ties keep the user's manual order", () => {
    const input = [
      makeTask({ title: "Arranged second", position: 1, urgency: 3 }),
      makeTask({ title: "Arranged first", position: 0, urgency: 3 }),
      makeTask({ title: "Less urgent", position: 2, urgency: 1 }),
    ];

    expect(titles(sortTasks(input, "urgency"))).toEqual([
      "Arranged first",
      "Arranged second",
      "Less urgent",
    ]);
  });
});
