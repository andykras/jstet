# JSTET — Visual FX 2077 / Stage 1 handoff

> Updated: 2026-11-07  
> Branch: `feat/tetcolor-visual-fx-2077`  
> Status: **Implementation committed — full-repository build, tests and browser visual QA pending**  
> Scope: opt-in block materials and active-piece lighting only, without modifying game logic.

## What changed

1. **Opt-in material layer** in `src/styles/tetcolor-visual-fx.styl` (imported last in `App.vue`): subtle specular gradient, raised rim and inset highlights for positive-value blocks. Uses the existing `--cell-1` ... `--cell-7` tokens, so TetColor's six original colors and Prism's alternate palette remain supported. Empty cells, borders and `N-2` clearing markers keep their previous appearance.
2. **Falling-piece classification** in `src/utils/visualFx.js`: `isActivePieceCell(x, y, pieces, item)` matches the current `getWellValue` coordinate mapping. It tests actual piece geometry (including rotation), rather than matching a block color; checks outside the piece bounding box return early. The classification is pure and does not alter the store or simulation.
3. **Thin renderer prop** in `src/components/themes/tetcolor.vue`: `visualFx` defaults to false and adds `fx-active` **only when opt-in is enabled and the current pixel is occupied by the falling piece**. Settled blocks may share its color but never receive that class.
4. **Activation and lifecycle** in `src/App.vue`: pass the existing `preferences.visualFxEnabled` to the board renderer and add a presentation-only `is-running` class. The small active-piece pulse is scoped under `.jstet-app.fx-enabled.is-running`, so it stops on pause or game over. The whole effect is disabled in Legacy.
5. **Next preview** uses the shared `.game-cell` material when FX is On, but receives no `fx-active` class and does not pulse; the cropped preview layout is unchanged.
6. **Reduced motion**: both `.reduce-motion` and `prefers-reduced-motion` suppress the pulse. The blocks retain nonanimated dimensional material when FX is on. `Visual effects = Off` retains baseline flat block styling at all times.
7. **Tests** in `tests/unit/visual-fx-glass.test.js` cover active position/rotation/settled-color independence, palette tokens, gated CSS, reduced motion and preview isolation. Updated the former `<tetcolor />` source assertion in `tests/unit/ui-shell.test.js` to accept the new prop.

## Performance reasoning

- **No FX:** the new conditional short-circuits before checking piece geometry; the legacy `game-cell` material is untouched and no animation runs.
- **FX On:** no new animation loop, Vuex mutation, retained board snapshot, subscription or timeout is introduced. The active test uses current Vuex state and constant-time lookups bounded to the current piece size.
- Only the small active piece's `::after` pseudo-elements animate `opacity` and `transform`. Settled blocks and Next preview remain static. No canvas, backdrop-filter, particle library, or additional DOM rows.
- Block width/height/flex, board frame, cell spacing, well dimensions, mobile maximum-fit CSS, and the Next preview cropping calculation remain unchanged.

## Checks and limitations

- Reviewed source from the current feature branch and verified that the only baseline renderer change is the prop and opt-in class. The original `src/styles/game-cells.styl` has no edits.
- **3/3 isolated Node tests passed locally**, covering TetColor/Classic coordinate conversion and falling-piece geometry before and after rotation. These checks used a minimal fixture reproducing the new helper and existing `Piece` behavior, not the full checkout.
- Source-controlled additional checks include 4 new Stage 1 test cases plus the updated UI-shell assertion, **not yet executed in the repository environment**.
- **Not run:** full `npm run test:unit`, `npm run lint`, `npm run build`, real browser/phone screenshots, CSS compilation, PWA preview and device FPS comparisons. This container has Node 22 but cannot resolve github.com, and Vue/Stylus dependencies are not installed. Treat all real-device appearance and performance results as unverified.
- No GitHub Actions, merge or deployment was performed.

## Browser acceptance for local Mac/Opencode agent

Before proceeding to Stage 2, perform the full Stage 0 validation from [Stage 0 handoff](./tetcolor-visual-fx-2077-stage0.md), then validate Stage 1:

1. Run `npm install` if necessary, `npm run test:unit`, `npm run lint`, `npm run build` and `npm run preview` from `feat/tetcolor-visual-fx-2077`. Resolve compilation problems on this branch.
2. Capture **FX Off vs FX On** screenshots of TetColor and Classic in Arcade and Prism at desktop 1366×768 and mobile 390×844 / 320×568. With FX Off the baseline colors, block borders, gray well and Next preview must be identical to pre-FX.
3. With FX On, confirm all six TetColor colors remain distinguishable and that the translucent glints are readable on 16–24px mobile cells. Check no clipping/overflow or changes in square-cell geometry.
4. Check active movement, rotation, natural fall, hard drop and piece lock: **only falling cells pulse**. Previously placed cells never pulse even when their colors match the falling piece.
5. Check Next-piece cropping for single-cell, two-cell and larger shapes; Next uses static glass, no unwanted glow on empty margins.
6. Pause and game over stop pulsing. Check both app Reduced motion and OS `prefers-reduced-motion`. FX Off immediately restores the flat rendering without resetting the ongoing run.
7. Check Legacy switch/return, mobile touch button functionality, score/bonus/match calculations and audio remain unchanged.
8. Collect a representative 60 FPS frame-time/memory comparison against the Stage 0 baseline; lower animation cost if input latency or dropped frames worsen.

**Next implementation stage:** Stage 2 — movement trails, hard-drop streak and landing impact. This needs real discrete engine FX events and a bounded overlay, not CSS guessing from keyboard input. Keep the cumulative PR Draft until all stages and QA are reviewed.
