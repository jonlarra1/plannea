import { describe, expect, it } from "vitest";
import { addRowPlacement, newTaskTarget } from "../src/core/addTask";
import type { Page, View } from "../src/core/view";

// Behavior specs for WHERE a new task belongs and WHERE the add row appears —
// the rules agreed with the user on 2026-08-03. These lived inside App.tsx at
// first; they are pure decisions, so they belong here, described and tested.

const dates = { today: "2026-08-03", tomorrow: "2026-08-04", inboxProjectId: "inbox" };

const page = (p: Page): View => ({ kind: "page", page: p });

describe("where a new task belongs", () => {
  it("inside a project: that project, that section, and no date", () => {
    const view: View = { kind: "project", projectId: "proj-1" };

    expect(newTaskTarget(view, "sec-1", dates)).toEqual({
      projectId: "proj-1",
      sectionId: "sec-1",
      scheduledFor: null,
    });
  });

  it("inside a project, outside any section: the project's loose list", () => {
    const view: View = { kind: "project", projectId: "proj-1" };

    expect(newTaskTarget(view, null, dates)).toEqual({
      projectId: "proj-1",
      sectionId: null,
      scheduledFor: null,
    });
  });

  it("on Today and Tomorrow: the inbox, scheduled for the day that page shows", () => {
    expect(newTaskTarget(page("today"), null, dates)).toEqual({
      projectId: "inbox",
      sectionId: null,
      scheduledFor: "2026-08-03",
    });
    expect(newTaskTarget(page("tomorrow"), null, dates)).toEqual({
      projectId: "inbox",
      sectionId: null,
      scheduledFor: "2026-08-04",
    });
  });

  it("on Unscheduled: the inbox, with no date", () => {
    expect(newTaskTarget(page("unscheduled"), null, dates)).toEqual({
      projectId: "inbox",
      sectionId: null,
      scheduledFor: null,
    });
  });

  it("on Scheduled: nowhere — that page spans many days, so it cannot pick one", () => {
    expect(newTaskTarget(page("scheduled"), null, dates)).toBeNull();
  });

  it("a page never inherits the section a project view was showing", () => {
    // the caller may still be holding a section id from a previous view
    expect(newTaskTarget(page("today"), "sec-1", dates)?.sectionId).toBeNull();
  });
});

describe("where the add row appears", () => {
  it("in a project with groups: one row inside each group", () => {
    expect(addRowPlacement({ kind: "project", projectId: "proj-1" }, 3)).toBe("in-groups");
  });

  it("in an empty project: one row at the end, since there is no group to sit in", () => {
    expect(addRowPlacement({ kind: "project", projectId: "proj-1" }, 0)).toBe("at-end");
  });

  it("on the date pages: a single row at the end of the page", () => {
    expect(addRowPlacement(page("today"), 4)).toBe("at-end");
    expect(addRowPlacement(page("tomorrow"), 0)).toBe("at-end");
    expect(addRowPlacement(page("unscheduled"), 2)).toBe("at-end");
  });

  it("on Scheduled: no add row at all", () => {
    expect(addRowPlacement(page("scheduled"), 5)).toBe("none");
  });
});
