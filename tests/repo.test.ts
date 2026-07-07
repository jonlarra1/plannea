import { beforeEach, describe, expect, it } from "vitest";
import { setDbClient } from "../src/data/db";
import {
  archiveProject,
  completeProject,
  createProject,
  createSection,
  createTask,
  deleteProject,
  listCompletedProjects,
  listProjects,
  listSections,
  listTasks,
  renameProject,
  reopenProject,
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
