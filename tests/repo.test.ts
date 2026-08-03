import { beforeEach, describe, expect, it } from "vitest";
import { groupTasksByDay } from "../src/core/groupByDay";
import { setDbClient } from "../src/data/db";
import {
  archiveProject,
  completeProject,
  countAllProjects,
  createProject,
  createSection,
  createTask,
  deleteProject,
  deleteSection,
  deleteTask,
  listCompletedProjects,
  listProjects,
  listSections,
  listTasks,
  renameProject,
  renameSection,
  renameTask,
  reopenProject,
  setTaskDescription,
  setTaskPriority,
  setTaskSchedule,
  setTaskStatus,
  swapTaskPositions,
} from "../src/data/repo";
import { openMemoryDb } from "./helpers/memoryDb";

// Each test gets its own fresh in-memory database — no state leaks between tests.
beforeEach(() => {
  setDbClient(openMemoryDb());
});

// Behavior specs (roadmap 2.2), written from docs/STORAGE.md and the rules
// agreed with the user — NOT from the current code. If a test fails, the
// default assumption is that the code is wrong.

describe("projects", () => {
  it("starts with an empty project list", async () => {
    expect(await listProjects()).toEqual([]);
  });

  it("a new project starts active and goes to the end of the list", async () => {
    const first = await createProject({ name: "First" });
    const second = await createProject({ name: "Second" });

    expect(first.position).toBe(0);
    expect(second.position).toBe(1);
    expect(first.isArchived).toBe(false);
    expect(first.completedAt).toBeNull();
    expect(first.createdAt).toBeTruthy();

    const projects = await listProjects();
    expect(projects.map((p) => p.name)).toEqual(["First", "Second"]);
  });

  it("saves the project name without its surrounding spaces", async () => {
    await createProject({ name: "  Groceries  " });

    expect((await listProjects()).map((p) => p.name)).toEqual(["Groceries"]);
  });

  it("refuses a project with no real name", async () => {
    await expect(createProject({ name: "" })).rejects.toThrow();
    await expect(createProject({ name: "   " })).rejects.toThrow();

    // nothing was written
    expect(await countAllProjects()).toBe(0);
  });

  it("counts every project regardless of state (for the first-run seed guard)", async () => {
    expect(await countAllProjects()).toBe(0);

    const active = await createProject({ name: "Active" });
    const gone = await createProject({ name: "Archived" });
    await archiveProject(gone.id);
    const done = await createProject({ name: "Completed" });
    await completeProject(done.id);

    // active list shows only one, but the raw count still sees all three
    expect((await listProjects()).map((p) => p.id)).toEqual([active.id]);
    expect(await countAllProjects()).toBe(3);
  });

  it("the main list hides archived projects", async () => {
    const keep = await createProject({ name: "Keep" });
    const hide = await createProject({ name: "Hide" });

    await archiveProject(hide.id);

    const projects = await listProjects();
    expect(projects.map((p) => p.id)).toEqual([keep.id]);
  });

  it("completing a project records the date, moves it to the completed list, and is reversible", async () => {
    const project = await createProject({ name: "Thesis" });

    await completeProject(project.id);

    // gone from the main list, present in the completed list with a date
    expect(await listProjects()).toEqual([]);
    const completed = await listCompletedProjects();
    expect(completed.map((p) => p.id)).toEqual([project.id]);
    expect(completed[0].completedAt).toBeTruthy();

    // reversible: reopening puts it back in the main list
    await reopenProject(project.id);
    expect((await listProjects()).map((p) => p.id)).toEqual([project.id]);
    expect(await listCompletedProjects()).toEqual([]);
  });

  it("completion does not depend on any deadline — a project with nothing but a name can be completed", async () => {
    const project = await createProject({ name: "No deadline anywhere" });
    await completeProject(project.id);
    expect((await listCompletedProjects()).map((p) => p.id)).toEqual([project.id]);
  });

  it("renaming changes only the name (and the modified date)", async () => {
    const project = await createProject({ name: "Old name", description: "keep me" });

    await renameProject(project.id, "New name");

    const [reloaded] = await listProjects();
    expect(reloaded.name).toBe("New name");
    expect(reloaded.description).toBe("keep me");
    expect(reloaded.position).toBe(project.position);
    expect(reloaded.createdAt).toBe(project.createdAt);
    expect(reloaded.completedAt).toBeNull();
  });

  it("archiving hides the project but destroys nothing", async () => {
    const project = await createProject({ name: "Paused" });
    const task = await createTask({ projectId: project.id, title: "Still here" });

    await archiveProject(project.id);

    expect(await listProjects()).toEqual([]);
    // the task is untouched — archiving is reversible by design
    expect((await listTasks(project.id)).map((t) => t.id)).toEqual([task.id]);
  });

  it("deleting a project permanently destroys its tasks, sections and sub-projects", async () => {
    const parent = await createProject({ name: "Big project" });
    const child = await createProject({ name: "Sub-project", parentId: parent.id });
    await createSection(parent.id, "Week 1");
    await createTask({ projectId: parent.id, title: "Parent task" });
    await createTask({ projectId: child.id, title: "Child task" });

    await deleteProject(parent.id);

    expect(await listProjects()).toEqual([]); // the sub-project died with it
    expect(await listTasks(parent.id)).toEqual([]);
    expect(await listTasks(child.id)).toEqual([]);
    expect(await listSections(parent.id)).toEqual([]);
  });
});

