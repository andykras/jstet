# Active Piece Motion Interpolation

> Status: **PROPOSAL — documentation only**
> Scope: modern TetColor/Classic board renderer; no gameplay or legacy-engine changes.
> Related: [TetColor Visual FX 2077](./tetcolor-visual-fx-2077.md)

## 1. Problem statement

The active piece currently moves in discrete logical grid steps, and the renderer immediately redraws it at the next cell position. The result is a visible snap between cells rather than continuous visual movement.

This is a presentation limitation, not a game-physics defect. Collision, gravity, locking, scoring and clearing should remain grid-based and authoritative.

### Legacy `stakan.vue`

The legacy renderer uses the same basic model:

- `getValue()` overlays the active piece onto the board using `currX` / `currY`.
- `render()` validates `tryX` / `tryY` / `tryRotate`, then copies accepted coordinates into the current state.
- The template turns the resulting values into per-cell `N*` classes.
- Soft Drop uses `requestAnimationFrame` to advance through logical rows more frequently, but each update is still a discrete cell position.
- There is no transform-based interpolation of the active piece between those positions.

So yes: `stakan.vue` has the same snap-to-grid rendering behavior. It is a historical, self-contained implementation, not an existing smooth-motion solution to reuse.

### Modern TetColor renderer

The current path has the same underlying limitation:

1. `game.js` owns the integer active-piece state `item = { T, N, X, Y, R }`.
2. Accepted movement updates that state and emits the existing `update` event.
3. `App.vue` copies the item into Vuex.
4. `getWellValue()` combines settled board cells with the active piece.
5. `tetcolor.vue` renders the well as individual cells and derives their classes from `getWellValue()`.

There is already a `VisualFxOverlay` movement effect, but it is an afterimage: it draws a short-lived copy of the previous piece cells and animates that copy toward the new position while fading it out. The actual active piece still snaps to its new grid cells. Also, the current `fx:move` event is emitted for accepted non-gravity input moves, not for ordinary gravity steps.

The trail is useful feedback and should remain; it is not movement interpolation.

## 2. Desired behavior

- The active piece should visibly travel smoothly between accepted grid positions during left/right movement, manual down and gravity.
- The displayed position may be fractional while moving; the engine's logical position must remain an integer grid coordinate.
- Collision checks, lock timing, line/match clearing, scoring, bonuses, input repeat and touch semantics must not change.
- Hard Drop should remain immediate and responsive. Keep its existing drop trail and landing/lock feedback rather than slowly animating the piece through every row.
- Settled cells must remain stationary. The next-piece preview must not animate.
- Respect application and OS reduced-motion preferences. In reduced-motion mode, snap directly to the logical position.

## 3. Proposed implementation

### A. Keep simulation and visual position separate

Do not interpolate `item.X` / `item.Y` inside the game engine. They are authoritative coordinates used by collision and gameplay code.

Add a presentation-only active-piece layer inside the modern board. It should render only the active tetromino's occupied cells, positioned over the existing well. The base grid continues to own settled cells.

The existing active cells in the base grid must not be painted twice. Preserve the grid geometry and its adjacency/edge calculations; hide only the visual fill of the active cells underneath the overlay. Reuse the current cell palette and edge treatment so the overlay looks identical to normal TetColor blocks.

### B. Animate one wrapper, not every cell

Position the active-piece layer with a single `translate3d()` transform derived from the logical target coordinates. The four child cells retain their local offsets and do not need individual animations.

Use a short CSS transform transition as the first implementation. A new accepted target should retarget from the currently rendered in-flight position; do not queue stale positions or let animation lag accumulate. Tune duration against the actual gravity/input cadence, with shorter timing for fast soft-drop/repeat movement.

This keeps interpolation on the compositor and avoids per-frame Vue/Vuex updates, board cloning or changes to the game loop's frame cadence.

### C. Supply complete movement boundaries

The renderer needs reliable movement information for all accepted position changes, including gravity. The existing `fx:move` event is insufficient because it is optional cosmetic FX and currently excludes gravity.

Add a small discrete movement descriptor through the existing game bus (or an equally narrow rendering contract) containing:

- previous and next logical positions;
- movement cause, at least gravity, left/right, manual down and rotation;
- a marker for spawn/reset so a newly spawned piece snaps into place rather than animating from the previous piece's lock position.

Emit only when a logical move is accepted. Do not emit animation-frame updates. Keep the existing `update` event payload and gameplay contracts unchanged.

The visual layer should initialize from the current store state, consume these movement boundaries, and cancel/snap cleanly when the game is paused, stopped, restarted, hidden, resized, switched to Legacy, or reduced motion becomes active.

### D. Keep special actions distinct

- **Hard Drop:** snap to the landing/lock state; retain the existing vertical trail and impact FX.
- **Rotation:** initially keep the orientation change discrete while translating the piece. A short rotation animation can be evaluated separately after position interpolation is correct; do not rotate around an assumed pivot that differs from the engine's piece coordinates.
- **Touch drag:** preserve the existing one-cell-at-a-time collision validation. The renderer may coalesce rapid accepted horizontal targets, but it must never visually cross a blocked destination or leave a stale transition running.

## 4. Implementation boundaries

Expected owners:

- `src/utils/game.js` — publish discrete accepted-movement and spawn boundaries only; no fractional simulation coordinates.
- `src/components/themes/tetcolor.vue` — separate settled-cell rendering from the active-piece overlay.
- A small active-piece presentation component/controller — own the transform transition and lifecycle cancellation.
- `src/utils/visualFx.js` — reuse or extend pure piece-cell/coordinate helpers where that avoids duplicate coordinate math.
- Focused tests under `tests/unit/` plus browser checks.

Do not modify `src/components/stakan.vue` as part of this work. Do not rebuild the renderer, add a dependency, change the game loop to run faster, or update Vuex on every animation frame.

## 5. Acceptance checks

1. Left/right movement visibly interpolates between adjacent cells without input lag.
2. Gravity steps and manual down interpolate; faster levels and soft drop do not create a growing visual backlog.
3. Repeated key movement retargets from the current visual position rather than restarting from the previous logical cell.
4. Touch drag across several columns remains collision-safe and ends exactly on the engine's accepted position.
5. Hard Drop remains immediate; the existing trail/impact FX remain aligned with the actual landing.
6. Lock and next-piece spawn snap cleanly; a new piece never animates from the previous piece's position, including when two consecutive pieces have the same type.
7. Walls, floor, settled blocks, line clears, TetColor cascades and game-over behavior are unchanged.
8. Pause, restart, visibility changes, resize, Legacy switch and reduced-motion changes leave no stale animation.
9. No per-frame Vuex mutations, board clones or extra engine ticks are introduced.
10. Verify desktop and real mobile behavior, then run `npm run test:unit`, `npm run lint` and `npm run build`.

## 6. Out of scope

- Smoothly animating settled blocks during gravity/line compaction.
- Changing piece physics, gravity cadence, collision rules or input repeat.
- Replacing the existing movement trail, hard-drop trail, lock flash or other Visual FX.
- Bringing the legacy `stakan.vue` implementation into the modern rendering path.
