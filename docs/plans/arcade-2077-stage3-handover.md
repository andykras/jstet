# Arcade 2077 — Stage 3: Playable Modes and Settings

> Status: **IMPLEMENTED IN PR #7 / INDEPENDENT LOCAL QA REQUIRED**  
> Branch: `feat/arcade-2077-ui` · PR [#7](https://github.com/andykras/jstet/pull/7) (**Draft**)  
> Previous gate: [Stage 2 complete](./arcade-2077-stage2-handover.md)  
> Reference design: [Arcade Console](./arcade-2077-ui-reference.avif)

## 1. Delivered

### Distinct playable modes

| Property | TetColor | Classic |
| --- | --- | --- |
| Well (playable cells) | 7 columns × 18 rows | 10 columns × 20 rows |
| Piece set | 4 existing falling color pieces | 7 tetrominoes: I, L, J, O, Z, S, T |
| Clearing | Horizontal/vertical/diagonal three-color match; gravity and cascades | Completely filled horizontal lines; shift and clear vacated top row |
| HUD | Blocks cleared, bonus, score, level | Lines cleared, score, level |
| Scoring | Existing TetColor color/bonus rules unchanged | 100 points × (level + 1) per cleared line |
| Preview | Piece-dependent grid (2–3 cells) | Actual 2×2, 3×3 or 4×4 bounding matrix |

The existing `src/components/themes/tetcolor.vue` is a neutral block-grid renderer for **both** modes. `src/game/modes.js` owns the mode-specific piece factories and well dimensions. `src/utils/tetraminos.js` adds the missing T tetromino without changing the existing factories.

`src/game/tetris.js` now clears the highest row after shifting a single cleared line, avoiding a stale occupied top row. `src/utils/game.js` updates score and broadcasts it after Classic line clearance. TetColor match detection, color assignment, cascade and bonus code remain untouched.

### Mode-switch lifecycle

- The header offers explicit TetColor and Classic mode buttons with the current choice highlighted.
- Changing mode during a **running or paused** game opens a confirmation dialog. Running gameplay is temporarily paused while confirmation is open.
- **Keep playing** and Escape cancel, restore focus and resume only if this dialog auto-paused the session.
- **Start Classic/TetColor** discards the current board, clears all counters/clear queues and creates a new run with that mode's own pieces and geometry.
- Selecting a mode after `gameOver` immediately starts a new run; clicking the already active mode does nothing.
- The independent legacy/naive Lab remains separate and still owns input only while active. Switching back initializes the selected modern mode.

### Settings behavior

| Setting | Timing | Persistence |
| --- | --- | --- |
| Arcade / Prism appearance | **Live** — board colors/surrounding accents update without restarting | Yes, versioned localStorage |
| Reduced motion | **Live** | Yes |
| Show keyboard help | **Live** — content is shown/hidden without touching the board | Yes |
| Hard drop on Space / S hotkey | **Live** | Yes |
| Clear one at a time / all at once | **Next game only** — pending selection shown | No |

`src/utils/preferences.js` validates values, stores only recognized keys, and catches parse/quota/blocked-storage failures. The selected mode and active board are **not persisted**. The active run's rule snapshot stays in Vuex; a pending rule change is applied when a new game starts. No per-frame preference writes.

Opening Settings auto-pauses a running game; closing restores its prior run/paused state. Arrow/Space/game shortcuts are ignored while dialogs own focus. Escape, backdrop click and on-screen buttons close the panel; Tab remains inside its controls. The future Stage 4 overlay polish may alter the visuals but not these contracts.

## 2. Source ownership

- `src/game/modes.js`: mode-to-pieces/well creation and validation.
- `src/utils/tetraminos.js`: T piece and unchanged existing factories.
- `src/game/tetris.js`: line removal including top-row reset.
- `src/utils/game.js`: Classic line scoring event; unchanged TetColor scoring.
- `src/components/NextPiece.vue`, `GameHud.vue`: preview sizing and mode-specific labels.
- `src/App.vue`: explicit mode selection, discard confirmation, Settings, live/pending configuration, focus and keyboard routing.
- `src/styles/game-cells.styl`, `arcade-shell.styl`: shared cell colors, alternate Prism palette, dialog and selector styles.
- `src/utils/preferences.js`: persistence with defaults and graceful fallback.
- `tests/unit/game-modes.test.js` and `modes-settings-ui.test.js`: six gameplay/persistence cases and five UI contract cases.

No new runtime libraries, state-management frameworks, TypeScript, GitHub Actions, or engine observation rewrites. All original `Object.freeze` calls are preserved.

## 3. Verification status

| Check | Current result |
| --- | --- |
| Repository and new source/diff inspected | **PASS — static only** |
| Six new mode, line-clearing and preferences tests | **WRITTEN, NOT RUN on full checkout** |
| Five new UI contract tests | **WRITTEN, NOT RUN on full checkout** |
| Full suite (previously 15; now expected 26) | **NOT RUN — Mac needed** |
| ESLint | **NOT RUN — 5 pre-existing errors from Stage 2 are documented** |
| Vite build and PWA preview | **NOT RUN — Mac needed** |
| Chrome desktop/mobile gameplay and modal QA | **NOT RUN — Mac needed** |

Only mark a test passed if it was actually run. Expected test count is a planning figure, not an execution claim.

## 4. Mac / Opencode QA handoff

Use **only** `feat/arcade-2077-ui` / **PR #7**; do not merge or create GH Actions. Verify the branch is up to date, then:

```sh
git switch feat/arcade-2077-ui
git pull --ff-only
npm install
npm run test:unit
npm run lint
npm run build
npm run dev
```

Report actual exit codes. Fix **new** regressions in the same branch; identify the Stage 2 lint baseline (5 old violations) separately from new errors.

### Classic gameplay (1440×900)

- [ ] Select Classic while TetColor is running: confirmation appears; Escape / Keep playing restores the same TetColor board, score and status, without advancing timers during the dialog.
- [ ] Confirm Classic: Vuex options `tetcolor=false`, seven distinct piece factories, 10×20/200 visible cells, `Lines` label and new run counters at zero.
- [ ] Move/rotate/drop each Classic shape, including I and O; verify no out-of-bounds collisions or missing-color blocks. Verify previews are 2×2, 3×3 or 4×4 as appropriate, matching the next piece in Vuex.
- [ ] Fill and clear one and multiple full lines with gameplay or controlled DevTools fixture; verify line count, score (100 × level multiplier per line), cleared top rows and no stuck `-2` markers.
- [ ] Force or naturally reach Classic game over. Verify the engine stops and Vuex status is `gameOver` (visible overlay remains Stage 4).
- [ ] Press New Game/Y and restart during line animation: always a clean Classic board with reset score/lines and a single RAF.
- [ ] Switch Classic → TetColor with confirmation: geometry returns to 7×18/126 cells, four color-piece types and `Blocks` label, with color matching/cascades and bonuses intact.
- [ ] Cycle both modes at least five times, including while paused; no duplicate mitt listeners, orphaned timers or unhandled exceptions. Switching into/out of naive Lab remains safe.

### Settings and focus

- [ ] Open Settings during running gameplay: mode is paused and neither gravity, clearing nor arrow/Space input changes the board. Closing/ESC restores running gameplay with timer exclusion.
- [ ] Open Settings when game was already paused: closing leaves it paused; no auto-resume.
- [ ] Change Arcade ↔ Prism while Settings is open: cell colors and interface accents change **immediately**; board item/score/geometry and current run remain unchanged.
- [ ] Toggle Reduced motion and Show keyboard help; changes apply live, remain after reload, do not restart gameplay, and help does not overlap the board.
- [ ] Toggle Hard drop on Space in Settings and with S; the state stays synchronized and persists after reload.
- [ ] Change clearing mode to All at once: display a clear next-run note; engine's `singleBlock` remains unchanged until New Game, then switches.
- [ ] Test Escape, backdrop click, confirmation Cancel/Start, tab trapping and focus restoration; the game never handles keys from the settings dialog or editable controls.
- [ ] Set malformed/obsolete JSON in preference storage, reload: safe defaults, no crash or unhandled console errors.

### Responsive, production and evidence

- [ ] 1440×900, 390×844, 320×700, landscape 844×390: check both modes, top actions, 10-column Classic field, preview, dialogs, no horizontal scroll and no clipped board.
- [ ] Check board geometry stays stable across large score values, bonus updates and theme/help changes.
- [ ] `npm run preview`: relative assets, manifest, SW control and offline reload still work in both modes.
- [ ] Save fresh screenshots (desktop/mobile for Classic and TetColor, Arcade/Prism, Settings and mode-confirm), browser version, and console/build findings in this document.

## 5. Gate 3

**OPEN until local QA is recorded.** Confirm both modes are playable, score/preview correct, dialogs and saved preferences behave as labeled, previous stages remain intact, and no deployment regression exists. Once verified, update the QA table and checkboxes in this handoff and roadmap, commit/push to the **same PR #7**. Proceed to Stage 4 only after this gate passes.
