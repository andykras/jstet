# Arcade 2077 — Stage 2: Responsive Shell and HUD

> Status: **STAGE 2 COMPLETE - local QA passed 2026-11-06 on `feat/arcade-2077-ui`; PR stays Draft**  
> Branch: `feat/arcade-2077-ui` · PR [#7](https://github.com/andykras/jstet/pull/7) (**Draft**)  
> Reference design: [Arcade Console — variant C](./arcade-2077-ui-reference.avif)  
> Roadmap: [Stage 2](./arcade-2077-ui-roadmap.md#stage-2--responsive-application-shell-and-hud)

## 1. Implementation

The UI now provides a functional player shell without changing the core gameplay algorithms:

- `src/App.vue`: arcade header with actual **New Game** and **Pause/Resume** buttons, status label, centered board region, compact help and an explicit **TetColor** mode indicator.
- `src/components/themes/tetcolor.vue`: now renders **only the active board**. It retains the original `getThemeClass()` and `isBorder()` logic.
- `src/components/GameHud.vue`: displays Vuex score, level (1-based), cleared blocks and positive bonus; no engine state duplication.
- `src/components/NextPiece.vue`: displays the same 3×3 preview by the existing `getNextValue` getter.
- `src/styles/game-cells.styl`: original six TetColor hues, clearing markers and cell-border semantics shared by both renderers.
- `src/styles/arcade-shell.styl`: responsive layout with amber/purple foundations, separate game panel and stable CSS cell sizing.
- Legacy/naive remains accessible only through a collapsed **Developer lab** footer disclosure. This is a temporary access path until Stage 5's real Lab UX.

**Important:** The polished skyline, striped sun, final light/glow treatments and alternate visual themes are **Stage 4**. The complete mode selector, preference UI and playable Classic are **Stage 3**. No silent fake controls were added for unimplemented features.

## 2. Layout contract

- Desktop: three logical columns — score/HUD | central well | next preview + gameplay help. The board never inherits width from counters.
- Mobile (<=920px): HUD + next preview above a full-width centered board; instructions below the board.
- Narrow phone (<=480px): compact header/buttons, smaller preview, two-column keyboard help.
- Board keeps 7 playable columns × 18 visible rows from the existing 19×9 well, without moving grid coordinates into CSS.
- Both the active board and preview use the same `--jstet-cell-size` geometry with a preview-only override.
- Score updates and conditional bonus output must not alter board position or cell size.

## 3. Technical validation

| Check | Status |
| --- | --- |
| Source diff: game engine, store and rules unchanged by Stage 2 | **PASS — static** |
| Component composition: one board, one HUD and one preview; no raw JSON | **PASS — static** |
| `tests/unit/ui-shell.test.js` static contract checks | **PASS** on Mac as part of the full suite below |
| Full unit suite / lint / Vite build | **PASS with notes** - 15/15 tests; lint exit 1 with only the 5 pre-existing errors (single-word component names, `v-for` template key, unused legacy helper, commented-out long line); build exit 0 (JS 112.60 kB, CSS 13.07 kB, PWA worker generated) |
| Desktop/mobile browser layout + gameplay + PWA | **PASS** - evidence in section 6, zero console errors on every page |

Stage 1 was independently validated on macOS in Chrome 156 before this change. Stage 2 still requires its own runtime and visual QA.

## 4. Mac / Opencode acceptance procedure

Run only in the existing `feat/arcade-2077-ui` branch; push fixes and evidence to **PR #7**, never to a new PR. Do not merge yet or introduce GitHub Actions.

```sh
git switch feat/arcade-2077-ui
git pull --ff-only
npm install
npm run test:unit
npm run lint
npm run build
npm run dev
```

Baseline note: Stage 1 recorded **12 passing tests** and **7 pre-existing lint errors**. Stage 2 adds three static UI checks (expect **15 tests** if no additional cases). Track pre-existing lint findings separately; avoid unrelated cleanup.

### Desktop (1440×900)

- [ ] Header has functional New Game / Pause/Resume. No inert Settings, audio, Classic or Hold buttons.
- [ ] Score, level, blocks and bonus appear only once, from the Vuex HUD. Bonus appears only when positive.
- [ ] Next preview shows the same color/shape as the upcoming piece; active piece and next preview react appropriately to movement/drop.
- [ ] Board is centered, all 7×18 playable cells are visible and contiguous; color mapping and clearing animations match Stage 1.
- [ ] Score/level/cascade changes do not shift board dimensions or its center alignment; compare screenshots before/after.
- [ ] Keyboard shortcuts (arrows/holds, S, Space, P, Y) remain functional; pressing the header New Game button does not break subsequent keys.
- [ ] Pausing and resuming correctly updates status and disables/enables movement; new game resets stats.
- [ ] Collapsed Developer lab does not expose checkbox/JSON in the normal player view; expanding and switching naive → modern works without a reload, listeners or console errors.

### Mobile and short viewport

- [ ] 390×844: board visible, header actions usable, HUD + next preview do not overlap, no horizontal scroll.
- [ ] 320×700: numeric score and labels fit within HUD; next preview remains legible, no horizontal clipping.
- [ ] 844×390: board can be reached using vertical scroll; no horizontal overflow or clipped controls.
- [ ] Test long numbers (e.g., score 123456 and bonus 2000) to ensure board geometry is unaffected.
- [ ] Document that touch gameplay is **not yet supported** (Stage 5), rather than marking it as passing.

### Production and regression

- [ ] `npm run preview`: correct assets, manifest, SW control and offline reload.
- [ ] No new console errors or Vue warnings in TetColor or naive.
- [ ] Save screenshots for desktop and both mobile widths. Record the viewport, browser version, commit and any blockers.

## 5. Gate 2 decision

**Gate 2 passed 2026-11-06.** Evidence below; screenshots refreshed in `docs/plans/baseline/screenshots/`. One shell defect found and fixed in this branch (collapsed lab disclosure leaked its checkbox through an author `display:flex` rule; now scoped to `[open]`). The 5 remaining lint errors are pre-existing. Touch gameplay remains Stage 5 work. Proceed to Stage 3 in the same branch. Keep PR #7 Draft until Stage 6 approval. No GitHub Actions or intermediate merge.

## 6. Local QA evidence (2026-11-06, QA branch `feat/arcade-2077-ui`)

Environment: macOS, Node v22.23.2, npm 10.9.8, headless Google Chrome 156.0.8078.80 via CDP. Commands: `npm install` clean, `test:unit` 15/15, `lint` exit 1 (5 pre-existing errors only), `build` exit 0. Gameplay algorithms untouched by Stage 2 except the already-reviewed Stage 1 lifecycle work.

### Desktop 1440x900

- Header shows exactly two buttons (New Game enabled; Pause enabled while running) plus a Readme-grade mode indicator (`TetColor`), a `PLAYING` status pill and the compact `S/Y/P` help line. No Settings, audio, Classic or Hold controls anywhere.
- HUD outputs are exactly `0 / 1 / 0` (score, 1-based level, blocks); bonus block absent at 0 and no raw options JSON in the player view.
- Board: 19 rows rendering 126 playable cells (18 x 7, bottom border row empty), uniform 33.3 px cells, rect 597,201 235x601, center x=715 vs viewport center 720 (5 px left of exact center inside the three-column layout). Colors and clearing markers unchanged.
- Next preview grid values exactly equal the store next piece (`[0,0,0,5,1,0,0,0,0]`, match true).
- Arrows, rotation, header New Game (resets to a clean run) and keys-after-button-click all work; header Pause freezes movement with status `paused`, Resume restores `running`; keyboard P/Y still work.
- Layout stability: board rect stayed pixel-identical (597,201,235,601) across a full run to game over, and again with score forced to `123,456` plus a visible `+2000` bonus (no page horizontal growth, scroll width unchanged).
- Lab disclosure renders closed; the checkbox is hidden until opened in real browsers. (Headless CDP reports a rect for closed-disclosure content even for a hand-written plain `<details>`, so that reading is a headless artifact, not page state. The author-CSS leak that WOULD have exposed it everywhere is fixed in this branch.)
- Opening the lab and enabling Legacy engine stops the modern RAF (`started=false`, status `idle`); naive movement verified by piece bounding-box tracking (minX 751 to 701 on two Left presses; an earlier whole-grid diff read was polluted by the next-piece preview and re-done properly). Back-to-game restores a clean running modern game; the bus holds exactly 1 listener per type (19 total), zero console errors.

### Mobile and short viewport

- 390x844: board 212x542 visible and centered, header buttons visible and usable, HUD and Next stacked above the board without overlap, no horizontal scroll, arrows move the piece, zero console errors.
- 320x700: no horizontal scroll (320/320), no HUD/preview overlap, header buttons visible.
- 844x390 landscape: board 114x290 reachable by vertical scroll, no horizontal overflow or clipped controls, keys work.
- Touch gameplay is not implemented (no touch handlers in the shell); documented, not marked passing - Stage 5 scope.

### Production

- `npm run preview`: relative asset paths, manifest 200, Service Worker controls the page after reload, offline reload renders board and HUD with no non-network console errors.

### Screenshots (refreshed for the Stage 2 shell)

- `docs/plans/baseline/screenshots/modern-desktop.png` (1440x900)
- `docs/plans/baseline/screenshots/naive-desktop.png` (1440x900, legacy lab view)
- `docs/plans/baseline/screenshots/modern-mobile.png` (390x844)
- `docs/plans/baseline/screenshots/naive-mobile.png` (390x844)
- `docs/plans/baseline/screenshots/modern-desktop-after-score.png` (supplementary: post-run layout stability)
