# JSTET — Visual FX 2077 / Stage 0 handoff

> Updated: 2026-11-07  
> Branch: `feat/tetcolor-visual-fx-2077`  
> Status: **Code and event-contract design complete; full-repository and browser QA pending**  
> Scope: opt-in scaffolding only. **There are no new visual effects yet.**

## Delivered

1. `src/utils/preferences.js` adds `visualFxEnabled: false` to the existing version-1 player preference object. Old v1 saves without this field load with FX off, and explicit opt-in survives reload. Arcade/Prism, reduced motion, audio and drop behavior remain independently configurable; no storage writes are added to the game loop.
2. `src/App.vue` provides an opt-in **Visual effects** checkbox in Settings using the existing live `persistPreferences()` workflow. The root gets `fx-enabled` **only** when opted in and when the modern game (not Legacy) is running. Switching the setting does not rebuild or restart the game.
3. `src/utils/visualFx.js` provides `toVisualFxCell(x, y, dimensions)`. This maps zero-based engine-array coordinates into top-left-origin, zero-based **visible** rows/columns and returns `null` for boundaries, hidden rows or invalid coordinates. It does not reference DOM or Vuex.
4. `tests/unit/visual-fx.test.js` covers default-off/invalid preferences, v1 migration, opt-in persistence and independence, UI opt-in/gating, both well sizes and clipping of hidden rows/borders.

**Baseline remains unchanged with FX Off:** No CSS block materials, renderer, engine, timings, audio, board, Next preview, or game-rule files were modified in Stage 0. The `fx-enabled` class is a hook for later stages only.

## Existing event timeline (source audit)

- `src/utils/game.js` is the gameplay authority. `setup(gameBus)` installs commands, and engine updates emit `update` to synchronize the current piece into Vuex.
- Successful placement via `put(item)` emits `sound:drop` once at the locking boundary. For TetColor, `getThreeBlock()` detects matches and marks the selected game cells with `-2`; `sound:clear` fires when matching is detected, and again for detected cascades. For Classic, `getSolidLines()` marks rows with `-2` before the clear loop.
- Clearing is performed by the existing frame loop after `clearSpeed()` intervals. TetColor supports sequential per-block or batch removal. Score and line counters are published separately from the detection event.
- Combo awards use `matchStreak` / `comboBonusForStreak`. Cascade rewards use `chainBonus` / `cascadeBonus`. Both update the authoritative engine score and emit `bonus`; they are **not** the same event.
- Audio in `src/utils/sounds.js` listens to the existing command and `sound:*` events. FX must **not** trigger a second audio playback by remapping these events.

### Planned discrete FX bus events (Stage 2 onward)

These names/payloads are **a contract for implementation**, not yet emitted in Stage 0. Producers live at real engine boundaries; Vue cosmetics are consumers only. Use stable event shapes and shallow immutable snapshots, never retain references to mutable board rows.

| Event | When | Minimal payload |
| --- | --- | --- |
| `fx:move` | **Successful** lateral move or rotation | `{ from, to, cells, action }` |
| `fx:hard-drop` | Hard-drop path resolved | `{ from, to, cells, distance }` |
| `fx:lock` | Successful lock, aligned with `sound:drop` | `{ cells, hard }` |
| `fx:clear-start` | Match/complete line detected before cells are removed | `{ cells, mode, batch }` |
| `fx:clear-step` | One clearing batch or step actually applied | `{ cells, mode }` |
| `fx:combo` | Nonzero consecutive-piece combo bonus awarded | `{ cells, amount, streak }` |
| `fx:cascade` | A new TetColor gravity cascade is detected and rewarded | `{ cells, amount, depth }` |

`cells` is a small immutable array of `{ column, row, color }` values where `column` and `row` are **visible board** coordinates; do not include boundary or hidden-row cells. The descriptor may also include a small monotonically increasing run ID, introduced together with the first producer to avoid stale animations. Preserve separate `sound:*`, `score`, `bonus` and `update` semantics. Do not emit cosmetic events in the steady-state RAF loop. No extra engine/gameplay scheduling for FX.

**Important:** `getThreeBlock()` and `getSolidLines()` overwrite matched cell colors with the `-2` sentinel. When implementing Stage 3, capture exact affected coordinates **and their original colors before that overwrite** (using a small focused snapshot or metadata from the detection path; do not clone the whole board every frame). Clear effects play independently of the real game's removal timing.

