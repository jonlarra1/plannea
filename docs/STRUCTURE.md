# Project structure

A map of the project's files with a brief description of each. Kept current as
files are added, moved, or removed. Lists only files that are **not** in
`.gitignore` (so no `node_modules/`, `dist/`, build output, or AI-assistance
files).

```
.
├── docs/
│   ├── CODING_GUIDE.md          # conventions: layer rule, TS/React rules, comments
│   ├── FEATURES.md              # feature checklist sorted by topic
│   └── STRUCTURE.md             # this file — the project file map
├── public/                      # static assets (tauri.svg, vite.svg)
├── src/
│   ├── app/
│   │   └── App.tsx              # shell; owns projects + selectedId state
│   ├── components/              # UI only
│   │   ├── DaySectionView.tsx   # renders one day's task group
│   │   ├── ProjectView.tsx      # renders a project's days + tasks
│   │   ├── Sidebar.tsx          # project list / selector
│   │   └── TaskItem.tsx         # one task row (checkbox, up/down)
│   ├── core/                    # pure logic, no React/Tauri
│   │   ├── frontmatter.ts       # YAML frontmatter split/join
│   │   └── project.ts           # types + parse/serialize/toggle/move
│   ├── data/
│   │   └── projectsRepo.ts      # ONLY file that touches the filesystem
│   ├── modules/
│   │   └── README.md            # placeholder for future feature modules
│   ├── main.tsx                 # React entry point
│   ├── styles.css
│   └── vite-env.d.ts
├── src-tauri/                   # Rust side
│   ├── capabilities/
│   │   └── default.json         # fs scoped to $APPDATA/projects
│   ├── icons/                   # generated app icons (16 boilerplate files)
│   ├── src/
│   │   ├── lib.rs               # fs plugin registered here
│   │   └── main.rs              # Rust entry point
│   ├── build.rs
│   ├── Cargo.toml
│   ├── Cargo.lock
│   ├── .gitignore
│   └── tauri.conf.json          # Tauri app config
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
