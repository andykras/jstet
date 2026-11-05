# JSTET — Agent Engineering Guide

> **Scope:** repository-wide instructions for coding agents and contributors.
> Keep this document aligned with the code that actually exists. It describes the project's preferred style, not a mandate to preserve historical mistakes.

## 1. Engineering philosophy

JSTET is a small browser puzzle game with a deliberately compact JavaScript game engine and a thin Vue presentation layer.

Follow these principles, in order:

1. **Preserve behavior.** Gameplay, timings, controls, scoring, rendering, and existing deployment behavior are contracts unless the task explicitly changes them.
2. **Make the smallest coherent change.** Solve the requested problem in the layer that owns it. Avoid unrelated formatting, sweeping renames, or opportunistic rewrites.
3. **Prefer direct algorithms.** A short function with a clear loop or data transformation is better than an elaborate class hierarchy or abstraction built for hypothetical future use.
4. **Keep the engine separate from the UI.** Vue presents state and receives input; game rules belong in the engine and game modules.
5. **Make state and time dependencies explicit enough to reason about.** Preserve existing contracts, but do not introduce more hidden global state, implicit mutation, or timing coupling without a concrete reason.
6. **Prove meaningful changes.** Use focused tests and a browser gameplay check where appropriate. Report what was actually run; never claim unperformed validation.

Do not add a framework, dependency, state-management layer, TypeScript conversion, or architectural pattern merely because it is fashionable.

## 2. Language policy

**English is the only language for repository-internal work.**

- Write source code, identifiers, comments, tests and test descriptions, documentation, agent instructions, commit messages, and PR titles/descriptions in English.
- Do not introduce non-English debug messages or developer-facing text.
- Preserve existing player-facing strings and localization unless the task explicitly requests a content or language change.
- Conversational responses to the user may follow the user's language; this does not change the repository language policy.

## 3. Current stack and commands

The current mainline uses:

- **Vue 3** with the **Options API** in existing single-file components.
- **Vuex 4** for state used by the UI.
- **mitt 3** as the game event bus; Vue 2 instance-event APIs are no longer used.
- **Vite 7** with `@vitejs/plugin-vue`.
- **Stylus** for component styles and shared variables.
- Plain **JavaScript ES modules**; no TypeScript compilation or application framework.
- **vite-plugin-pwa** for the generated service worker and the existing static manifest.

Use the scripts already defined in `package.json`:

```sh
npm install
npm run dev          # Vite dev server, port 1337
npm run test:unit    # node:test
npm run lint         # ESLint
npm run build        # production output in dist/
npm run preview      # local production preview
```

Node.js must satisfy `package.json` engines (currently `^20.19.0 || >=22.12.0`).
Do not assume `npm ci` will work: the repository currently ignores `package-lock.json`.
If a command cannot run in the available environment, state the limitation rather than marking it as passed.

## 4. Repository map and ownership

- `src/main.js` — initializes the Vue app, installs Vuex, registers global components, and mounts the root.
- `src/App.vue` — application composition, keyboard input, game initialization, and synchronization of engine events into Vuex.
- `src/components/registration.js` — global component registration via Vite's `import.meta.glob`; component names come from file basenames.
- `src/components/themes/` — visual themes. Map game values to classes/markup; keep gameplay algorithms out.
- `src/components/stakan.vue` — legacy/naive self-contained implementation. Treat it as an existing alternative and historical reference, **not** as the preferred architecture for new game features.
- `src/store.js` — Vuex state, mutations, and view getters.
- `src/utils/game.js` — engine lifecycle, frame loop, movement/collision orchestration, scoring, and event integration.
- `src/utils/gameBus.js` — shared `mitt` event bus.
- `src/utils/events.js` — keyboard repeat and active-event timing.
- `src/utils/piece.js`, `stakan.js`, `tetraminos.js` — piece and well representations and piece factories.
- `src/game/next.js`, `put.js`, `tetris.js`, `tetcolor.js`, `options.js` — gameplay operations and defaults.
- `src/vars.styl` — shared Stylus variables injected by Vite.
- `src/registerServiceWorker.js`, `vite.config.mjs`, `public/` — offline support and build/deployment contracts.
- `tests/unit/` — focused `node:test` checks for utilities, Vuex, and the event bus.

Place new code beside the existing owner of the behavior. Extract a reusable helper only when it removes meaningful duplication or creates a useful independent testing seam.

## 5. Runtime architecture

The main flow is:

```text
Keyboard / App.vue
  -> gameBus.emit(...) (mitt)
  -> setup(...) / events.js / game.js
  -> requestAnimationFrame loop and game/* operations
  -> gameBus.emit('update' | 'score' | 'lines' | 'bonus' | 'level' | 'done')
  -> Vuex mutations in App.vue
  -> Vuex getters
  -> themes/* rendering and Stylus classes
```

