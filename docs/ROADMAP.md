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
- [ ] Live click-test: run the app, toggle a task, confirm the `.md` file changes
      on disk (still-pending verification).
- [ ] Confirm the round-trip is safe on a file that has notes / blank lines —
      this exposes the lossy-parse problem before we build on it.

### Phase 1 — Decide the data model (unblocks most features)
- [ ] Decide how a task is represented in markdown once it needs an ID,
      urgency/importance, subtasks, and notes. Options: pure markdown
      (indentation for subtasks, inline tags for priority) vs. a small per-task
      metadata block.
- [ ] Make parse <-> serialize loss-less (preserve content it doesn't
      understand) so saving never destroys user/agent edits.

### Phase 2 — Finish the core CRUD slice
- [ ] Add core functions + UI for: create project, add task, rename task, delete
      task, delete/archive project, move task between days.

### Phase 3 — Core feature depth (from FEATURES "Core")
- [ ] Subtasks, urgency/importance, loose notes, lists.
- [ ] "Remind me to delete/reset a stale task" button (uses the
      `tauri-app-notification` skill).

### Phase 4 — Establish the module system
- [ ] Build the `src/modules/` registration pattern, with pomodoro as the first
      module (self-contained, no data-model coupling — safest first module).

### Phase 5 — Later modules & platform (each its own slice)
- [ ] SQLite index (`tauri-app-sql`) when streaks/search need speed.
- [ ] Calendar sync, weather, habits/streaks, sport, shopping.
- [ ] Cross-cutting: zoom, window-state (`tauri-app-window-state`), global
      shortcuts (`tauri-app-global-shortcut`), widgets, agent/MCP access, and the
      TUI / iOS (`tauri-mobile`) front-ends.

## The decision that matters now
Phases 2-5 all sit on top of the task data model (Phase 1). Adding create/edit UI
before fixing the lossy parse and deciding on task IDs likely means rewriting that
work once subtasks/urgency arrive. Recommended order: **Phase 0 -> Phase 1 first**,
even though it is less visible than new buttons.
