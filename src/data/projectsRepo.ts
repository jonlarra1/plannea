import {
  readTextFile,
  writeTextFile,
  readDir,
  mkdir,
  exists,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
import { parseProject, serializeProject, type Project } from "../core/project";

// This is the ONLY module that talks to the filesystem. Everything above it
// (core, components) works with the in-memory Project model and never knows
// where the data physically lives. Today that's markdown files under the app
// data directory; a future SQLite index would slot in here without changing
// the rest of the app.

const PROJECTS_DIR = "projects";
const BASE = BaseDirectory.AppData;

function filePath(projectId: string): string {
  return `${PROJECTS_DIR}/${projectId}.md`;
}

async function ensureProjectsDir(): Promise<void> {
  if (!(await exists(PROJECTS_DIR, { baseDir: BASE }))) {
    await mkdir(PROJECTS_DIR, { baseDir: BASE, recursive: true });
  }
}

export async function listProjects(): Promise<Project[]> {
  await ensureProjectsDir();
  await seedIfEmpty();

  const entries = await readDir(PROJECTS_DIR, { baseDir: BASE });
  const markdownFiles = entries.filter((entry) => entry.name?.endsWith(".md"));

  const projects = await Promise.all(
    markdownFiles.map(async (entry) => {
      const raw = await readTextFile(`${PROJECTS_DIR}/${entry.name}`, { baseDir: BASE });
      return parseProject(raw);
    }),
  );

  return projects.sort((a, b) => a.order - b.order);
}

export async function saveProject(project: Project): Promise<void> {
  await ensureProjectsDir();
  await writeTextFile(filePath(project.id), serializeProject(project), { baseDir: BASE });
}

// On a brand-new install there are no files yet, so the app would open empty
// with nothing to demonstrate. Seed one example project the first time.
async function seedIfEmpty(): Promise<void> {
  const entries = await readDir(PROJECTS_DIR, { baseDir: BASE });
  const hasProjects = entries.some((entry) => entry.name?.endsWith(".md"));
  if (hasProjects) {
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const example: Project = {
    id: "welcome",
    title: "Welcome to plannea",
    status: "active",
    order: 1,
    days: [
      {
        heading: today,
        tasks: [
          { text: "Toggle this checkbox — it saves to a markdown file", status: "open" },
          { text: "Use the arrows to reorder a task", status: "open" },
          { text: "This line is already done", status: "done" },
        ],
      },
      {
        heading: "Unscheduled",
        tasks: [{ text: "Tasks with no day live here", status: "open" }],
      },
    ],
  };

  await saveProject(example);
}