Important details:

- The engine uses `requestAnimationFrame` and `performance.now()`. Input repeat has its own first/next delays. Changing the scheduling order, intervals, or handling of pause/drop can change gameplay.
- `src/utils/game.js` keeps module-local engine state and the exported `game` object; `game/*` accesses the well and pieces through the store. Do not silently replace this architecture with a second competing source of truth.
- `mitt` uses `on`, `off`, and `emit`. Do not reintroduce removed Vue 2 APIs such as component `$on`/`$emit` as the engine event bus.
- `App.vue` currently clears bus handlers and stops the animation frame on unmount. Any new event subscription, timer, or browser listener must have a matching lifecycle strategy.
- Preserve event names and payloads unless all producers, consumers, and tests are changed together.

## 6. Gameplay and data invariants

Understand these contracts before touching collision, rotation, rendering, or clearing:

### Well

`Stakan(height, width, hiddenRows, ...)` constructs an array of rows with `.height` and `.width` properties. Its underlying array extends beyond the visible height to provide hidden rows.

- The bottom row and the first/last columns use **`-1`** as boundaries.
- **`0`** means empty.
- **`-2`** is used to mark blocks/lines during clearing.
- Positive cell values represent occupied blocks or colors.
- Engine code indexes the well directly; Vuex view getters translate template coordinates with `x - 1` / `y - 1`. Keep these conventions consistent.
- The default main-game well is currently created as `new Stakan(19, 9, 4, ...)`. Do not hardcode these dimensions elsewhere.

### Pieces and active state

- `Piece` intentionally returns an array enhanced with `.size`, `.R`, and `.get(x, y, rotation)`. It is **not** an ES class.
- Rotations are quarter-turn coordinate transformations in `piece.js`. Preserve the representation before optimizing or refactoring it.
- The active-piece object is `{ T, N, X, Y, R }`: current type, next type, horizontal position, vertical position, and rotation.
- The next-piece logic and TetColor color assignment live in `src/game/next.js`. Do not move them into a theme.
- The current game includes both Tetris-style line clearing and TetColor matching/removal paths. Preserve both even though the default UI is configured for TetColor.

### State and performance

- Vuex holds `cells`, `pieces`, `item`, and displayed counters/options.
- **`Object.freeze` is a deliberate, gameplay-critical performance optimization from Vue 2**, not incidental legacy code. It prevented Vue 2 from deeply observing the high-frequency mutable game data; the reactivity overhead otherwise made gameplay unacceptably slow.
- The existing freeze is **shallow**: the engine still mutates nested well cells directly. Do not mistake this for an immutable-state design or "fix" it by deep-freezing the board.
- Vue 3 has a different reactivity implementation; whether this optimization is still necessary or beneficial has **not** been established. **Preserve the existing `Object.freeze` calls unchanged** in ordinary feature work. Do not remove, replace, or refactor them as cleanup.
- Revisit this only in an explicitly requested performance/refactoring task, with representative gameplay benchmarks and rendering/regression checks before and after. Do not introduce per-frame structural cloning or a new state architecture without evidence.
- Avoid new cross-module mutable globals. If the task requires restructuring shared state, make the ownership and lifetime unambiguous and add tests first.

### Timing, scoring, and input

- Preserve collision checks, lock/drop sequencing, interval resets, line-clearing order, match cascade behavior, bonus computation, and game-over handling.
- The existing keyboard controls include arrows, Space (drop), P (pause), Y (new game), S (drop-mode toggle), N (next), and F (fill-mode toggle).
- Keep event start/stop semantics for held arrow keys. Do not turn continuous movement into repeated OS keydown handling.
- Treat gameplay changes as semantic changes: describe them explicitly and test the relevant boundary cases.

## 7. JavaScript style

Use the repository's actual `package.json` Prettier/ESLint settings as the source of truth:

- **2 spaces** for indentation.
- **Single quotes** for JavaScript strings.
- **No optional semicolons** (use a leading semicolon only when ASI makes it necessary).
- **No trailing commas**.
- **140-character** maximum line length.
- ES modules with `import`/`export`; prefer the existing `@/` alias for source imports.
- `camelCase` for regular variables and functions; preserve established domain abbreviations in engine contracts.
- Use `const` by default; use `let` only when reassignment is necessary.
- Prefer early returns and small, straightforward functions.
- Use plain loops for grid operations and frame-critical paths when they are clearer and cheaper than layered callbacks.
- Use concise arrow functions for local callbacks and utilities; use method syntax for object methods as neighboring code does.
- Comments should explain **why**, timing, invariants, or non-obvious behavior—not narrate trivial statements.
- New code must not contain large commented-out implementations, debug leftovers, unnecessary `console.log`, or placeholder abstraction layers.

