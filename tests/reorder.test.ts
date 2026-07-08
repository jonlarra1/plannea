import { describe, expect, it } from "vitest";
import { findReorderSwap } from "../src/core/reorder";
import { makeTask } from "./helpers/makeTask";

// Reordering = swapping places with your visible neighbor (rules agreed
// 2026-07-08). This core function only DECIDES which two tasks swap — the
// data layer performs the swap. The list passed in is the group as displayed
// in manual view; lenses hide reordering entirely (UI rule).

const list = [
  makeTask({ title: "Top" }),
  makeTask({ title: "Middle" }),
  makeTask({ title: "Bottom" }),
];

describe("findReorderSwap", () => {
  it("moving up pairs a task with the one displayed above it", () => {
    const swap = findReorderSwap(list, "Middle", "up");
    expect(swap?.map((t) => t.title)).toEqual(["Middle", "Top"]);
  });

  it("moving down pairs a task with the one displayed below it", () => {
    const swap = findReorderSwap(list, "Middle", "down");
    expect(swap?.map((t) => t.title)).toEqual(["Middle", "Bottom"]);
  });

  it("at the edges nothing happens", () => {
    expect(findReorderSwap(list, "Top", "up")).toBeNull();
    expect(findReorderSwap(list, "Bottom", "down")).toBeNull();
  });

  it("an unknown task swaps nothing", () => {
    expect(findReorderSwap(list, "Ghost", "up")).toBeNull();
  });

  it("only the two neighbors are involved — the rest of the group is untouched", () => {
    const swap = findReorderSwap(list, "Bottom", "up");
    expect(swap?.map((t) => t.title)).toEqual(["Bottom", "Middle"]);
    // "Top" is in neither slot: a swap never cascades beyond the pair
    expect(swap?.some((t) => t.title === "Top")).toBe(false);
  });
});
