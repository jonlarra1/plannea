import { getDb } from "./db";
import type { Project, Section, Task, TaskStatus } from "../core/types";

// The data layer: the ONLY place that knows SQL. The UI (and later the MCP
// module) call these typed functions and never touch the database directly.
// This is the "hook" the Phase 1 plan refers to — keep it UI-agnostic.

// ---- small helpers ----
const newId = (): string => crypto.randomUUID();
const nowIso = (): string => new Date().toISOString();
const fromBool = (n: number): boolean => n === 1;
const toBool = (b: boolean): number => (b ? 1 : 0);

// importance/urgency are integer dials 0..3 (see docs/STORAGE.md). The GUI
// offers them as a selector, so an invalid value reaching this layer means a
// bug in calling code — refuse loudly instead of storing garbage.
function assertPriorityLevel(name: "importance" | "urgency", value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 3) {
    throw new Error(`${name} must be an integer from 0 to 3, got ${value}`);
  }
}

// A project name / task title must be real text. The UI already blocks an empty
// field, so a blank one arriving here means a bug in calling code (or, later, an
// agent through the MCP module) — refuse it instead of storing a nameless row.
// Returns the trimmed text, which is what gets stored.
function requireText(label: "project name" | "task title", value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") throw new Error(`${label} cannot be empty`);
  return trimmed;
}

// next position at the end of a group (scopeCol IS scopeVal is null-safe)
async function nextPosition(
  table: "projects" | "sections" | "tasks",
  scopeCol: string,
  scopeVal: string | null,
): Promise<number> {
  const db = await getDb();
  const rows = await db.select<{ next: number }[]>(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next FROM ${table} WHERE ${scopeCol} IS $1`,
    [scopeVal],
  );
  return rows[0]?.next ?? 0;
}

// ---- row shapes as stored (snake_case) ----
interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  position: number;
  color: string | null;
  emoji: string | null;
  is_archived: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
interface SectionRow {
  id: string;
  project_id: string;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
}
interface TaskRow {
  id: string;
  project_id: string;
  section_id: string | null;
  parent_id: string | null;
  title: string;
  description: string | null;
  status: string;
  importance: number;
  urgency: number;
  scheduled_for: string | null;
  due_at: string | null;
  position: number;
  completed_at: string | null;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

const toProject = (r: ProjectRow): Project => ({
  id: r.id,
  name: r.name,
  description: r.description,
  parentId: r.parent_id,
  position: r.position,
  color: r.color,
  emoji: r.emoji,
  isArchived: fromBool(r.is_archived),
  completedAt: r.completed_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toSection = (r: SectionRow): Section => ({
  id: r.id,
  projectId: r.project_id,
  name: r.name,
  position: r.position,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toTask = (r: TaskRow): Task => ({
  id: r.id,
  projectId: r.project_id,
  sectionId: r.section_id,
  parentId: r.parent_id,
  title: r.title,
  description: r.description,
  status: r.status as TaskStatus,
  importance: r.importance,
  urgency: r.urgency,
  scheduledFor: r.scheduled_for,
  dueAt: r.due_at,
  position: r.position,
  completedAt: r.completed_at,
  isArchived: fromBool(r.is_archived),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// ============================ projects ============================

// The main list: active projects only (not archived, not completed).
export async function listProjects(): Promise<Project[]> {
  const db = await getDb();
  const rows = await db.select<ProjectRow[]>(
    "SELECT * FROM projects WHERE is_archived = 0 AND completed_at IS NULL ORDER BY position, created_at",
  );
  return rows.map(toProject);
}

export async function listCompletedProjects(): Promise<Project[]> {
  const db = await getDb();
  const rows = await db.select<ProjectRow[]>(
    "SELECT * FROM projects WHERE is_archived = 0 AND completed_at IS NOT NULL ORDER BY completed_at DESC",
  );
  return rows.map(toProject);
}

// Counts EVERY project row, whatever its state. Used by the first-run seed to
// tell "brand-new database" from "user emptied their active list" — the latter
// must not trigger re-seeding.
export async function countAllProjects(): Promise<number> {
  const db = await getDb();
  const rows = await db.select<{ n: number }[]>("SELECT COUNT(*) AS n FROM projects");
  return rows[0]?.n ?? 0;
}

export async function createProject(input: {
  name: string;
  description?: string | null;
  parentId?: string | null;
}): Promise<Project> {
  const name = requireText("project name", input.name);
  const db = await getDb();
  const ts = nowIso();
  const project: Project = {
    id: newId(),
    name,
    description: input.description ?? null,
    parentId: input.parentId ?? null,
    position: await nextPosition("projects", "parent_id", input.parentId ?? null),
    color: null,
    emoji: null,
    isArchived: false,
    completedAt: null,
    createdAt: ts,
    updatedAt: ts,
  };
  await db.execute(
    `INSERT INTO projects
       (id, name, description, parent_id, position, color, emoji, is_archived, completed_at, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      project.id,
      project.name,
      project.description,
      project.parentId,
      project.position,
      project.color,
      project.emoji,
      toBool(project.isArchived),
      project.completedAt,
      project.createdAt,
      project.updatedAt,
    ],
  );
  return project;
}

