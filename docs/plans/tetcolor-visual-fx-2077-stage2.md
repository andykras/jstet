# JSTET — Visual FX 2077 / Stage 2 handoff

> Updated: 2026-11-07  
> Branch: `feat/tetcolor-visual-fx-2077`  
> Status: **Code committed; full-repository build, tests and browser QA pending**  
> Next: Stage 3 — clearing effects, after the QA gates are satisfied.

## Implemented

- Added `getPieceFxCells(item, pieces, dimensions)` in `src/utils/visualFx.js`. It snapshots occupied piece cells into a frozen, compact list of visible-board `{ column, row, color }` objects; walls and hidden rows are excluded. Never retains or clones the hot board array.
- Added **discrete opt-in-only FX events** in `src/utils/game.js`:
  - `fx:move` emits only on an **accepted input movement or rotation** (not on blocked controls or automatic gravity). Payload: frozen `{ action, from: { X, Y, R }, to: { X, Y, R }, cells }`, with `cells` taken from the previous pose.
  - `fx:hard-drop` emits after the real immediate drop loop resolves, only for positive distance: frozen `{ from, to, distance, cells }`, with `cells` captured from the start pose.
  - `fx:lock` emits on **actual successful `put(item)`**, aligned with the existing `sound:drop`, with frozen `{ cells, hard }` from the locked pose. `hardDropPending` is presentation metadata only, reset on lock, game over, stop and new game.
  - The helper checks whether any FX bus listener exists via `$bus.all.get(type)?.size` **before constructing event payloads**. With No FX (default), no overlay is mounted and no snapshots are constructed. The original `update`, `sound:drop`, `sound:clear`, scoring and clearing semantics are unchanged.
- Added `src/components/VisualFxOverlay.vue`, mounted inside the existing well by `src/components/themes/tetcolor.vue` **only when Visual effects is enabled**. This listens to events via `mitt` and renders up to **24 bounded transient decorative cells**, with timed disposal (155 ms move, 270 ms drop, 210–250 ms lock). Every listener and timeout is removed on unmount.
- Added `src/styles/tetcolor-motion-fx.styl` (imported last): subtle lateral/rotation trailing glint; vertical colored energy streak for hard drop; local rim/light shock for landing, stronger after hard drop. Uses `--cell-1`…`--cell-7` from the active Arcade/Prism palette.
- The FX layer is absolutely positioned, pointer-transparent, clipped within the well and uses the existing calculated `--jstet-cell-size`; it does not affect 7×18 or 10×20 cell geometry, mobile side rails, or Next preview.
- Explicit cleanup on new game, non-running status (pause/game over), focus loss, page hiding, resize, option toggle (unmount), legacy switch and component destruction. Application and OS reduced-motion preferences suppress transient effects.
- Added `tests/unit/visual-fx-motion.test.js` with six focused tests; existing Stage 0/1 assertions updated for the renderer's additional reduced-motion prop.

## Event ordering / gameplay safety

Existing engine still owns piece positions, collision and clearing:
1. For left/right/rotate/down, the exact original `set(X, Y, R)` call executes once. Only when it succeeds and changes the pose does a cosmetic `fx:move` fire. A blocked action produces no trail.
2. For hard drop, the original `while (set(...))` resolves the final piece position instantly, with no delay injected. A cosmetic trace is emitted for its actual movement distance; then the original `update(item.X, item.Y + game.drop++, item.R)` executes.
3. The engine continues to lock according to its own unchanged scheduled timing. A cosmetic `fx:lock` fires when `put(item)` succeeds, before the existing sound event and before TetColor/Classic clear detection. The FX overlay cannot write to Vuex or game state.
4. No additional sounds, animation frames, game-loop subscriptions, game delays, dependencies or schema changes.

## Verification performed

- Reviewed the current source and checked that the FX hook only runs when subscribed, and that the renderer mounts it conditionally.
- Created and executed a small **isolated Node.js reproduction** of the `getPieceFxCells` and existing `Piece.get` logic: **3/3 tests passed** (snapshot coordinates + immutability, clipping, Classic rotations). This is **not** execution of the repository's committed tests.
- `git ls-remote` from the execution container failed DNS resolution of github.com, so the full working tree and dependencies could not be obtained locally.
- **Not run:** repository `npm run test:unit`, `npm run lint`, `npm run build`, CSS compilation, real desktop/mobile browser screenshots, gameplay timing or FPS/memory benchmarks. Added repository tests are **pending**, not reported as passing.
- No GitHub Actions, merge, or deployment triggered.

## Mac / Opencode agent QA

Check out `feat/tetcolor-visual-fx-2077`; follow the existing `AGENTS.md` conventions and Stage 0/1 handoffs. Do not merge or deploy.

1. Run `npm run test:unit`, `npm run lint` and `npm run build`. Fix **any** Vue template, Stylus calc()/keyframe, or test failures on the same branch before approving.
2. Confirm **FX OFF** on fresh settings and on migrated v1 preferences: same board, cells, colors, Next preview, score, controls and performance as current master. No FX overlay node/listeners and no cosmetic bus snapshots.
3. With FX ON, at 320×568, 390×844, 768×1024, 1366×768, test TetColor and Classic, Arcade and Prism; verify no row/cell clipping, no line breaks or HUD overlap.
4. Tap left/right, hold arrows, rotate and press Down with keyboard and touch: a quick understated trace appears **only on a successful movement**. Check blocked walls and rotations (no false trails) and normal falling (no constant movement trail).
5. Hard-drop from the top, middle, near the floor and from zero height: streak uses the actual path; no phantom travel at zero distance. Lock flash appears **at the settled cells**, not at the next piece.
6. Confirm normal gravity lock produces the smaller impact, hard-drop lock the larger impact; existing drop/clear sound still plays exactly once per original event. Exercise consecutive drops, clearing and cascades.
7. Toggle FX Off while paused and immediately while playing: all transient elements/timers stop, flat rendering returns, game continues without reset. Test game restart, mode switch, Legacy round trip, browser resize, tab hide, blur, pause, game over, and re-enable.
8. Confirm both OS reduced-motion media setting and in-game Reduced motion suppress all transients. Verify CSS math on actual Chromium/WebKit mobile browsers.
9. Capture before/after gameplay screenshots and a repeatable FPS/input-latency/memory sample. Target responsive ~60 FPS; if necessary reduce effect density while preserving original controls and score.

**Scope boundary:** Stage 3 will add *match and line clearing* events and particle FX. Do not infer affected clear coordinates from `sound:clear`: the game uses `-2` sentinel markings and supports both batch and sequential clearing.
