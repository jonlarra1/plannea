# Coding Guide

Conventions for plannea. Keep these consistent as the app grows — they're what
let new modules be added later without the codebase turning into a tangle.

## The layer rule (most important)

Code is split into three layers. Each may only depend on the ones above it:

| Layer         | Folder            | May import                     | Never imports          |
| ------------- | ----------------- | ------------------------------ | ---------------------- |
| Domain logic  | `src/core/`       | nothing (pure TypeScript)      | React, Tauri, fs       |
| Data access   | `src/data/`       | `core/`, Tauri plugins         | React                  |
| UI            | `src/components/`, `src/app/` | `core/`, `data/`   | (writes no fs/parse logic) |

Quick test for where code belongs:

- If it could run unchanged in a plain Node script (parsing, sorting,
  reordering, validating) → `core/`.
- If it reads or writes files / calls a Tauri plugin → `data/`.
- If it renders something or handles a click → `components/` or `app/`.

If you're about to write a regex or a `.map(...).sort(...)` inside a `.tsx`
file, stop — that logic belongs in `core/`, and the component should call it.

## TypeScript

- `strict` mode stays on (it's already set in `tsconfig.json`). Don't weaken it.
- No `any`. If a library is missing types, write a small local `interface`.
- Functions exported from `core/` and `data/` get an explicit return type.
  (Inference is fine for tiny inline callbacks.)
- Prefer `interface` for object shapes, `type` for unions like `"up" | "down"`.

## React

- Functional components only. No class components.
- One component per file; the file name matches the component
  (`TaskItem.tsx` exports `TaskItem`).
- Props are typed with an explicit `interface XProps` above the component.
- State lives at the **lowest** component that needs it. If two siblings need
  the same data, lift it to their nearest common parent (that's why `projects`
  and `selectedId` live in `app/App.tsx` and nowhere else).
- Edit operations return a **new** object instead of mutating, so React sees the
  change — see the `toggle`/`move` functions in `core/project.ts`.

## Comments

- Don't comment what the code already says (`// loop over tasks`).
- Do comment the non-obvious *why*: a library quirk, a deliberate trade-off, or
  something deferred on purpose. See the note in `core/frontmatter.ts` about why
  we don't use gray-matter — that's the kind of comment worth writing.
- A clear name beats a comment explaining an unclear one.

## Secrets

- Anything secret (API keys, OAuth tokens for future calendar sync, signing
  keys) goes in a `.env` file, which is gitignored. Never hard-code a secret in
  source — this repo is public.

## Modules (future)

Each new feature (pomodoro, habits, calendar…) gets its own folder under
`src/modules/`. It owns its components and state, depends on `core/` types, and
does not reach into other modules. Don't build a plugin-registry system until
the second module exists — see `src/modules/README.md`.
