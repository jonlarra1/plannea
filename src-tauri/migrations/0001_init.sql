-- plannea initial schema (see docs/STORAGE.md for the design + rationale)

CREATE TABLE projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  parent_id   TEXT REFERENCES projects(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,
  color       TEXT,
  emoji       TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,                        -- set when the user marks the project completed
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE sections (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE tasks (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  section_id    TEXT REFERENCES sections(id) ON DELETE SET NULL,
  parent_id     TEXT REFERENCES tasks(id)   ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'open',
  importance    INTEGER NOT NULL DEFAULT 0,
  urgency       INTEGER NOT NULL DEFAULT 0,
  scheduled_for TEXT,
  due_at        TEXT,
  position      INTEGER NOT NULL DEFAULT 0,
  completed_at  TEXT,
  is_archived   INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE labels (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  color TEXT
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