// Where a task goes when it belongs to no project in particular (decided with
// the user 2026-08-03). It is an ordinary project with a FIXED id, so it needs
// no schema change and stays recognisable after the user renames it. Its
// position is -1 so it sorts above the projects the user creates.
export const INBOX_PROJECT_ID = "inbox";

// Creates the Inbox if it isn't there yet; otherwise returns the existing one
// untouched. Safe to call on every start (and twice, under StrictMode).
export async function ensureInboxProject(): Promise<Project> {
  const db = await getDb();
  const [existing] = await db.select<ProjectRow[]>("SELECT * FROM projects WHERE id = $1", [
    INBOX_PROJECT_ID,
  ]);
  if (existing) return toProject(existing);

  const ts = nowIso();
  await db.execute(
    `INSERT INTO projects
       (id, name, description, parent_id, position, color, emoji, is_archived, completed_at, created_at, updated_at)
     VALUES ($1,$2,NULL,NULL,$3,NULL,NULL,0,NULL,$4,$5)`,
    [INBOX_PROJECT_ID, "Inbox", -1, ts, ts],
  );
  const [created] = await db.select<ProjectRow[]>("SELECT * FROM projects WHERE id = $1", [
    INBOX_PROJECT_ID,
  ]);
  return toProject(created);
}

export async function renameProject(id: string, name: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE projects SET name = $1, updated_at = $2 WHERE id = $3", [
    name,
    nowIso(),
    id,
  ]);
}

// Completion is independent of deadlines: it's a user action, and the date
// recorded is simply when they did it.
export async function completeProject(id: string): Promise<void> {
  const db = await getDb();
  const ts = nowIso();
  await db.execute("UPDATE projects SET completed_at = $1, updated_at = $2 WHERE id = $3", [
    ts,
    ts,
    id,
  ]);
}

export async function reopenProject(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE projects SET completed_at = NULL, updated_at = $1 WHERE id = $2", [
    nowIso(),
    id,
  ]);
}

export async function archiveProject(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE projects SET is_archived = 1, updated_at = $1 WHERE id = $2", [
    nowIso(),
    id,
  ]);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM projects WHERE id = $1", [id]);
}

// ============================ sections ============================

export async function listSections(projectId: string): Promise<Section[]> {
  const db = await getDb();
  const rows = await db.select<SectionRow[]>(
    "SELECT * FROM sections WHERE project_id = $1 ORDER BY position, created_at",
    [projectId],
  );
  return rows.map(toSection);
}

