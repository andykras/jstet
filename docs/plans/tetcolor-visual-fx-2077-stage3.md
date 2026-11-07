# JSTET — Visual FX 2077 / Stage 3 handoff

> Updated: 2026-11-07  
> Branch: `feat/tetcolor-visual-fx-2077`  
> Status: **Implementation committed; repository build, full tests and browser QA pending**  
> PR: [#12](https://github.com/andykras/jstet/pull/12) (Draft, do not merge/deploy)

## Scope

Stage 3 implements cosmetic **TetColor match / Classic line clearing** feedback while preserving existing gravity, matching, line-clearing, audio, scoring and timing.

- At detection: colored cells briefly charge/glint, with a bounded ordered sweep (145 ms, at most 81 ms total stagger).
- At the **actual clearing step**: one quick release/burst per affected cell, with two CSS pseudo-element fragments (340 ms). These are temporary presentation overlays, not game cells.
- TetColor works for horizontal, vertical, diagonal and overlapping matches. Classic highlights full colored rows. When `singleBlock` is enabled, the effect follows exactly one TetColor cell or one Classic row per engine step; batch mode releases the detected set together.
- Detected cascades publish another complete, color-correct charge and release sequence. Combo/cascade **bonus celebrations** remain Stage 4; no bonus calculation or HUD changes were made here.
- This entire behavior is opt-in. **Visual FX are OFF by default.** Turning them Off unmounts the FX layer and cancels all timers.

## Source changes

1. `src/utils/visualFx.js`:
   - `captureClearCandidates(cells)`: captures only playable **positive** values at a discrete clear-detection boundary. It does not clone the board or run every frame.
   - `markedClearFxCells(candidates, cells)`: after the real detector marks clearing cells `-2`, selects only **newly marked** cells and retains their original colors and true visible coordinates. Previously marked `-2` cells and nonmatched cells are excluded. Result is a frozen array of frozen `{ column, row, color }`.
   - `clearStepFxCells(cells, mode, x, y, dimensions)`: returns exactly one previously captured TetColor cell or one complete Classic line for a sequential removal, based on original pregravity coordinates.
2. `src/utils/game.js`:
   - A small `detectClears(mode, detect)` adapter calls the **original** `getThreeBlock()` / `getSolidLines()` once each at their existing boundaries. It only captures candidates when an opt-in `fx:clear-start` / `fx:clear-step` listener exists; then emits `fx:clear-start` with immutable `{ mode, batch, cells }` *after* detection and *before* removal.
   - Before the original `removeThreeBlockSorted()/removeThreeBlock()` or `clearOneLine()/clearAllLines()` call, emits `fx:clear-step` with `{ mode, cells }`, selecting the correct engine step/batch. Original code still performs removal, scoring, emits HUD updates and sounds exactly as before.
   - Cascade detection invokes the same adapter at the end of the current TetColor clear cycle. The small snapshot resets on a new run, a completed clear group, or game stop.
   - **No FX consumers = no candidate scan, no FX snapshots, no FX events emitted.** The engine's `Object.freeze` optimization and all game rules were left untouched.
3. `src/components/VisualFxOverlay.vue`: listens to the two new events and reuses the existing bounded 24-element overlay; adds types `charge` (235 ms maximum lifetime including stagger) and `clear` (340 ms). The overlay remains pointer transparent, is only mounted on FX On and cleans up on Off, status change, restart, resize, tab hide and unmount. Reduced-motion preference suppresses all transient effects.
4. `src/styles/tetcolor-clear-fx.styl`: standalone opt-in CSS layer using the original `--cell-1`…`--cell-7` palette, including Prism tokens; a short directional glow plus two light shards per cell, with no additional DOM children per particle. Imported after the Stage 2 FX styles by `src/App.vue`.
5. `tests/unit/visual-fx-clear.test.js`: seven tests for exact color/position preservation, diagonal/vertical/horizontal TetColor cases, overlap/previous marker exclusion, single-cell and Classic multirow clearing, hidden/border cases, engine event wrapping including **lock and gravity cascade** paths, opt-in overlay and animation isolation.
6. Adjusted the previous `tests/unit/visual-fx-motion.test.js` assertion to the same Stage 2 lazy emission behavior after introducing the shared `hasFxConsumer()` helper.

## Important event semantics

```text
lock -> put(item) -> sound:drop
    -> candidates only with FX listeners
    -> original match/line detector (writes -2)
    -> fx:clear-start (original colors preserved) -> sound:clear
    -> after game clearSpeed(): fx:clear-step (selected real step)
    -> original removal/settling/scoring
    -> TetColor cascade? detect next group and repeat
```

No animation awaits, gameplay delays, extra scoring, extra sounds, DOM reads, external packages, or changes to the queue scheduling. Engine events express **what actually happened**, not predictions based on key presses or score changes. The `-2` sentinel remains the engine's source of truth.

When `game.singleBlock` is false, the entire group receives one `fx:clear-step`; when true, `$three.sorted` determines the actual next TetColor cell and `$lines` the actual next Classic row. The cosmetic snapshot is cleared at group completion. Overlays can briefly remain after cells are actually removed, which is intentional.

## Verification

**Performed:** Source/contract review; five isolated Node.js reproduction tests on the new pure helper logic (5/5 pass: retained color, old sentinel exclusion, Classic row grouping, per-cell steps, invalid/border inputs). These tests were executed against a manually recreated fixture, **not** a checked-out repository.

**Not performed:** Actual repository `npm run test:unit`, `npm run lint`, `npm run build`, Vue/Stylus compilation, real browser interaction/visual QA, phone perf/FPS profiling. This environment cannot resolve github.com for a local Git checkout and has no Vue/Vite/Stylus dependencies. The seven new repository tests have **not** been executed.

**Known acceptance risk:** Visual/stagger/particle CSS must still be compiled and checked in a real browser, particularly on mobile. Existing Stage 0–2 QA gates are also outstanding. Do not mark Stage 3 approved until these checks pass.

## QA checklist for local Mac / Opencode agent

Use branch `feat/tetcolor-visual-fx-2077` and the project `AGENTS.md`. Do not run GitHub Actions, merge or deploy.

1. Run `npm run test:unit`, `npm run lint`, `npm run build`. Fix test failures and Stylus/Vue compile issues; record counts.
2. Check TetColor FX Off (default): visual pixels/behavior match `master`; no overlay, no particles, no changes to score, Bonus, or game speed. Opt in from Settings; toggling off cancels all effects immediately and retains the running game.
3. Play with FX On at 320×568, 375×667, 390×844, 428×926, 768×1024 and desktop 1366×768. Test Arcade/Prism and TetColor/Classic, ensuring board size and HUD/Next stay unchanged.
4. Trigger horizontal, vertical and diagonal TetColor matches and overlapping combinations; verify exact correct colors, positions and a short glint **only on matched cells**, not the whole board.
5. Toggle **One at a time / All at once** before a new game, verify one burst per true removal vs simultaneous burst per detected group; no phantom flashes from stale `-2` markers.
6. Exercise TetColor gravity cascades: each new detection gets its own charge and actual per-step release, with no effects on unrelated blocks. Existing scoring, combo/cascade bonus arithmetic and `line2.mp3` clear sound must remain unchanged.
7. Classic: clear one row and multiple rows in one lock. Check horizontal sweep, original colors, no accidental TetColor triple behavior.
8. Pause/resume midcharge, restart midclear, mode switch, enter/leave Legacy, resize, tab-hide, blur and game over; overlays must cancel cleanly. Check OS and app reduced-motion flags.
9. Compare with Stage 0 baseline at ~60 FPS, especially on small phones and while clearing many cells. Effects must not cause visible input lag. If performance suffers, reduce bounded particles/FX density rather than change gameplay timing.

**Next implementation stage:** Stage 4 — combo/cascade/bonus celebrations, tied to the game's authoritative bonus award events. Stage 5 — polish, full browser/performance QA and final acceptance.
