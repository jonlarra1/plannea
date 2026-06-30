# Features / Checklist

Features the app should have, sorted by topic. This is just a reference
checklist; it is not linked to the code. `(module)` marks items already decided
to be later modules, not part of the core MVP.

## Core: tasks and projects
- [ ] Sections for different projects / internal sections
- [ ] Execution order of tasks within a day
- [ ] Subtasks nested inside other tasks
- [ ] Each task can have a longer description / body, beyond its one-line title
- [ ] Urgency / importance levels on tasks
- [ ] Loose notes (random reminders)
- [ ] Lists (markdown format)
- [ ] After a task has been assigned for some time, notify to delete or reset it
      (with a button)
- [ ] Done tasks stay shown as checked only for the day they were completed;
      after that day they are auto-archived into a separate "archived" list
      within the same project

## Markdown and agent integration
- [ ] Everything in markdown format
- [ ] Easy integration with an agent
- [ ] Access for Claude Code

## Architecture and platform
- [ ] Modular app, so capabilities can be added
- [ ] Zoom in the desktop app
- [ ] Support for widgets

## Time and productivity
- [ ] Pomodoro / stopwatch

## Calendar and planning
- [ ] Synced calendar (Proton / Google Calendar / self-hosted)
- [ ] Weather app integration, to plan based on the weather

## Habits and tracking
- [ ] Habit tracking
- [ ] Streak monitoring (consecutive days doing a task)

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
