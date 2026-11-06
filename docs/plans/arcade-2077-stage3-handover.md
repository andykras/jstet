# Arcade 2077 — Stage 3: Playable Modes and Settings

> Status: **STAGE 3 COMPLETE - local QA passed 2026-11-06 on `feat/arcade-2077-ui`; PR stays Draft**  
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
| Full suite (previously 15; now expected 26) | **PASS on Mac — 26/26, 0 failures** |
| ESLint | **PASS with only the 5 pre-existing Stage 2 errors** (exit 1; no new findings) |
| Vite build and PWA preview | **PASS — build exit 0** (JS ~113 kB, PWA worker generated); preview serves relative assets, manifest + icons 200, SW-controlled, offline reload renders board/HUD with zero non-network errors |
| Chrome desktop/mobile gameplay and modal QA | **PASS — evidence in section 6**, zero console errors on every page |

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

**Gate 3 passed 2026-11-06.** Evidence below; screenshots in `docs/plans/baseline/screenshots/`. No product-code changes were needed: two QA-probe artifacts were diagnosed and re-run correctly (a CDP options-serialization read and a line-clear fixture aimed at the wrong row); the one live `hardSync` mismatch did not reproduce on exact-sequence replay from clean storage and all direct probes pass. Proceed to Stage 4 in the same branch. Keep PR #7 Draft until Stage 6 approval. No GitHub Actions or intermediate merge.

## 6. Local QA evidence (2026-11-06, QA branch `feat/arcade-2077-ui`)

Environment: macOS, Node v22.23.2, npm 10.9.8, headless Chrome 157.0.8103.38 via CDP. Commands: `npm install` clean, `test:unit` 26/26, `lint` exit 1 (only the 5 pre-existing errors), `build` exit 0.

### Classic mode (1440x900)

- Mode buttons show TetColor/Classic with `aria-pressed`; requesting Classic mid-run opens the `Start Classic?` dialog, pauses the game (`PAUSED`), and Escape or Keep playing restores the identical run (X/R/score unchanged apart from one gravity tick, status back to `running`).
- Confirmed Classic: Vuex `options.tetcolor=false`, 200 visible cells (10x20), HUD `SCORE 0 LEVEL 1 LINES 0`, zeroed counters, mode `classic`.
- Next preview exactly equals the store next piece (verified 3x3 Z: `[2,2,0,0,2,2,0,0,0]` both sides); 10 spawned shapes moved/rotated/dropped with zero stuck `-2` markers.
- Real single-line clear via bottom-row fixture: vertical I piece down a 1-wide gap completes the row — `lines=1`, `score=100` (1 x 100 x level 1), no stuck markers, column above correctly shifted down.
- Real batch clear via Settings pending rule: `All at once` note shown, engine still single-block until New Game, then `singleBlock=false`; vertical I through a 2-row gap clears both — `lines=2`, `score=200`, no stuck markers. Clearing preference restored to default afterwards.
- Classic game over by stacking sets Vuex `status=gameOver`; New Game/Y restarts a clean Classic run (0 settled, zeroed counters).
- Back to TetColor with confirmation: geometry returns to 126 cells, options `tetcolor=true`, HUD `Blocks` label; cascades still score.
- Five mode cycles including while paused: every landing is a clean running game; mitt bus holds exactly 1 listener per type (19 total), zero console errors.

### Settings, focus and persistence

- Opening Settings auto-pauses (gravity, clearing and arrows frozen); closing resumes with `startedTime` shifted past the dialog wall-clock (timer exclusion verified).
- Opening while paused leaves the game paused; no auto-resume.
- Arcade to Prism applies live: root class `theme-prism`, N1 cell color changes, run (item/score/geometry) untouched. Reduced-motion class and help show/hide apply live and survive checks; help removal does not touch the board.
- Hard-drop Settings toggle and the S hotkey stay synchronized (verified on clean storage: false to true via Settings with persist, true to false via S).
- Dialog keys (arrows/Space/Y) do not reach the game; Escape, backdrop click and Done close; focus is trapped inside while open and returns to the Settings button on close.
- Preferences persist across reload (`{"theme":"prism",...,"hardDrop":true}` round-trips; game restarts running). Malformed JSON and unknown-version payloads fall back to Arcade defaults with the game running and zero console errors.
- One live `hardSync` mismatch appeared in a long shared-profile session; exact-sequence replay from clean storage passes, and three independent direct probes confirm the toggle path. Recorded as test-harness state pollution, not a product regression; profile storage cleared after QA.

### Responsive and production

- 1440x900 / 390x844 / 320x700 / 844x390 in both modes: no horizontal scroll, no HUD/preview overlap, all header buttons visible, arrows move the piece, zero console errors. Classic board scales (335x668 desktop, 302x602 phone).
- Board geometry stable across score/bonus/theme/help changes (rect identical before/after).
- `npm run preview`: mode buttons present, relative assets, manifest + both icons 200, Service Worker controls the page, offline reload renders board and HUD with zero non-network errors.

### Screenshots

- `classic-desktop.png` (1440x900), `classic-mobile.png` (390x844), `modern-desktop.png` (refreshed Stage 3 shell), `modern-desktop-prism.png`, `settings-dialog.png`, `mode-confirm.png`.