describe("tasks", () => {
  let projectId: string;

  beforeEach(async () => {
    projectId = (await createProject({ name: "Test project" })).id;
  });

  it("a fresh task starts clean: open, zero priority, no dates, at the end of the list", async () => {
    const first = await createTask({ projectId, title: "First" });
    const second = await createTask({ projectId, title: "Second" });

    expect(first.status).toBe("open");
    expect(first.importance).toBe(0);
    expect(first.urgency).toBe(0);
    expect(first.scheduledFor).toBeNull();
    expect(first.dueAt).toBeNull();
    expect(first.completedAt).toBeNull();
    expect(first.isArchived).toBe(false);
    expect(first.position).toBe(0);
    expect(second.position).toBe(1);

    const tasks = await listTasks(projectId);
    expect(tasks.map((t) => t.title)).toEqual(["First", "Second"]);
  });

  it("checking a task done records the moment", async () => {
    const task = await createTask({ projectId, title: "Do it" });

    await setTaskStatus(task.id, "done");

    const [reloaded] = await listTasks(projectId);
    expect(reloaded.status).toBe("done");
    expect(reloaded.completedAt).toBeTruthy();
  });

  it("un-checking a task forgets it was ever completed", async () => {
    const task = await createTask({ projectId, title: "Oops, mis-click" });
    await setTaskStatus(task.id, "done");

    await setTaskStatus(task.id, "open");

    const [reloaded] = await listTasks(projectId);
    expect(reloaded.status).toBe("open");
    expect(reloaded.completedAt).toBeNull();
  });

  it("renaming changes only the title", async () => {
    const task = await createTask({
      projectId,
      title: "Old title",
      description: "keep me",
      scheduledFor: "2026-07-08",
    });

    await renameTask(task.id, "New title");

    const [reloaded] = await listTasks(projectId);
    expect(reloaded.title).toBe("New title");
    expect(reloaded.description).toBe("keep me");
    expect(reloaded.scheduledFor).toBe("2026-07-08");
    expect(reloaded.status).toBe("open");
    expect(reloaded.createdAt).toBe(task.createdAt);
  });

  it("the description can be added, changed, and removed", async () => {
    const task = await createTask({ projectId, title: "T" });

    await setTaskDescription(task.id, "some **markdown** notes");
    expect((await listTasks(projectId))[0].description).toBe("some **markdown** notes");

    await setTaskDescription(task.id, "changed");
    expect((await listTasks(projectId))[0].description).toBe("changed");

    await setTaskDescription(task.id, null);
    expect((await listTasks(projectId))[0].description).toBeNull();
  });

  it("importance and urgency are two separate 0–3 dials", async () => {
    const task = await createTask({ projectId, title: "T" });

    await setTaskPriority(task.id, 3, 1);

    const [reloaded] = await listTasks(projectId);
    expect(reloaded.importance).toBe(3);
    expect(reloaded.urgency).toBe(1);
  });

  it("rejects priority values outside 0–3 — garbage never enters the database", async () => {
    const task = await createTask({ projectId, title: "T" });

    await expect(setTaskPriority(task.id, 4, 0)).rejects.toThrow();
    await expect(setTaskPriority(task.id, 0, -1)).rejects.toThrow();
    await expect(setTaskPriority(task.id, 1.5, 0)).rejects.toThrow();
    await expect(createTask({ projectId, title: "Bad", importance: 7 })).rejects.toThrow();

    // and the failed attempts changed nothing
    const [reloaded] = await listTasks(projectId);
    expect(reloaded.importance).toBe(0);
    expect(reloaded.urgency).toBe(0);
  });

  it("planned day and deadline are independent and each can be set or cleared", async () => {
    const task = await createTask({ projectId, title: "T" });

    await setTaskSchedule(task.id, "2026-07-08", "2026-07-10T12:00:00Z");
    let [reloaded] = await listTasks(projectId);
    expect(reloaded.scheduledFor).toBe("2026-07-08");
    expect(reloaded.dueAt).toBe("2026-07-10T12:00:00Z");

    // deadline only, no planned day
    await setTaskSchedule(task.id, null, "2026-07-10T12:00:00Z");
    [reloaded] = await listTasks(projectId);
    expect(reloaded.scheduledFor).toBeNull();
    expect(reloaded.dueAt).toBe("2026-07-10T12:00:00Z");

    // both cleared
    await setTaskSchedule(task.id, null, null);
    [reloaded] = await listTasks(projectId);
    expect(reloaded.scheduledFor).toBeNull();
    expect(reloaded.dueAt).toBeNull();
  });

  it("moving a task to another day is just reschedule + regroup", async () => {
    // No dedicated "move" operation exists: the UI reschedules and regroups.
    await createTask({ projectId, title: "Stays", scheduledFor: "2026-07-13" });
    const mover = await createTask({ projectId, title: "Moves", scheduledFor: "2026-07-13" });

    await setTaskSchedule(mover.id, "2026-07-14", null);

    const buckets = groupTasksByDay(await listTasks(projectId));
    expect(buckets.map((b) => b.day)).toEqual(["2026-07-13", "2026-07-14"]);
    expect(buckets[0].tasks.map((t) => t.title)).toEqual(["Stays"]);
    expect(buckets[1].tasks.map((t) => t.title)).toEqual(["Moves"]);
  });

  it("swapping positions exchanges exactly two tasks and leaves the rest untouched", async () => {
    const a = await createTask({ projectId, title: "A" });
    const b = await createTask({ projectId, title: "B" });
    await createTask({ projectId, title: "C" });

    await swapTaskPositions(a.id, b.id);

    expect((await listTasks(projectId)).map((t) => t.title)).toEqual(["B", "A", "C"]);
  });

  it("refuses to swap with a task that does not exist", async () => {
    const a = await createTask({ projectId, title: "A" });

    await expect(swapTaskPositions(a.id, "ghost-id")).rejects.toThrow();

    // and the failed attempt changed nothing
    expect((await listTasks(projectId))[0].position).toBe(a.position);
  });

  it("deleting a task destroys it and its subtasks, leaving others untouched", async () => {
    const parent = await createTask({ projectId, title: "Parent" });
    await createTask({ projectId, title: "Subtask", parentId: parent.id });
    const other = await createTask({ projectId, title: "Unrelated" });

    await deleteTask(parent.id);

    const remaining = await listTasks(projectId);
    expect(remaining.map((t) => t.id)).toEqual([other.id]);
  });
});

