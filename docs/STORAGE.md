# Storage

Reference for how plannea stores data: the architecture decision, the database schema, and what each field means. This is documentation; the real database migration is built from it.

## Architecture (decided 2026-06-30, "Option 1")

The task **structure** (projects, sections, tasks, subtasks, dates, priority, order) lives in a **SQLite database** — the single source of truth.

**Free text** (task descriptions, project notes) is **markdown**, stored in `description` columns; it supports `![[id]]` links that are resolved via the database.

**Agent access** is a later **MCP module** (Phase 5) that reuses the same data layer — the agent calls tools instead of editing files. An optional **markdown export** gives portability/backup.

This supersedes the original "markdown files are the source of truth" plan. The schema is inspired by [alainm23/planify](https://github.com/alainm23/planify).

## Hierarchy

Project → Section → Task → Subtask. A project can also nest under another project, and a task can nest subtasks — both via a `parent_id`. Sections are a core feature from the start; a task without a section just sits directly in its project.

```
Project: Move to a new apartment
  Section: Paperwork
    Task: Change my address
      Subtask: Tell the bank
      Subtask: Tell the post office
    Task: Cancel old internet
  Section: Packing
    Task: Buy boxes
```

## Schema

```sql
-- A project, optionally nested under a parent project
CREATE TABLE projects (
  id          TEXT PRIMARY KEY,            -- app-generated (uuid/nanoid)
  name        TEXT NOT NULL,
  description TEXT,                         -- markdown
  parent_id   TEXT REFERENCES projects(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,   -- order among siblings
  color       TEXT,
  emoji       TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,   -- bool (0/1)
  completed_at TEXT,                         -- set when the user marks the project completed (decided 2026-07-07)
  created_at  TEXT NOT NULL,                -- ISO-8601 string
  updated_at  TEXT NOT NULL
);

-- Named groups of tasks inside a project ("subsections")
CREATE TABLE sections (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- The core item; subtasks nest via parent_id
CREATE TABLE tasks (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  section_id    TEXT REFERENCES sections(id) ON DELETE SET NULL,
  parent_id     TEXT REFERENCES tasks(id)   ON DELETE CASCADE,   -- subtask
  title         TEXT NOT NULL,
  description   TEXT,                         -- markdown (supports ![[id]])
  status        TEXT NOT NULL DEFAULT 'open', -- 'open' | 'done'
  importance    INTEGER NOT NULL DEFAULT 0,   -- 0..3
  urgency       INTEGER NOT NULL DEFAULT 0,   -- 0..3
  scheduled_for TEXT,                          -- 'YYYY-MM-DD' day bucket; NULL = Unscheduled
  due_at        TEXT,                          -- optional deadline (ISO datetime)
  position      INTEGER NOT NULL DEFAULT 0,   -- order within its group
  completed_at  TEXT,                          -- set when done -> drives auto-archive
  is_archived   INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- Labels (designed now, UI later)
CREATE TABLE labels (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT
);
CREATE TABLE task_labels (
  task_id  TEXT NOT NULL REFERENCES tasks(id)  ON DELETE CASCADE,
  label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

CREATE INDEX idx_tasks_project    ON tasks(project_id);
CREATE INDEX idx_tasks_parent     ON tasks(parent_id);
CREATE INDEX idx_tasks_scheduled  ON tasks(scheduled_for);
CREATE INDEX idx_sections_project ON sections(project_id);
CREATE INDEX idx_projects_parent  ON projects(parent_id);
```

## Field notes

`id TEXT` everywhere is a stable identifier (uuid/nanoid) that survives edits and moves — needed for `![[ ]]` links, reminders, reordering, and future sync.

`parent_id` does double duty: it nests projects under projects, and subtasks under tasks.

`importance` and `urgency` are two separate 0–3 levels (Eisenhower-style), not one combined priority. The data layer rejects values outside integer 0–3 (decided 2026-07-07); the GUI presents them as a selector, so this guard exists to catch bugs in calling code, not user typos.

`scheduled_for` is the day a task appears under (replaces the old `## day` headings); `due_at` is a separate optional deadline. A task can have one, both, or neither.

`completed_at` is the timestamp set when a task is marked done — it powers the "stay checked only for the completion day, then auto-archive" feature.

The **Inbox** (decided 2026-08-03) is not a fourth state or a new table — it is an ordinary project row with the fixed id `inbox` and position `-1`, created on start if missing (`ensureInboxProject`). It is where a task goes when the user adds one from a date page, i.e. when it belongs to no project in particular. The fixed id is what identifies it, so renaming it changes nothing; deleting it simply means it is recreated on the next start. Its `-1` position is what floats it above the user's own projects in the normal `ORDER BY position` listing.

Project names and task titles are stored **trimmed** and can never be empty — the data layer refuses blank text (`requireText`, decided 2026-08-03), the same second-line-of-defence idea as the 0–3 priority guard.

Projects have three states (decided 2026-07-07): **active** (in the main list), **completed** (`completed_at` set — finished, listed separately as a "trophy shelf", reversible, independent of any deadline), and **archived** (`is_archived` — hidden without ceremony, e.g. paused/abandoned). Only deleting destroys data; delete cascades to the project's sections, tasks, and sub-projects.

`position` is the order of an item within its immediate group (its parent, its section, or its day) — it replaces the fragile reliance on line order.

Dates are stored as ISO-8601 **TEXT** and booleans as **INTEGER** (0/1), because SQLite has no native date or boolean types.

## Deferred (designed for, built later)

Labels UI, reminders table, a dedicated links table for `![[ ]]` (links can start as parsed-from-description), recurring tasks, and the markdown export format.
