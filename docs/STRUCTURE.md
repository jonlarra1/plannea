# Project structure

A map of the project's files with a brief description of each. Kept current as
files are added, moved, or removed. Lists only files that are **not** in
`.gitignore` (so no `node_modules/`, `dist/`, build output, or AI-assistance
files).

**Architecture diagram:** [`architecture.drawio`](architecture.drawio) — how the
code layers fit together and how data flows. Open it in VS Code with the Draw.io
Integration extension (`hediet.vscode-drawio`), or at
[app.diagrams.net](https://app.diagrams.net) via *File → Open from → Device*.

```
.
├── docs/
│   ├── architecture.drawio      # editable draw.io diagram of the code architecture
│   ├── CODING_GUIDE.md          # conventions: layer rule, TS/React rules, comments
│   ├── FEATURES.md              # feature checklist sorted by topic
│   ├── ROADMAP.md               # step-by-step, dependency-ordered build plan
│   ├── STORAGE.md               # data architecture + SQLite schema reference
│   └── STRUCTURE.md             # this file — the project file map
├── public/                      # static assets (tauri.svg, vite.svg)
├── src/
│   ├── app/
│   │   ├── App.tsx              # shell; owns projects + selectedId state
│   │   └── logging.ts           # frontend half of logging: log* wrappers + uncaught-error hooks
│   ├── components/              # UI only
│   │   ├── DaySectionView.tsx   # renders one day's task group
│   │   ├── ProjectView.tsx      # renders a project's days + tasks
│   │   ├── Sidebar.tsx          # project list / selector
│   │   └── TaskItem.tsx         # one task row (checkbox, up/down)
│   ├── core/                    # pure logic, no React/Tauri
│   │   ├── frontmatter.ts       # YAML frontmatter split/join (legacy markdown path)
│   │   ├── groupByDay.ts        # buckets tasks by scheduled day (unscheduled last)
│   │   ├── project.ts           # legacy markdown types + parse/serialize/toggle/move
│   │   ├── reorder.ts           # decides which two neighbors swap on move up/down
│   │   ├── sortTasks.ts         # task-ordering lens (manual/deadline/urgency/importance)
│   │   └── types.ts             # domain model (Project, Section, Task) for the DB
│   ├── data/                    # data layer — only place that knows SQL/fs
│   │   ├── db.ts                # opens the shared SQLite connection
│   │   ├── repo.ts              # typed CRUD/query functions (the data-layer hook)
│   │   └── projectsRepo.ts      # legacy markdown repo (to be retired in Phase 2)
│   ├── modules/
│   │   └── README.md            # placeholder for future feature modules
│   ├── main.tsx                 # React entry point
│   ├── styles.css
│   └── vite-env.d.ts
├── src-tauri/                   # Rust side
│   ├── capabilities/
│   │   └── default.json         # fs scoped to $APPDATA/projects
│   ├── icons/                   # generated app icons (16 boilerplate files)
│   ├── migrations/              # SQL schema migrations (applied on startup)
│   │   └── 0001_init.sql        # initial schema (projects, sections, tasks, labels)
│   ├── src/
│   │   ├── lib.rs               # registers fs, opener, and sql (with migrations)
│   │   └── main.rs              # Rust entry point
│   ├── build.rs
│   ├── Cargo.toml
│   ├── Cargo.lock
│   ├── .gitignore
│   └── tauri.conf.json          # Tauri app config
├── tests/                       # Vitest tests (run with `npm test`)
│   ├── helpers/
│   │   ├── makeTask.ts          # minimal task factory shared by the pure-core specs
│   │   └── memoryDb.ts          # in-memory SQLite DbClient running the real migration
│   ├── groupByDay.test.ts       # specs for the day-bucket grouping lens
│   ├── reorder.test.ts          # specs for the neighbor-swap reorder logic
│   ├── repo.test.ts             # data-layer behavior specs (roadmap 2.2: projects, tasks, sections)
│   ├── sortTasks.test.ts        # specs for the pure task-ordering lens
│   └── tsconfig.json            # editor types for the tests folder (Node APIs)
├── .vscode/
│   └── extensions.json
├── README.md
├── index.html                   # Vite HTML entry
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── .gitignore
```
