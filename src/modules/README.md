# Modules

Future self-contained features live here, one folder per module — for example
`pomodoro/`, `habits/`, `calendar/`.

A module owns its own components, state, and (if needed) its own `data/` access.
It should depend on `core/` types but not reach into other modules directly.

There is intentionally **no plugin-registry / loader system yet**. With only a
core app and zero modules, any registration API would be guesswork. The first
real module added here is what will reveal the right shape for that mechanism —
build it then, not before.
