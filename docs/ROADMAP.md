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
6. **Security pass**: quick review of what the phase added for security (Tauri capability/permission scope in `capabilities/default.json` still least-privilege? CSP intact? SQL still parameterized, never string-built? any new input trusted that shouldn't be? new dependencies sane — `npm audit` / `cargo audit`?). Depth scales with the phase; use the `tauri-security` skill and `/security-review`. See "Security" below.
7. **Close it out**: everything committed and pushed; from Phase 2 onward, consider a version tag + CHANGELOG entry.

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

- [x] Add app logging first — DONE 2026-07-13 (`tauri-plugin-log` in lib.rs: terminal + log file in the app's log dir, local-time timestamps; `log:default` capability; `src/app/logging.ts` wraps `@tauri-apps/plugin-log` with `logInfo`/`logWarn`/`logError`/`logDebug` + hooks for uncaught errors and unhandled rejections, wired in main.tsx). Verbosity decided 2026-07-13: Debug in dev builds, Info in release. Pending manual check in the running app (timestamps + file present).
- [x] Rebuild `App.tsx` + components onto `repo.ts` — DONE 2026-07-13. App shell holds project list (`listProjects`) + selected project's tasks (`listTasks`), groups them with `groupTasksByDay`, toggles via `setTaskStatus`, reorders via `findReorderSwap` + `swapTaskPositions`; every edit re-reads tasks from the DB (source of truth, no optimistic update); errors logged via `logError`. The 4 components keep their markup/classNames (look unchanged) and switch prop types to the DB shapes (`name`, real task ids, day = date or null → "Unscheduled"). Zero SQL/fs in components. tsc + `npm run build` + 42 tests green.
- [x] Old markdown data — DONE 2026-07-13: no migrator (old files were throwaway test data). Instead `src/data/seed.ts` seeds a "Welcome to plannea" project (sample tasks across today/tomorrow + one undated) on a brand-new DB only, guarded by `countAllProjects()` so it runs once per DB lifetime.
- [x] Verify manually in the running app — DONE 2026-07-13: clean relaunch loaded exactly 1 welcome project; toggling tasks persisted to the DB (3 rows `done` on disk); swap committed on its own.

#### 2.4.1 Visual design pass + page-based navigation shell (started 2026-07-13)

Redesigning the app's look and structure using the installed design skills (`frontend-design`, `web-design-guidelines`, `accessibility`). Decisions agreed with the user (2026-07-13):
- Sidebar becomes PAGE-BASED navigation: a **Pages** group (Today, Tomorrow, Scheduled, Unscheduled) on top, then a **Projects** group below (open a project to see its tasks). Calendar view (day/week/month) + external calendar sync (Proton/Google) come LAST — most complex.
- Two themes: light + dark, user-toggleable.
- Aesthetic: calm / airy / spacious; the markdown-ledger direction was rejected.
- Build order (user's call): build the LOOK first — styling, themes, page shell, and inactive placeholders ("+ project", "+ add task", per-task "⋯" menu) — using the real seeded tasks as the canvas.
- [x] Build the visual shell + light/dark theme system — DONE 2026-07-13/14 (page shell, sidebar page-nav, calm/airy styling, light+dark tokens via `[data-theme]`, theme toggle persisted to localStorage). NOTE: an AUTO/System theme mode (follow the OS via `prefers-color-scheme`) is decided but NOT built — see the new bullet below.
- [x] Wire each page to real cross-project data + sorting — DONE 2026-07-14. Pages already load every project's tasks; the sort mode also drives the grouping (test-first): urgency/importance group by that LEVEL (`groupByLevel`), deadline groups by DUE day (`groupByDay` with a due-day accessor), deadline offered only on Scheduled. Each task shows a color-by-level tag for the secondary dial (Low=green, Medium=yellow, High=red, Critical=near-black) and the group headings take the same level color. Custom `SortMenu` dropdown (own themed list; native select can't follow the theme on WebKitGTK). Empty states via `emptyNote`. Commits: `b2908b8` (sort menu), `59cc7b1` (grouping), `c0ff7e6` (tags) + a color-design refinement.
- [x] AUTO / System theme mode — DONE 2026-07-29. The sidebar button now cycles Light → Dark → **System** and names the ACTIVE choice ("◐ System theme"). System reads the OS `prefers-color-scheme` and follows it live (no restart); it is the default for a fresh install, while an already-saved light/dark choice is kept. New `src/app/theme.ts` holds the pure rules (`resolveTheme`, `nextChoice`, `parseChoice`) plus the localStorage + `matchMedia` wrappers; only the RESOLVED value is stamped on `data-theme`, so no style rule changed. 4 specs in `tests/theme.test.ts`. Scope kept deliberately small (user, 2026-07-29): detect and apply, nothing more — see the theme-polish bullet in Phase 3.
- [x] "Show completed" toggle in the PROJECT view (decided 2026-07-13) — DONE 2026-07-29. Completed tasks are hidden in a project view and the header pill reveals them in place (inside their section, in stored order); the date pages are untouched and still show ticked tasks, matching the day-rollover model. The pill reads "Show completed · N" (N = completed tasks in this project) and flips to an active "Hide completed"; it is not rendered at all when the project has none. One setting for all projects, remembered across restarts (`plannea-show-completed` in localStorage). Pure UI: a client-side filter in `App.tsx`, no repo or core change, so no new specs.
- [x] Project view groups by SECTIONS, not date — DONE 2026-07-13, test-first (7 tests): pure `src/core/groupBySection.ts`; generic `TaskGroupView` renders a day OR section group; `MainView` takes a generic `RenderGroup[]`; App loads sections and builds day-groups for pages / section-groups for a project; `seed.ts` adds sample sections. Named (even empty) sections show; loose tasks form a leading, heading-less bucket.

#### 2.5 New CRUD, one slice per commit (repo/core test first if logic is added, then UI)

- [x] Create project (sidebar) — DONE 2026-08-03. The "+ new project" row opens a small themed modal (`NewProjectDialog.tsx`) with a name field: Enter or Create saves, Escape / Cancel / a click outside closes, and Create stays disabled while the field is blank. Rules agreed with the user: the name is trimmed, blanks create nothing, duplicate names are allowed, the project lands at the end of the list, and the view does NOT jump to it — it simply appears in the sidebar. Data-layer guard added test-first (2 specs, 65 green): `createProject` now trims the name and throws on a blank one, so no caller — including the future MCP module — can store a nameless project.
- [x] Add task (within a day/project) — DONE 2026-08-03. The "+ add task" row turns into a text field exactly where the task will appear, and STAYS OPEN after each one (capture happens in bursts); Escape, or clicking away from an empty field, closes it. Placement rules agreed with the user: inside a project the row sits at the end of EACH SECTION (the section it sits in is the section the task joins, no date); on Today / Tomorrow / Unscheduled a SINGLE row sits at the end of the page and schedules the task for that page's day; an empty project falls back to that end-of-page row since it has no groups. **Scheduled has no add row yet** — it spans many days, so there is no honest date to give a task until the row can carry a date field of its own (a later slice, at which point Scheduled gets the same row with the date required). New concept: the **Inbox** — a default project with the fixed id `inbox`, created on start if missing, sitting above the user's own projects — is where page-added tasks land ("some tasks just have to be done, they don't belong to a project"). Test-first (4 specs, 69 green): the Inbox is created once, survives being renamed, and sorts first; task titles are trimmed and blank ones refused (`requireText`, now shared with `createProject`). The placement rules themselves went into `src/core/addTask.ts` (`newTaskTarget` + `addRowPlacement`) with 10 specs of their own — they were written inside `App.tsx` first, which broke the layer rule, and were pulled down the same day; the View/Page TYPES moved to `src/core/view.ts` so a core rule can name the current view without importing from the UI.
- [x] Rename task (inline edit) — DONE 2026-08-03. The "⋯" button on a task row is now a REAL menu (`TaskMenu.tsx`, same manners as `SortMenu`) whose first item is Rename; Delete and the other task actions join it in the following slices. Rename turns the title into a field holding the current text, selected ready to overwrite. Rules agreed with the user: **Enter or clicking away SAVES** (typed text is never thrown away — same principle as the add row), **Escape abandons** the edit, an emptied field simply closes and keeps the old title, and a failed write keeps the field open with what was typed. Test-first (1 spec, 80 green): `renameTask` now trims the new title and refuses a blank one (`requireText`, shared with `createTask`/`createProject`). No pure-core rule was needed here — the decision-free part is all UI.
- [ ] Delete task.
- [ ] Move task between days.
- [ ] Give the add row a date field, and with it an add row on the Scheduled page (deferred from the add-task slice, 2026-08-03 — Scheduled cannot pick a day for you, so it waits for a row that can carry one).
- [ ] Manage sections in a project: create / rename / delete, and assign a task to a section (repo already has `createSection`/`renameSection`/`deleteSection`). NOTE: the sections in `seed.ts` ("Planning", "This week") are just SAMPLE data to show the grouping — real sections are user-created; this slice is what makes them so (idea 2026-07-13).
- [ ] Project "⋯" menu (idea 2026-08-03): a project gets its own three-dots menu, the same idea as the task menu, holding everything you can do TO a project — rename, archive, delete, and later complete/reopen, colour and emoji. Rename project has no UI at all today, so it arrives with this menu. Settle when building: WHERE the menu lives (on the sidebar row on hover, mirroring the task row, and/or in the project view's header — the sidebar row is the natural first home), and whether it also appears on the Inbox, which can be renamed but should probably not be deletable since it is recreated on the next start anyway. Also fix `renameProject`, which still accepts a blank name while every other text writer refuses one (already in FIXES.md).
- [ ] Archive project + delete project (native confirm dialog — `tauri-app-dialog`) — these are the destructive items OF the project menu above, so they land together with it.

#### 2.6 Retire the legacy markdown path

- [ ] Delete `src/core/project.ts`, `src/core/frontmatter.ts`, `src/data/projectsRepo.ts` once nothing imports them.
- [ ] Docs sweep: update `STRUCTURE.md`, the architecture diagram, and `CODING_GUIDE.md` where they reference the old path.

#### 2.7 Phase checkpoint + release — v0.1.0

- [ ] README + GitHub repo description for external viewers (added 2026-07-08; can be done at ANY time — the wording must be timeless: what plannea IS — markdown-first, modular, local-first planner; Tauri v2 + React + SQLite; layered core/data/UI design with GUI now and TUI planned — never what works this week; status belongs to the roadmap checkboxes). The GitHub description/topics box is set on the repo page by the user (the agent shell has no GitHub credentials).
- [ ] Run the full phase checkpoint (see "Phase checkpoints" above) over everything Phase 2 added.
- [ ] DECIDE (deferred 2026-08-03, at the user's call — not now): whether to add component-test tooling. Today there is none (no jsdom/happy-dom, no testing-library), so components are verified by hand while pure rules and the data layer are specced. What it would buy: tests that open a component, type, press Enter and check the result — e.g. the add row stays open after a task, Escape closes it, a blank title can't be submitted, a failed write keeps what was typed (`AddTaskRow`, `NewProjectDialog`). Cost: two dev dependencies and a test environment setting. Natural moment to settle it is the test-quality review in the checkpoint above.
- [ ] Documentation + comment cleanup sweep: prune stale or now-confusing wording across the docs and the code comments before the release. Known example: the "The decision that matters now" section at the bottom of this file is out of date (it still says build the 2.1 test harness first, which is long done). Also re-read code comments/clarifications that may now read oddly out of context. Goal: what a fresh reader sees matches where the project actually is.
- [ ] Add an optimized release profile to `src-tauri/Cargo.toml` for packaging (from the rust-skills guide): `lto = "fat"`, `codegen-units = 1`, `strip = true` (smaller/faster shipped binary; deliberately NOT added earlier because it slows dev builds and there was nothing to ship — see `tauri-build` skill for packaging).
- [ ] First real security audit before shipping (see "Security" below): capability/permission scope, CSP, SQL parameterization sweep, `npm audit` + `cargo audit`, and whether the legacy `$APPDATA/projects` fs scope can be dropped once the markdown path is retired (2.6).
- [ ] Then the app finally works end-to-end on SQLite: tag `v0.1.0` and start `CHANGELOG.md` (Keep a Changelog format, `Unreleased` section going forward).

### Phase 3 — Core feature depth (each slice: repo/core change + tests, then UI)

- [ ] Views/pages (decided 2026-07-08, see FEATURES "Views and pages"; mostly UI over existing data — each needs only a small query + a pure grouping helper): **Today page first** (daily driver: tasks scheduled for today across projects, sortable by urgency/importance/project — reuses `sortTasks`), then Tomorrow (same view, different date), then the Completed page (grouped by completion date or project). Recurring tasks is NOT a view — new stored concept, design pending (overlap with the habits module), goes last.

- [ ] Subtasks: render `parent_id` children indented; decide + test parent/child completion behavior (does completing the parent complete children?).
- [ ] Urgency/importance in the UI (data layer already stores 0–3 for both).
- [ ] Drag-and-drop reordering (decided 2026-07-13): drag a task to any position in manual view, alongside the kept up/down buttons (mouse vs keyboard). Needs a new data-layer operation — "move task to position" shifting the tasks in between (a drop can jump several places, which neighbor-swap can't express) — test-first, then the UI (likely `dnd-kit`). Reordering stays manual-view-only.
- [ ] Per-task descriptions: markdown rendering + `![[id]]` links resolved via the DB (link resolution is a pure/core function — testable without UI).
- [ ] Done-task lifecycle (day-rollover model, decided 2026-07-14): a completed task stays visibly checked for the rest of its completion day; at the next day rollover (a check on app start) it auto-archives — it disappears from the normal views but is NOT deleted (soft archive via `is_archived`; `completed_at` already exists, and `listTasks` already skips archived rows). Test the rollover rule as a pure function of dates.
- [ ] Settings menu + manual completed-task cleanup (new, decided 2026-07-14): build a small Settings surface with a "clean up completed tasks" action that permanently deletes archived/completed tasks from the DB — the only hard delete in the lifecycle (the rollover above is soft). Confirm-first (destructive). Needs a new repo operation (e.g. `purgeArchivedTasks`), test-first.
- [ ] Undo for destructive actions (decided 2026-07-07 to want it; design first: undo stack vs trash/soft-delete — until it exists, delete asks for confirmation and archive is the promoted safe path).
- [ ] Theme polish beyond light/dark (idea 2026-07-29, deliberately deferred when the System mode was built): pick up MORE of the OS's look than just light-vs-dark — e.g. the system accent colour — and let the user adjust the TONE of a theme (warmer/cooler, more/less contrast) instead of only choosing between two fixed palettes. All of it is styling over the existing `[data-theme]` tokens; no data-layer work.
- [ ] Align the per-task labels into columns (idea 2026-07-29): today the project chip and the priority tag trail the task title, so titles of different lengths leave them ragged and the list reads as messy. Turn the task row into a light table — a title column, then the labels lining up down the page. Pure CSS/layout on `TaskItem`, no logic, so it can be picked up whenever the look is being polished.
- [ ] Multiple languages (idea 2026-08-03, see FEATURES "Architecture and platform"): move every user-visible string out of the components into language files, add a language picker that applies immediately, and make dates/week-start/number formats follow the chosen language too. Sits in this phase deliberately: it is a mechanical sweep whose SIZE grows with every screen we add, so it should not be left until the end — but it also should not block the core workflow slices. Worth doing right after the Phase 2 checkpoint, when the set of screens is stable and still small. No data-layer work: nothing translated is stored, the user's own text is never touched.
- [ ] "Remind me to delete/reset a stale task" button (`tauri-app-notification`).
- [ ] Loose notes and lists.

- [ ] Phase checkpoint before moving on (see "Phase checkpoints").

### Phase 4 — Establish the module system

The target (decided 2026-08-03, see FEATURES "Architecture and platform"): a module is **a separate package the user installs or does not install**, not a feature hidden behind a settings switch. The core app must work fully with zero modules installed, and a user who never wants the pomodoro, health, shopping or sport features should not carry their code at all.

- [ ] Decide what "installable package" means concretely BEFORE writing the pattern — this is the fork the whole phase hangs on. Roughly, from cheapest to most ambitious: (a) modules ship inside the app and the user turns them on, so "install" is a switch and the code is always present; (b) modules are separate npm/workspace packages, chosen at build time, so a build carries only what was selected; (c) modules are downloaded and loaded at runtime, which is the real "app store" model and the only one that lets a user add a module without a new build. Each answer implies a very different security story — (c) means running someone else's code inside the app — so settle it with the user, in plain language, before any code.
- [ ] Design the `src/modules/` registration pattern on top of that answer: how a module declares its UI surface, its data access (through `repo.ts` or its own tables, never raw SQL), and its permissions; how the app behaves when the module is absent; and what happens to a module's stored data when it is uninstalled (kept or deleted — the user's call).
- [ ] Pomodoro as the first module: self-contained, no data-model coupling — proves the pattern with minimal risk.

- [ ] Phase checkpoint before moving on (see "Phase checkpoints").

### Phase 5 — Later modules & platform (each its own slice)

- [ ] MCP server module (agent access): expose the data layer as tools (create/complete/move tasks, set priority, create projects…). Reuses `repo.ts`; adds no separate storage — this is where the layering pays off again.
- [ ] Calendar sync, weather, habits/streaks, sport, shopping (streaks/search are simple DB queries thanks to the schema).
- [ ] Auto-arrange a task into a time slot (idea 2026-07-29, see FEATURES "Calendar and planning"): give a task a due date and let the app place it at a concrete moment before that deadline, with URGENCY deciding how early and how good a slot it gets. Lands here because it only makes sense once there is a calendar surface with real time slots (and, ideally, the user's synced events to avoid). It needs a schema addition the tasks table does not have — WHEN IN THE DAY a task should happen (preferred moment: morning/afternoon/evening or a fixed hour) — which could be introduced earlier, alongside the urgency/importance UI in Phase 3. Settle first: coarse band vs real time, hint vs hard constraint, propose-vs-write the chosen slot, and how clashes between two tasks resolve. The placement rule itself is pure logic → `src/core/`, test-first.
- [ ] Health tracker module (added 2026-07-28, see FEATURES "Health tracking"): a timestamped LOG of health events — pain episodes (where it hurt, how strong, when, other traits — headaches first, then any pain), every pill taken, contact-lens usage — with more trackers to be added by the user later. Sits after the module system exists (Phase 4) because it is the first module with its own real data model, so it is the test of whether a module can own storage. Design questions to settle first: own tables vs the task schema, how it overlaps with habits/streaks, whether entries surface on date pages; and note that health data is sensitive — local only, and deliberately out of MCP agent reach unless the user decides otherwise (see "Security").
- [ ] Markdown export: dump the DB to `.md` files for backup/portability/agent-reading (define the format).
- [ ] Choosable front-end: first-run selector for the lighter TUI or the full GUI (switchable later) — both are front-ends over the same data layer. The GUI ships first; the TUI arrives here and reuses `core` + `data` untouched.
- [ ] Cross-cutting: zoom, window-state (`tauri-app-window-state`), global shortcuts (`tauri-app-global-shortcut`), widgets, iOS (`tauri-mobile`).

## Security (a first-class, ongoing concern — decided 2026-07-13)

plannea is local-first, but it still has real attack surface, and it grows as modules land. Security is not a one-off task: it's a light recurring pass at every phase checkpoint (point 6 there) plus a deeper dedicated audit before each release (first one at 2.7). Tools available: the `tauri-security` skill (capabilities/scopes/ACL), `/security-review`, `npm audit`, `cargo audit`.

What to check, and when it matters most:

- **Tauri capabilities & scopes** (`src-tauri/capabilities/default.json`): keep permissions least-privilege. Today it still grants a broad `$APPDATA/projects` fs scope from the legacy markdown path — revisit/drop it once 2.6 retires that path. Review every new permission a feature asks for.
- **CSP** (`tauri.conf.json`): keep a strict Content-Security-Policy so the webview can't load or exfiltrate to arbitrary origins; tighten it before release.
- **SQL injection**: the data layer must ALWAYS use parameterized queries (`$1`/`?` placeholders), never string-built SQL. Sweep for this each audit — it's the single most important app-level rule (`repo.ts`).
- **Untrusted input**: markdown descriptions/notes are user text — when they get rendered (Phase 3), render safely (no raw HTML injection / XSS). Any `![[id]]` link resolution must not become a path/entity escape.
- **Dependencies**: run `npm audit` + `cargo audit` at each audit; keep the supply chain small and known.
- **Highest-risk future surfaces** (deep audit required when they land, Phase 5):
  - **MCP server module** (agent access): exposing `repo.ts` as tools means an agent can mutate real data — needs clear boundaries on what it can do, and no ambient authority beyond the data layer.
  - **Calendar sync (Proton/Google)**: OAuth tokens/secrets must be stored securely (e.g. `tauri-app-stronghold` or the OS keychain), never in plain SQLite or logs; scope the OAuth grants minimally.
  - **Markdown export / import**: writing DB contents to files and reading them back is a path-handling + trust boundary.
- **Logging hygiene**: never log secrets/tokens/PII (rust-skills `obs-no-sensitive-data`); matters once sync/auth exist.

## The decision that matters now

Phase 1 is done; the temptation is to jump straight to visible UI work. Resist it for one step: build the test harness (2.1) first. Every slice after it — the UI swap, each CRUD operation, subtasks, the MCP module — gets verified against the same behavior specs instead of by hand-clicking, and the `DbClient` seam it introduces is also what keeps the data layer front-end-agnostic for the TUI.
