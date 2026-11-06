# Arcade 2077 — Stage 2: Responsive Shell and HUD

> Status: **IMPLEMENTED — LOCAL BROWSER ACCEPTANCE PENDING**  
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
| `tests/unit/ui-shell.test.js` static contract checks | **ADDED — needs full repository run** |
| Full unit suite / lint / Vite build | **NOT RUN** in this environment |
| Desktop/mobile browser layout + gameplay + PWA | **NOT RUN** in this environment |

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

Leave Gate 2 pending until the command results, browser gameplay outcomes and screenshots have been recorded in this document. Then mark Stage 2 **[x] Complete** in the roadmap, commit/push to the **same branch** and start Stage 3. Keep the single PR #7 Draft.
