# Roadmap

A step-by-step, dependency-ordered analysis of what's left to build. Grounded in
the current code, not just the wishlist — see [FEATURES.md](FEATURES.md) for the
full feature checklist by topic and [STRUCTURE.md](STRUCTURE.md) for the file map
and architecture diagram.

## Where the code is today
- **Works:** load all `*.md` projects, parse frontmatter + `## day` headings +
  `- [ ]/[x]` tasks, toggle a task, move a task up/down, seed a welcome project
  on first run. (`src/core/project.ts`, `src/data/projectsRepo.ts`,
  `src/app/App.tsx`)
- **Missing even for MVP:** no create / add / rename / delete anywhere — `core`
  only has `toggleTask` + `moveTask`. No move-between-days, no delete project.
- **The constraint that shapes everything else:** the parser only keeps lines
  that match a day heading or a task. Anything else (free notes, indented
  subtasks, structure) is silently dropped on the next save. Tasks carry only
  `text` + `status` — there are no per-task IDs. Subtasks, urgency, reminders,
  and streaks all need richer task data, so this is the fork in the road.

## Plan, in order

### Phase 0 — Verify the foundation (do first, tiny)
- [x] Live click-test: run the app, toggle a task, confirm the `.md` file changes
      on disk (still-pending verification).
- [x] Round-trip checked against the real `parseProject`/`serializeProject`:
      confirmed LOSSY — `note:` lines, indented subtasks, and free text are
      dropped. This (plus the scaling needs) drove the storage decision below.

### Phase 1 — Storage foundation: SQLite + markdown for notes (DECIDED 2026-06-30)
Decision (Option 1): the task **structure** lives in a **SQLite database = source
of truth**; **free text** (task descriptions, project notes) is **markdown**
stored per item; **agent access** comes **later as its own MCP module** (Phase 5)
that plugs into this same data layer; optional markdown **export** for
portability/backup. Schema inspired by Planify. This **supersedes** the old
"markdown files are the source of truth" decision.
- [x] Design the schema — DONE, see `docs/STORAGE.md`. SQLite with projects, sections (core, from the start), tasks (subtasks via parent_id), stable TEXT ids, separate importance + urgency (0–3), both scheduled_for + due_at, completed_at, explicit order, description as a markdown field; labels designed, UI later.
- [ ] Set up SQLite in Tauri with migrations (use the `tauri-app-sql` skill).
- [ ] Build the data layer that replaces `projectsRepo`: typed CRUD + query
      functions. Keep them UI-agnostic — this is the clean **hook** the UI uses
      now and the later MCP module will reuse without changes.
- [ ] Pin markdown's role: descriptions/notes as markdown text; `![[id]]` links
      resolved via the DB; define the export format.

### Phase 2 — Finish the core CRUD slice
- [ ] Add core functions + UI for: create project, add task, rename task, delete
      task, delete/archive project, move task between days.

### Phase 3 — Core feature depth (from FEATURES "Core")
- [ ] Subtasks, urgency/importance, loose notes, lists, per-task descriptions.
- [ ] "Remind me to delete/reset a stale task" button (uses the
      `tauri-app-notification` skill).
- [ ] Done tasks stay shown as checked only for their completion day; after that
      day, auto-archive them into a separate "archived" list within the project.
      Needs a per-task completion date — depends on the Phase 1 data-model
      decision.

### Phase 4 — Establish the module system
- [ ] Build the `src/modules/` registration pattern, with pomodoro as the first
      module (self-contained, no data-model coupling — safest first module).

### Phase 5 — Later modules & platform (each its own slice)
- [ ] MCP server module (agent access): expose the Phase 1 data-layer hook as
      tools (create/complete/move tasks, set priority, create projects…). Reuses
      the data layer; adds no separate storage.
- [ ] Calendar sync, weather, habits/streaks, sport, shopping (streaks/search are
      simple DB queries thanks to the Phase 1 schema).
- [ ] Cross-cutting: zoom, window-state (`tauri-app-window-state`), global
      shortcuts (`tauri-app-global-shortcut`), widgets, and the TUI / iOS
      (`tauri-mobile`) front-ends.

## The decision that matters now
Phases 2-5 all sit on top of the task data model (Phase 1). Adding create/edit UI
before fixing the lossy parse and deciding on task IDs likely means rewriting that
work once subtasks/urgency arrive. Recommended order: **Phase 0 -> Phase 1 first**,
even though it is less visible than new buttons.
