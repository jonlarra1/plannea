# Fixes and improvements

Two kinds of thing live here, because the line between them is thin and not worth arguing about:

- **Fixes** — something is wrong: it breaks, it does not save, it behaves differently from what was agreed, it looks broken.
- **Improvements** — something already exists and works, but it should work better: clearer wording, a nicer layout, fewer clicks, one more field in a form that is already there.

This is the place to write either of them down the moment it is noticed, so it is not lost and does not have to be remembered.

## This file vs the feature list

[FEATURES.md](FEATURES.md) is for **things the app has to have** — capabilities that do not exist yet at all. This file is for **what already exists**: making it correct, or making it better.

The question that separates them: **does the app already do this thing in some form?**

- No, it does not exist at all → **feature** → FEATURES + ROADMAP. Examples: a calendar view, habit tracking, subtasks, reminders.
- Yes, it exists, but it is wrong → **fix** → this file. Examples: a task saves under the wrong day; the list stops refreshing after a restart.
- Yes, it exists, but it should be better → **improvement** → this file. Examples: the "new project" dialog only asks for a name and should also accept a description or a colour; a heading is confusing; a button sits in an awkward place.

Two extra rules:

- If an improvement turns out to need real design work — new decisions, a new data model, several sessions — it stops being an improvement and moves to the roadmap. The line here is then deleted with a note saying where it went.
- When in doubt, write it here anyway. Moving a line to the roadmap later costs nothing; forgetting it costs more.

What is being built right now does not belong here — that lives in `handoff.md`.

## How to use it

- Add one line per item, as an unchecked box: `- [ ] (YYYY-MM-DD) what is wrong or what should be better — where it happens.`
- Mark improvements with the word "improve" so the two kinds stay easy to tell apart at a glance.
- Write it in plain language, as you would say it out loud. Something written badly still beats something not written down.
- Write items one at a time, whenever something is noticed — the list is meant to grow slowly, not to be filled in one sitting.
- When it is done, tick the box and add the date, plus a few words if useful: `- [x] (done YYYY-MM-DD) …`.
- Done items stay here as a record. When the list gets long, old ticked ones can be deleted in a docs sweep.

## Open

- [ ] (2026-08-03) improve — the dropdown menus repeat each other's styling. `.sort-menu__list` / `.sort-menu__option` and `.task-menu__list` / `.task-menu__option` say almost the same thing in `styles.css`; a shared pair of classes would keep them from drifting apart. Left as it is on purpose, to avoid touching the sort menu's verified look in the middle of another slice.
- [ ] (2026-08-03) improve — `renameProject` accepts a blank name, while `createProject`, `createTask` and `renameTask` all refuse one. Nothing in the app calls it yet, so nothing is broken today; it should get the same `requireText` guard (and its spec) when the rename-project slice is built.

## Done

_Nothing done yet._
