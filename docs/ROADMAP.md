# Roadmap

A step-by-step, dependency-ordered analysis of what's left to build. Grounded in the current code, not just the wishlist — see [FEATURES.md](FEATURES.md) for the full feature checklist by topic and [STRUCTURE.md](STRUCTURE.md) for the file map and architecture diagram.

## Where the code is today

No live status snapshot is kept here on purpose — the checked boxes below ARE the status, and the session-by-session detail lives in `handoff.md` (local, not committed). The one structural fact worth stating (true until step 2.4 lands): the app currently has **two engines** — the new, tested SQLite data layer (`src/data/repo.ts` + the pure `src/core/` helpers), which no screen uses yet, and the legacy markdown path (`src/core/project.ts`, `src/data/projectsRepo.ts`), which the UI still runs on. Phase 2 swaps the screen onto the new engine and then removes the old one.

## Testing principles (applies to every phase from here on)

- Tests are **behavior specs, not pass-stamps**: each test states how the feature *should* behave (from `STORAGE.md` and the feature's definition), written before or alongside the code. If a test fails, the default assumption is the code is wrong — fix the code, not the test.
- **Test each layer through its public API.** `src/core/` functions are pure and tested directly; the data layer is tested through the exported `repo.ts` functions; components get thin tests only where they hold logic.
- **The data layer is tested against a real SQLite database running the real migration file** — no mocked SQL, so the schema we ship is the schema we test.
- **The layering is the contract:** UI components call `repo.ts` functions and never SQL; `repo.ts` never imports UI. This is what lets the GUI (built first) and the future TUI share one tested data layer.

## Phase checkpoints (decided 2026-07-08)

Every time a main phase finishes (2→3, 3→4, …), we stop building and run a sanitizing checkpoint before starting the next phase. The checklist:

1. **Everything runs**: full test suite green, typecheck passes, `npm run build` passes, and the app actually launches and works by hand.
2. **Code review** of everything the phase added (Claude's `/code-review` or a manual pass): correctness first, then "can this be simpler/shorter?", dead code and leftover experiments removed.
3. **Test quality review**: do the tests still describe how the app SHOULD behave (not just mirror the code)? Did any behavior slip in without a spec? Any duplicated or misleading tests to clean?
4. **Layer audit**: `core/` imports nothing, `data/` is the only place touching SQL, UI components only call `repo`/`core` — no leaks across the borders.
5. **Docs match reality**: ROADMAP, STRUCTURE, STORAGE, FEATURES, and handoff say what the code actually does; stale notes deleted.
6. **Close it out**: everything committed and pushed; from Phase 2 onward, consider a version tag + CHANGELOG entry.

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

#### 2.1 Test harness ✅ done

- [x] Added Vitest and the `npm test` script; commands recorded in `CLAUDE.md`. (`AGENTS.md` deleted 2026-07-07 — no other AI tools in use.)
- [x] Extracted the `DbClient` interface (`execute` / `select`) in `src/data/db.ts`; the app lazily loads the `@tauri-apps/plugin-sql` implementation, tests inject their own via `setDbClient()`. `repo.ts` unchanged.
- [x] Test adapter `tests/helpers/memoryDb.ts`: Node's built-in SQLite (`node:sqlite`, no extra package) on an in-memory database that runs the **real** `0001_init.sql` migration and translates the `$1` placeholder style.
- [x] Harness smoke test in `tests/repo.test.ts`: `createProject` → `listProjects` returns it — real repo code against the real schema. 2 tests green.

#### 2.2 Behavior tests for the existing data layer

Written from `STORAGE.md`'s intended behavior; where code and spec disagree, the code changes.

- [x] Projects — DONE 2026-07-07, test-first, 8 tests green. Rules agreed with the user: create appends at the end; the main list shows only active projects; NEW completed state (`completed_at` column + `completeProject`/`reopenProject`/`listCompletedProjects`) — independent of deadlines, reversible, separate from archive; rename touches only the name; archive hides but destroys nothing; delete cascades to sections, tasks, and sub-projects. Sub-projects stay schema-only (no UI planned; sections are the normal division).
- [x] Tasks — DONE 2026-07-07, test-first, 9 tests (one red → green). Rules agreed: fresh task starts clean (open, zero priority, no dates, appended at the end); done records the moment; un-checking WIPES the completion date (repeating work belongs to the future habits module, not tasks); rename touches only the title; description is free markdown, removable; NEW: the data layer rejects priority values outside integer 0–3 (the GUI will offer a selector, so this guard catches bugs, not users); planned day and deadline are independent and clearable; deleting a task cascades to its subtasks.
- [x] Sections — DONE 2026-07-07, test-first (2 red → green). Rules agreed: a new section appends at the end of its project's list; sections stay minimal (name + order, no extra properties until a real need appears); rename touches only the name; NEW `renameSection` + `deleteSection`; deleting a section KEEPS its tasks (they drop back to the project's general list — deleting a box doesn't burn what's inside).
- [x] Position scoping — DECIDED 2026-07-08: position numbers stay one sequence per project (no schema change); groups (a day, a section, a parent) display their slice in that order; reordering swaps a task with its visible neighbor within the group, so relative order survives moves between days.

#### 2.3 Missing operations, test-first

- [x] Reordering — DONE 2026-07-08, test-first (7 tests red → green), split by layer: `src/core/reorder.ts` `findReorderSwap` decides which two neighbors swap (pure, edge-safe); `repo.ts` `swapTaskPositions` performs the swap in one atomic UPDATE and refuses unknown tasks. UI rule agreed: reordering only in manual view — lenses hide the arrows.
- [x] Sorting lens `src/core/sortTasks.ts` — DONE 2026-07-07, test-first: four view modes (manual / deadline with no-deadline sinking to the bottom / urgency / importance), ties keep manual order, never mutates the input or the stored positions. First pure-core logic of the new era; GUI and future TUI both reuse it.
- [x] Pure helpers in `src/core/`: group tasks by day — DONE 2026-07-13, test-first (6 tests red → green): `src/core/groupByDay.ts` `groupTasksByDay` buckets tasks by `scheduledFor`, days oldest-first, one "unscheduled" bucket last (user decision), no empty buckets, never mutates. Deliberately does NOT sort inside buckets (user decision): sort with `sortTasks` first, then group — two composable lenses.
- [x] Move-between-days is `setTaskSchedule` + regrouping — DONE 2026-07-13: covered by a repo-level test (reschedule, regroup, task lands in the new day's bucket); no dedicated "move" operation needed.

#### 2.4 Like-for-like UI swap (no new features yet)

- [ ] Add app logging first (`tauri-plugin-log`: writes to the terminal and a log file, captures frontend errors) — decided 2026-07-07, so failures during and after the swap are visible without a debugger.
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

#### 2.7 Phase checkpoint + release — v0.1.0

- [ ] README + GitHub repo description for external viewers (added 2026-07-08; can be done at ANY time — the wording must be timeless: what plannea IS — markdown-first, modular, local-first planner; Tauri v2 + React + SQLite; layered core/data/UI design with GUI now and TUI planned — never what works this week; status belongs to the roadmap checkboxes). The GitHub description/topics box is set on the repo page by the user (the agent shell has no GitHub credentials).
- [ ] Run the full phase checkpoint (see "Phase checkpoints" above) over everything Phase 2 added.
- [ ] Then the app finally works end-to-end on SQLite: tag `v0.1.0` and start `CHANGELOG.md` (Keep a Changelog format, `Unreleased` section going forward).

### Phase 3 — Core feature depth (each slice: repo/core change + tests, then UI)

- [ ] Views/pages (decided 2026-07-08, see FEATURES "Views and pages"; mostly UI over existing data — each needs only a small query + a pure grouping helper): **Today page first** (daily driver: tasks scheduled for today across projects, sortable by urgency/importance/project — reuses `sortTasks`), then Tomorrow (same view, different date), then the Completed page (grouped by completion date or project). Recurring tasks is NOT a view — new stored concept, design pending (overlap with the habits module), goes last.

- [ ] Subtasks: render `parent_id` children indented; decide + test parent/child completion behavior (does completing the parent complete children?).
- [ ] Urgency/importance in the UI (data layer already stores 0–3 for both).
- [ ] Per-task descriptions: markdown rendering + `![[id]]` links resolved via the DB (link resolution is a pure/core function — testable without UI).
- [ ] Done-task lifecycle: tasks stay visibly checked only on their completion day, then auto-archive into an "archived" list (a day-rollover check on app start; `completed_at` already exists). Test the rollover rule as a pure function of dates.
- [ ] Undo for destructive actions (decided 2026-07-07 to want it; design first: undo stack vs trash/soft-delete — until it exists, delete asks for confirmation and archive is the promoted safe path).
- [ ] "Remind me to delete/reset a stale task" button (`tauri-app-notification`).
- [ ] Loose notes and lists.

- [ ] Phase checkpoint before moving on (see "Phase checkpoints").

### Phase 4 — Establish the module system

- [ ] Design the `src/modules/` registration pattern (how a module declares UI surface + data access — through `repo.ts` or its own storage, never raw SQL).
- [ ] Pomodoro as the first module: self-contained, no data-model coupling — proves the pattern with minimal risk.

- [ ] Phase checkpoint before moving on (see "Phase checkpoints").

### Phase 5 — Later modules & platform (each its own slice)

- [ ] MCP server module (agent access): expose the data layer as tools (create/complete/move tasks, set priority, create projects…). Reuses `repo.ts`; adds no separate storage — this is where the layering pays off again.
- [ ] Calendar sync, weather, habits/streaks, sport, shopping (streaks/search are simple DB queries thanks to the schema).
- [ ] Markdown export: dump the DB to `.md` files for backup/portability/agent-reading (define the format).
- [ ] Choosable front-end: first-run selector for the lighter TUI or the full GUI (switchable later) — both are front-ends over the same data layer. The GUI ships first; the TUI arrives here and reuses `core` + `data` untouched.
- [ ] Cross-cutting: zoom, window-state (`tauri-app-window-state`), global shortcuts (`tauri-app-global-shortcut`), widgets, iOS (`tauri-mobile`).

## The decision that matters now

Phase 1 is done; the temptation is to jump straight to visible UI work. Resist it for one step: build the test harness (2.1) first. Every slice after it — the UI swap, each CRUD operation, subtasks, the MCP module — gets verified against the same behavior specs instead of by hand-clicking, and the `DbClient` seam it introduces is also what keeps the data layer front-end-agnostic for the TUI.