export async function createSection(projectId: string, name: string): Promise<Section> {
  const db = await getDb();
  const ts = nowIso();
  const section: Section = {
    id: newId(),
    projectId,
    name,
    position: await nextPosition("sections", "project_id", projectId),
    createdAt: ts,
    updatedAt: ts,
  };
  await db.execute(
    `INSERT INTO sections (id, project_id, name, position, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [section.id, section.projectId, section.name, section.position, section.createdAt, section.updatedAt],
  );
  return section;
}

export async function renameSection(id: string, name: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE sections SET name = $1, updated_at = $2 WHERE id = $3", [
    name,
    nowIso(),
    id,
  ]);
}

// Deleting a section keeps its tasks: the schema sets their section_id to
// NULL, so they drop back to the project's general list (decided 2026-07-07).
export async function deleteSection(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM sections WHERE id = $1", [id]);
}

// ============================ tasks ============================

export async function listTasks(projectId: string): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.select<TaskRow[]>(
    "SELECT * FROM tasks WHERE project_id = $1 AND is_archived = 0 ORDER BY position, created_at",
    [projectId],
  );
  return rows.map(toTask);
}

export async function createTask(input: {
  projectId: string;
  title: string;
  sectionId?: string | null;
  parentId?: string | null;
  description?: string | null;
  scheduledFor?: string | null;
  dueAt?: string | null;
  importance?: number;
  urgency?: number;
}): Promise<Task> {
  const title = requireText("task title", input.title);
  assertPriorityLevel("importance", input.importance ?? 0);
  assertPriorityLevel("urgency", input.urgency ?? 0);
  const db = await getDb();
  const ts = nowIso();
  const task: Task = {
    id: newId(),
    projectId: input.projectId,
    sectionId: input.sectionId ?? null,
    parentId: input.parentId ?? null,
    title,
    description: input.description ?? null,
    status: "open",
    importance: input.importance ?? 0,
    urgency: input.urgency ?? 0,
    scheduledFor: input.scheduledFor ?? null,
    dueAt: input.dueAt ?? null,
    position: await nextPosition("tasks", "project_id", input.projectId),
    completedAt: null,
    isArchived: false,
    createdAt: ts,
    updatedAt: ts,
  };
  await db.execute(
    `INSERT INTO tasks
       (id, project_id, section_id, parent_id, title, description, status, importance, urgency,
        scheduled_for, due_at, position, completed_at, is_archived, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      task.id,
      task.projectId,
      task.sectionId,
      task.parentId,
      task.title,
      task.description,
      task.status,
      task.importance,
      task.urgency,
      task.scheduledFor,
      task.dueAt,
      task.position,
      task.completedAt,
      toBool(task.isArchived),
      task.createdAt,
      task.updatedAt,
    ],
  );
  return task;
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const db = await getDb();
  const completedAt = status === "done" ? nowIso() : null;
  await db.execute(
    "UPDATE tasks SET status = $1, completed_at = $2, updated_at = $3 WHERE id = $4",
    [status, completedAt, nowIso(), id],
  );
}

export async function renameTask(id: string, title: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE tasks SET title = $1, updated_at = $2 WHERE id = $3", [
    title,
    nowIso(),
    id,
  ]);
}

export async function setTaskDescription(id: string, description: string | null): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE tasks SET description = $1, updated_at = $2 WHERE id = $3", [
    description,
    nowIso(),
    id,
  ]);
}

export async function setTaskPriority(
  id: string,
  importance: number,
  urgency: number,
): Promise<void> {
  assertPriorityLevel("importance", importance);
  assertPriorityLevel("urgency", urgency);
  const db = await getDb();
  await db.execute(
    "UPDATE tasks SET importance = $1, urgency = $2, updated_at = $3 WHERE id = $4",
    [importance, urgency, nowIso(), id],
  );
}

export async function setTaskSchedule(
  id: string,
  scheduledFor: string | null,
  dueAt: string | null,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE tasks SET scheduled_for = $1, due_at = $2, updated_at = $3 WHERE id = $4",
    [scheduledFor, dueAt, nowIso(), id],
  );
}

// Swaps the positions of two tasks (a reorder step decided by
// core/reorder.ts). A single UPDATE so the swap is atomic: both rows change
// or neither does.
export async function swapTaskPositions(aId: string, bId: string): Promise<void> {
  const db = await getDb();
  const rows = await db.select<{ id: string; position: number }[]>(
    "SELECT id, position FROM tasks WHERE id IN ($1, $2)",
    [aId, bId],
  );
  if (rows.length !== 2) {
    throw new Error(`swapTaskPositions: expected 2 tasks, found ${rows.length}`);
  }
  const [first, second] = rows;
  await db.execute(
    `UPDATE tasks
       SET position = CASE id WHEN $1 THEN $2 WHEN $3 THEN $4 END,
           updated_at = $5
     WHERE id IN ($1, $3)`,
    [first.id, second.position, second.id, first.position, nowIso()],
  );
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM tasks WHERE id = $1", [id]);
}