## Coordinate contract

For engine array dimensions `{ width, height }`, playable array coordinates are `1 <= x < width - 1`, `1 <= y < height`. Mapping:

```text
column = x - 1
row    = height - 1 - y

TetColor: width=9, height=19 => 7 columns x 18 rows
  engine (1,18) -> visual (0,0)   // upper-left
  engine (7,1)  -> visual (6,17)  // lower-right

Classic: width=12, height=21 => 10 columns x 20 rows
  engine (10,20) -> visual (9,0)
  engine (1,1)   -> visual (0,19)
```

The shared renderer uses `flex-direction: column-reverse`, so the model's Y axis is bottom-up but overlay rows are top-down. Convert to CSS pixels only in the presentation layer using the actual measured well/cell geometry; do not derive pixels in the engine. The existing maximum-fit mobile layout and Next preview must not be resized by FX.

## FX lifecycle and budget (acceptance contract for implementation stages)

- **Default Off:** no enhanced block CSS, overlay, particles, timers or animation listeners. Opt-in uses a root CSS gate. Turning FX Off later must unmount/dispose transient visuals immediately.
- **Reduced motion:** app preference and `prefers-reduced-motion` both suppress transient motion, even if FX is opted in. Nonanimated scores and block materials remain readable.
- **Pause/visibility/restart/mode switch/legacy/unmount:** cancel pending FX and release listeners. No artifacts from the previous game or previous board dimensions.
- **Bounded animation counts:** implement a hard cap on active transient effects and scheduled timers; drop excess decorative events, **never** gameplay events. Short effect lifetimes (~80–400 ms), no permanent per-cell active animations over the entire settled well.
- **Performance target:** consistent responsive input and approximately 60 FPS on a representative mid-range phone. Future gates compare frame-time and memory observations with a baseline, avoiding CSS filters/huge shadow updates across many cells.

## Verification

**Performed in this environment:**

- Reviewed the repository's `AGENTS.md`, main App/settings flow, preference persistence, engine events, TetColor/Classic clearing paths, shared block CSS, Next preview, sound hooks, and existing relevant unit tests.
- Executed **5/5 isolated Node.js tests** for the preference and coordinate helpers in a local test fixture reproducing the committed module logic: passed; `node --check` for both helper modules: passed.
- Added **6 tests** in the repository, including an App template static assertion. The repository's 6-test file was **not** run as a whole in the actual repo environment.

**Not performed / environment blocker:**

- Full `npm run test:unit`, `npm run lint` and `npm run build`: not run. This execution environment cannot clone `github.com` (no DNS/network) and the entire repository/dependencies are unavailable locally. Do not infer a green build from the isolated test fixture.
- Actual browser screenshots, mobile device QA, production preview and representative FPS/memory baseline: not run. No local browser/repository session available here.
- No PR merge, deployment or GitHub Actions was initiated.

## Browser acceptance for Stage 0

On local Mac/Opencode (after checking out the branch), capture before/after side-by-side screens at ~390×844 and ~1366×768 and collect a basic frame-time trace while playing TetColor and Classic:

1. Fresh settings: Visual effects is unchecked. Both modes retain their original block palette, gray TetColor well, Next preview and full-size mobile grid.
2. Existing v1 preferences (theme/audio/reduced-motion choices) remain intact; new FX is still unchecked. Opt in, reload, and confirm it stays checked.
3. Turning it on/off during an active game changes only the cosmetic opt-in flag, never score/board/session state; there are no actual FX in Stage 0.
4. When switched into Legacy, the root never has `fx-enabled`; returning restores the chosen opt-in state without leaking listeners.
5. Reduced motion, sound toggle, pause, hard/soft drop, matches/cascades and mobile controls remain correct.
6. Run `npm run test:unit`, `npm run lint`, `npm run build` and check dev/prod preview.

**Handoff:** Once full tests and Stage 0 browser baseline are captured, proceed to **Stage 1 — living TetColor glass blocks**. Keep all new Stage 1 block treatment scoped under `.jstet-app.fx-enabled`; when FX is Off render exact pre-FX pixels.