Example of the intended level of directness:

```js
const isEmpty = (cells, x, y) => {
  if (!cells[y]) return false
  return cells[y][x] === 0
}
```

Do **not** imitate every historical shortcut. Existing files contain non-strict comparisons, comma expressions, prototype manipulation, and large blocks of commented-out code. These are legacy artifacts, **not** conventions for new code. Clean them only when necessary for the current change; avoid broad cosmetic churn.

## 8. Vue, templates, and Stylus

- Continue using Vue 3 **Options API** (`data`, `computed`, `methods`, lifecycle hooks) in existing components. Do not convert to Composition API/`<script setup>` unless explicitly requested.
- Use Vuex for UI-observable state and `mitt` for engine messages. Do not put the frame loop or cell-clearing algorithm inside a component.
- Preserve global component registration by filename until a deliberate migration changes it.
- Respect Vue 3 template rules; use stable `:key` values for loops and avoid mixing `v-if` and `v-for` on the same rendered node.
- Keep styles in the existing `<style lang="stylus">` / scoped Stylus pattern as appropriate. Use nested selectors and shared variables from `src/vars.styl`.
- The well's appearance depends on classes such as `N1`, `N-1`, `N-2` and adjacency classes (`left`, `right`, `top`, `bottom`, `item`, `empty`). These class/value mappings are visual contracts.
- Preserve `flex-direction: column-reverse` and coordinate-to-screen mapping unless intentionally redesigning the board.
- Do not add a CSS framework or replace the theme system as part of unrelated work.
- Existing `v-html` rendering is not permission to render untrusted strings as HTML.

## 9. Build and offline behavior

The project is deployable as a static application, including from a subdirectory.

- Keep Vite's relative `base: './'` behavior unless deployment requirements explicitly change.
- Preserve the port `1337` for local development.
- Keep `public/manifest.json` and existing icons available.
- `vite-plugin-pwa` currently generates `service-worker.js` without replacing the manifest or the explicit registration logic in `src/registerServiceWorker.js`.
- Changes to entrypoints, asset paths, registration, or caching must be checked in a production preview, not just the dev server.

## 10. Testing and acceptance

For a normal code change, run the relevant checks when the environment permits:

```sh
npm run test:unit
npm run lint
npm run build
```

Add `node:test` tests close to existing tests for algorithms that can be verified without a browser. Prefer deterministic input/output tests for rotations, boundaries, collision, clearing, matching, and scoring. Avoid snapshots that merely freeze incidental markup.

When changing gameplay, controls, Vue integration, or rendering, also perform—or request a local agent to perform—a browser smoke check:

1. Launch and restart the main TetColor game; verify piece movement, rotation, the next-piece preview, and the board layout.
2. Check pause, both drop modes, held-key repeat, collisions, game over, and score/level/bonus display.
3. Exercise clearing and color-match cascades, including successive matches and edge-of-board cases.
4. Check the legacy naive mode if related components or app initialization changed.
5. If the build/PWA path changed, verify `npm run preview`, relative asset paths, service-worker registration, and offline reload.

Existing unit coverage is intentionally limited; passing tests alone does **not** establish full gameplay equivalence.

Report validation precisely: **passed, failed, or not run**, including pre-existing failures and environmental blockers. Never say a browser/PWA behavior was checked unless it was actually exercised.

## 11. Change workflow

1. Read the touched files and their callers/callees before editing. Inspect the current branch and working tree; do not overwrite concurrent work.
2. Identify the owning module and the behavior that must remain unchanged.
3. Implement the smallest focused diff using existing patterns.
4. Add targeted tests for behavioral changes or discovered regressions.
5. Run available checks and inspect the diff for accidental formatting or unrelated changes.
6. Summarize **what changed**, **why**, **what was verified**, and **what remains unverified**.

Use a focused branch and PR for substantial work unless the user explicitly requests another workflow. Do not merge into `master`, force-push, rebase shared branches, or introduce GitHub Actions without explicit authorization.

## 12. Review checklist

Before calling a change complete, ask:

- Is game behavior preserved except for the requested change?
- Does this belong in the engine, game module, store, app, or theme?
- Did I keep the public object shapes, event names, coordinate conventions, and sentinel values intact?
- Did I avoid unnecessary packages, abstraction layers, new global state, or broad reformatting?
- Are new code, comments, tests, documentation, and Git metadata in English?
- Did I preserve the current Vue 3 / Vuex 4 / mitt / Vite / Stylus architecture?
- Are test claims and runtime verification accurate?

**Default rule: preserve the author's compact, algorithm-first style; improve correctness without increasing complexity unnecessarily.**
