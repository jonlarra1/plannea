# Roadmap

A step-by-step, dependency-ordered analysis of what's left to build. Grounded in the current code, not just the wishlist — see [FEATURES.md](FEATURES.md) for the full feature checklist by topic and [STRUCTURE.md](STRUCTURE.md) for the file map and architecture diagram.

## Where the code is today

- **Works (new path):** the SQLite storage foundation is done and committed — migration `src-tauri/migrations/0001_init.sql`, connection in `src/data/db.ts`, and the typed, UI-agnostic data layer `src/data/repo.ts` (projects: create/list/rename/archive/delete; sections: create/list; tasks: create/list/status/rename/description/priority/schedule/delete). Verified writing real rows to `plannea.db`.
- **Works (old path, still what the UI runs on):** load `*.md` projects, parse day headings + checkbox tasks, toggle, move up/down. (`src/core/project.ts`, `src/data/projectsRepo.ts`, `src/app/App.tsx`)
- **The gap:** the UI has never touched the database — it still reads/writes the lossy markdown files. There are also no automated tests, and the data layer has no reorder operation (position is only set at creation).

## Testing principles (applies to every phase from here on)

- Tests are **behavior specs, not pass-stamps**: each test states how the feature *should* behave (from `STORAGE.md` and the feature's definition), written before or alongside the code. If a test fails, the default assumption is the code is wrong — fix the code, not the test.
- **Test each layer through its public API.** `src/core/` functions are pure and tested directly; the data layer is tested through the exported `repo.ts` functions; components get thin tests only where they hold logic.
- **The data layer is tested against a real SQLite database running the real migration file** — no mocked SQL, so the schema we ship is the schema we test.
- **The layering is the contract:** UI components call `repo.ts` functions and never SQL; `repo.ts` never imports UI. This is what lets the GUI (built first) and the future TUI share one tested data layer.

## Plan, in order

### Phase 0 — Verify the foundation ✅ done

- [x] Live click-test: toggle a task, confirm the `.md` file changes on disk.
- [x] Round-trip check against the real `parseProject`/`serializeProject`: confirmed LOSSY (notes, indented subtasks, free text dropped) — drove the storage decision below.

### Phase 1 — Storage foundation: SQLite + markdown for notes ✅ done (committed `dfa6108`)

Decision (Option 1, 2026-06-30): task **structure** lives in **SQLite = source of truth**; **free text** (descriptions, notes) is **markdown stored per item**; **agent access** comes later as its own MCP module (Phase 5); optional markdown **export** for portability. Schema inspired by Planify. Supersedes "markdown files are the source of truth".

- [x] Schema designed — see `docs/STORAGE.md` (projects, sections, tasks with `parent_id` subtasks, TEXT ids, importance + urgency 0–3, `scheduled_for` + `due_at`, `completed_at`, explicit `position`, markdown `description`; labels designed, UI later).
- [x] SQLite set up in Tauri with migrations (`tauri-plugin-sql` + `@tauri-apps/plugin-sql`); app creates `~/.config/com.plannea.app/plannea.db` with all tables.
- [x] Data layer built: `src/core/types.ts` + `src/data/db.ts` + `src/data/repo.ts`, verified end-to-end.

### Phase 2 — Test harness, then wire the GUI to the data layer ⬅ NEXT

The GUI is the first front-end we build, but it stays a replaceable layer over `repo.ts` — everything below the components must work (and be tested) without any UI attached, so the TUI can reuse it all later.

#### 2.1 Test harness (do first — everything after leans on it)

- [ ] Add Vitest and an `npm test` script; record the command in `CLAUDE.md` and `AGENTS.md`.
- [ ] Extract a thin `DbClient` interface (`execute` / `select`) from `src/data/db.ts`; the app injects the `@tauri-apps/plugin-sql` implementation, `repo.ts` depends only on the interface.
- [ ] Test adapter: implement `DbClient` with an in-process SQLite (e.g. `better-sqlite3` or `node:sqlite`) on an in-memory database that runs the **real** `0001_init.sql` migration; adapter translates the `$1` placeholder style.
- [ ] Harness smoke test: `createProject` → `listProjects` returns it, running the real repo code against the real schema.

#### 2.2 Behavior tests for the existing data layer

Written from `STORAGE.md`'s intended behavior; where code and spec disagree, the code changes.

- [ ] Projects: create sets position at end; `listProjects` excludes archived; rename/archive/delete work; delete cascades to the project's sections and tasks (assert the FK behavior we intend).
- [ ] Tasks: create defaults (status `open`, appended position, timestamps); `setTaskStatus("done")` sets `completed_at` and reopening clears it; rename/description/priority/schedule/delete; `listTasks` excludes archived and orders by position.
- [ ] Sections: create/list per project, ordered.
- [ ] Decide + test position scoping: `nextPosition` for tasks currently scopes by project only — define what order means once sections/subtasks/days coexist (likely per section or per day), and encode it in tests.

#### 2.3 Missing operations, test-first

- [ ] `reorderTask` (move up/down within its group) — the one MVP operation the data layer lacks.
- [ ] Pure helpers in `src/core/`: group tasks by day (`scheduled_for`), sort by position — pure functions with direct tests; components use these instead of doing logic inline.
- [ ] Move-between-days is `setTaskSchedule` + regrouping — cover with a test at the core-helper level.

#### 2.4 Like-for-like UI swap (no new features yet)

- [ ] Rebuild `App.tsx` + components to load from `repo.ts`: sidebar of projects, tasks grouped by day, checkbox toggle (`setTaskStatus`), up/down reorder (`reorderTask`). Components receive data + callbacks; zero SQL, zero file access.
- [ ] Decide what happens to the old markdown data: recommend seeding a fresh welcome project in the DB (current files are test data, not worth a migrator).
- [ ] Verify manually in the running app (toggle + reorder persist across restart), then commit the swap on its own.

#### 2.5 New CRUD, one slice per commit (repo/core test first if logic is added, then UI)

- [ ] Create project (sidebar).
- [ ] Add task (within a day/project).
- [ ] Rename task (inline edit).
- [ ] Delete task.
- [ ] Move task between days.
- [ ] Archive project + delete project (native confirm dialog — `tauri-app-dialog`).

#### 2.6 Retire the legacy markdown path

- [ ] Delete `src/core/project.ts`, `src/core/frontmatter.ts`, `src/data/projectsRepo.ts` once nothing imports them.
- [ ] Docs sweep: update `STRUCTURE.md`, the architecture diagram, and `CODING_GUIDE.md` where they reference the old path.

#### 2.7 Release checkpoint — v0.1.0

- [ ] When 2.1–2.6 are done the app finally works end-to-end on SQLite: tag `v0.1.0` and start `CHANGELOG.md` (Keep a Changelog format, `Unreleased` section going forward).

### Phase 3 — Core feature depth (each slice: repo/core change + tests, then UI)

- [ ] Subtasks: render `parent_id` children indented; decide + test parent/child completion behavior (does completing the parent complete children?).
- [ ] Urgency/importance in the UI (data layer already stores 0–3 for both).
- [ ] Per-task descriptions: markdown rendering + `![[id]]` links resolved via the DB (link resolution is a pure/core function — testable without UI).
- [ ] Done-task lifecycle: tasks stay visibly checked only on their completion day, then auto-archive into an "archived" list (a day-rollover check on app start; `completed_at` already exists). Test the rollover rule as a pure function of dates.
- [ ] "Remind me to delete/reset a stale task" button (`tauri-app-notification`).
- [ ] Loose notes and lists.

### Phase 4 — Establish the module system

- [ ] Design the `src/modules/` registration pattern (how a module declares UI surface + data access — through `repo.ts` or its own storage, never raw SQL).
- [ ] Pomodoro as the first module: self-contained, no data-model coupling — proves the pattern with minimal risk.

### Phase 5 — Later modules & platform (each its own slice)

- [ ] MCP server module (agent access): expose the data layer as tools (create/complete/move tasks, set priority, create projects…). Reuses `repo.ts`; adds no separate storage — this is where the layering pays off again.
- [ ] Calendar sync, weather, habits/streaks, sport, shopping (streaks/search are simple DB queries thanks to the schema).
- [ ] Markdown export: dump the DB to `.md` files for backup/portability/agent-reading (define the format).
- [ ] Choosable front-end: first-run selector for the lighter TUI or the full GUI (switchable later) — both are front-ends over the same data layer. The GUI ships first; the TUI arrives here and reuses `core` + `data` untouched.
- [ ] Cross-cutting: zoom, window-state (`tauri-app-window-state`), global shortcuts (`tauri-app-global-shortcut`), widgets, iOS (`tauri-mobile`).

## The decision that matters now

Phase 1 is done; the temptation is to jump straight to visible UI work. Resist it for one step: build the test harness (2.1) first. Every slice after it — the UI swap, each CRUD operation, subtasks, the MCP module — gets verified against the same behavior specs instead of by hand-clicking, and the `DbClient` seam it introduces is also what keeps the data layer front-end-agnostic for the TUI.
