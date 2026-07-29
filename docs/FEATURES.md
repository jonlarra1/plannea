# Features / Checklist

Features the app should have, sorted by topic. This is just a reference
checklist; it is not linked to the code. `(module)` marks items already decided
to be later modules, not part of the core MVP.

## Core: tasks and projects
- [ ] Add/create tasks (and projects) directly from the app UI — the basic capture flow (scheduled: ROADMAP 2.5; the data layer already supports it)
- [ ] Sections for different projects / internal sections
- [ ] Execution order of tasks within a day
- [ ] Subtasks nested inside other tasks
- [ ] Each task can have a longer description / body, beyond its one-line title
- [ ] Urgency / importance levels on tasks
- [ ] Loose notes (random reminders)
- [ ] Lists (markdown format)
- [ ] After a task has been assigned for some time, notify to delete or reset it
      (with a button)
- [ ] Done-task lifecycle (day-rollover model, decided 2026-07-14): a completed task stays shown as checked for the rest of the day it was completed (on Today/Tomorrow and its project); at the next day rollover (a check on app start) it auto-archives — it DISAPPEARS from the normal views but is NOT deleted (soft archive: the row and its `completed_at` stay in the DB). The only thing that hard-deletes archived/completed tasks is the manual clean-up action below.
- [ ] Settings menu (new surface, to build) with a "clean up completed tasks" action: permanently deletes archived/completed tasks from the DB — the deliberate, user-triggered purge (distinct from the automatic soft-archive above). Confirm-first, since it's destructive.
- [ ] Task ordering as a lens: view tasks manually ordered (the stored truth), or sorted by deadline (no deadline sinks to the bottom), urgency, or importance — sorting never rewrites the user's manual order (decided 2026-07-07)
- [ ] Sort-driven grouping on the date pages (decided 2026-07-14): the chosen sort also groups the page — by urgency level (Urgent/High/Medium/Low), by importance level (Critical/High/Medium/Low), or by due day for deadline. The other dial orders tasks inside each group (urgency groups read by importance, and vice-versa). Deadline is offered only on the Scheduled page (single-day pages don't need it). Each task carries a color-by-level tag for that secondary dial, and the group headings take the same level color: Low=green, Medium=yellow, High=red, Critical=near-black (no emoji — color alone carries the level).
- [ ] Drag-and-drop reordering: drag a task to any position instead of stepping with the up/down buttons; buttons stay (keyboard + precision) — decided 2026-07-13, scheduled Phase 3; manual view only, like all reordering
- [ ] Undo: deleting (or changing) something can be undone (idea 2026-07-07 — needs design: undo stack vs trash/soft-delete; until then, archive is the safe path and delete confirms first)
- [ ] Deadline-aware urgency (lens, not storage): the displayed urgency is the higher of the user's dial and what the approaching deadline implies; the stored dial is never overwritten (idea 2026-07-07, Phase 3 when urgency gets UI)
- [ ] Repetitive/recurring tasks (2026-07-08 — NOT in the schema yet; design decision pending: how it relates to the habits module, since "repeat" was earlier assigned there. Decide once, deliberately, before implementing)

## Views and pages (2026-07-08; refined 2026-07-13 into the app's PRIMARY navigation — all views are lenses over the same stored data; no new storage except recurring + calendar sync)
The left sidebar IS the navigation: a **Pages** group on top, then a **Projects** group below.
- [ ] Pages group — task lenses by date:
  - [ ] Today: tasks scheduled for today across all projects
  - [ ] Tomorrow: same, next day
  - [ ] Scheduled: all tasks that have a date
  - [ ] Unscheduled: all tasks with no date
  - (each sortable by urgency/importance/project via the sorting lens; reordering only in manual view)
- [ ] Projects group — a list of projects; opening one shows that project's tasks (sections + manual order + sorting lenses): the per-project view
- [ ] Calendar view (day / week / month) — LAST, it's the most complex; also the home for external calendar sync (Proton / Google Calendar)
- [x] Completed tasks (refined 2026-07-13, built 2026-07-29): the PRIMARY way to see them is a **"Show completed" toggle inside a project's view** — completed tasks are HIDDEN by default and the toggle reveals them, because the important tasks live in the Projects area. Built as a header pill reading "Show completed · N" (N = how many are hidden here) that flips to "Hide completed"; it is absent when the project has none, revealed tasks come back in their normal place, and the choice is remembered across restarts. The date pages are NOT filtered — a task ticked today stays visible there until the day rolls over. A broader global "Completed" view (everything finished, grouped by completion date/project) stays as a secondary idea, not the main mechanism.
- [ ] Recurring-tasks page: manage the repeat rules (depends on the recurring-tasks design above)
- Theme: light + dark, user-toggleable (decided 2026-07-13). Built 2026-07-29 as a THREE-way choice cycled from the sidebar — Light / Dark / **System**, where System follows the operating system's light-or-dark setting live and is the default for a fresh install.
- [ ] Theme polish, later (idea 2026-07-29): follow more of the system's look than just light-vs-dark (e.g. its accent colour), and let the user adjust the tone of a theme (warmer/cooler, more/less contrast) rather than only picking between two fixed palettes.
- Look: calm, airy, spacious — the markdown/monospace "ledger" direction was rejected (2026-07-13)

## Markdown and agent integration
- [ ] Everything in markdown format
- [ ] Agent access, concretely (clarified 2026-07-08): manage plannea from an AI chat — e.g. telling Claude "add a task to buy shoes for tomorrow" in a conversation (like a Claude Code session) creates the real task in the app. Same for completing, rescheduling, or asking "what's on my plate today?". Mechanism: the MCP server module (ROADMAP Phase 5) exposing the same data layer the UI uses — the agent is just another front-end, no separate storage.
- [ ] Access for Claude Code specifically (the MCP module makes plannea usable from any MCP-capable agent: Claude Code, claude.ai, others)

## Architecture and platform
- [ ] Modular app, so capabilities can be added
- [ ] Zoom in the desktop app
- [ ] Support for widgets
wr- [ ] Security as a first-class, ongoing concern (decided 2026-07-13): least-privilege Tauri capabilities, strict CSP, always-parameterized SQL, safe rendering of user markdown, secure secret storage for future calendar-sync OAuth, and clear boundaries on MCP agent access — a light pass at every phase checkpoint + a deeper audit before each release. Full detail in ROADMAP "Security".

## Time and productivity
- [ ] Pomodoro / stopwatch

## Calendar and planning
- [ ] Synced calendar (Proton / Google Calendar / self-hosted)
- [ ] Weather app integration, to plan based on the weather

## Habits and tracking
- [ ] Habit tracking
- [ ] Streak monitoring (consecutive days doing a task)

## Health tracking `(module)` (idea 2026-07-28 — the START of a bigger idea, more will be added later)
A module for logging health events over time, so patterns become visible (how often, how bad, when). It is a LOG, not a task list: entries are timestamped records, not things to check off. Everything below is an idea, not a decided design.
- [ ] Pain log: record a pain episode with WHERE it was (e.g. the head map for a headache: forehead / temple / behind the eye / neck…), HOW STRONG it was (an intensity scale), WHEN it started and ended, and other traits of that episode (type of pain, possible trigger, what relieved it, free-text note). Headaches are the first example, but the same log should work for any pain (back, stomach, knee…).
- [ ] Medication log: record every time a pill is taken (which one, dose, time), so intake history and gaps are visible.
- [ ] Contact-lens tracking: record usage — when a pair was opened / worn / thrown away — to know how long the current pair has been in use and when it is due to be replaced.
- [ ] More health items to come: this section is deliberately open — the user will add further trackers to it later.
- Open questions (decide before building): does this module store its own tables, or reuse the task schema? How does it relate to the habits/streaks module (which also records "did it happen today")? Does an entry ever need to appear on a date page, or does the module keep its own views? Health data is sensitive — it stays local, and no module (including MCP agent access) should expose it without a deliberate decision.

## Domain modules
- [ ] Sports management: training, races… `(module)`
- [ ] Shopping list, fully integrated into the app `(module)`

## Platforms & interfaces
- [ ] The front-end is a CHOOSABLE MODULE: on first run you pick the lighter TUI or the full GUI, and you can switch later. This must be part of the design from the start — the core + data layer stay UI-agnostic so any front-end sits on top of them.
- [ ] Keep `src/core/` and the data layer fully UI-agnostic (the shared "hook") so multiple front-ends (GUI, TUI, mobile) all use the same logic.
- [ ] GUI front-end: the full desktop window (the current React UI).
- [ ] TUI front-end: a lighter terminal interface on top of the same data layer.
- [ ] iOS app `(future project)` — feasible via Tauri v2 mobile, but needs a Mac + Xcode + Apple Developer account, a responsive/touch UI, and a sync rethink (sandboxed; agent access via MCP, not raw files).

## Process and design
- [ ] Define things gradually, step by step
- [ ] Make a draw.io of the design