describe("sections", () => {
  let projectId: string;

  beforeEach(async () => {
    projectId = (await createProject({ name: "Test project" })).id;
  });

  it("a new section goes to the end of its project's section list", async () => {
    const first = await createSection(projectId, "Week 1");
    const second = await createSection(projectId, "Week 2");

    expect(first.position).toBe(0);
    expect(second.position).toBe(1);
    expect((await listSections(projectId)).map((s) => s.name)).toEqual(["Week 1", "Week 2"]);
  });

  it("sections belong to exactly one project", async () => {
    const otherProject = await createProject({ name: "Other" });
    await createSection(projectId, "Mine");

    expect(await listSections(otherProject.id)).toEqual([]);
  });

  it("renaming a section changes only its name", async () => {
    const section = await createSection(projectId, "Old name");

    await renameSection(section.id, "New name");

    const [reloaded] = await listSections(projectId);
    expect(reloaded.name).toBe("New name");
    expect(reloaded.position).toBe(section.position);
    expect(reloaded.createdAt).toBe(section.createdAt);
  });

  it("deleting a section keeps its tasks — they drop back to the project's general list", async () => {
    const section = await createSection(projectId, "Doomed box");
    const task = await createTask({ projectId, title: "Survivor", sectionId: section.id });

    await deleteSection(section.id);

    expect(await listSections(projectId)).toEqual([]);
    const [reloaded] = await listTasks(projectId);
    expect(reloaded.id).toBe(task.id);
    expect(reloaded.sectionId).toBeNull(); // out of the box, still alive
  });
});
