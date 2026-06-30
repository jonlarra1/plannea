// Domain model — mirrors the SQLite schema (see docs/STORAGE.md), but in
// camelCase TS. These are the shapes the UI and (later) the MCP module work
// with; the data layer maps DB rows <-> these types.

export type TaskStatus = "open" | "done";

export interface Project {
  id: string;
  name: string;
  description: string | null; // markdown
  parentId: string | null; // nested project
  position: number;
  color: string | null;
  emoji: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  projectId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  sectionId: string | null;
  parentId: string | null; // subtask nesting
  title: string;
  description: string | null; // markdown
  status: TaskStatus;
  importance: number; // 0..3
  urgency: number; // 0..3
  scheduledFor: string | null; // "YYYY-MM-DD" day bucket
  dueAt: string | null; // ISO datetime deadline
  position: number;
  completedAt: string | null; // set when done
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}
