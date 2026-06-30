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
- [ ] Keep `src/core/` fully platform-agnostic so multiple front-ends can sit on
      top of the same core logic
- [ ] TUI: a lighter terminal interface on top of the core, as an alternative to
      the GUI `(future project)`
- [ ] iOS app `(future project)` — feasible via Tauri v2 mobile, but needs a
      Mac + Xcode + Apple Developer account, a responsive/touch UI, and a
      rethink of the markdown storage/sync model (sandboxed, no agent access)

## Process and design
- [ ] Define things gradually, step by step
- [ ] Make a draw.io of the design
