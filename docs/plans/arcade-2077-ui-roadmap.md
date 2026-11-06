# JSTET — Arcade 2077 UI Roadmap

> Status: **IMPLEMENTATION IN PROGRESS — Stages 0–3 complete with browser QA; Stage 4 implemented, awaiting visual QA**  
> Updated: 2026-11-06  
> Target stack: Vue 3 (Options API), Vuex 4, Vite 7, Stylus, mitt  
> Project instructions: [`AGENTS.md`](../../AGENTS.md)

## 1. Goal and product contract

Turn JSTET from a developer playground into a polished, responsive browser puzzle game.
Deliver one coherent player UI for the existing TetColor game and the existing Tetris-style rules, while retaining a separate legacy/naive engine for development and comparison.
Prioritize legibility, responsive gameplay, accessibility, predictable controls, and performance over decorative effects.

**The board is the product.** The shell should frame it rather than compete with it.

### Success criteria

- A new player can find a game mode, start/restart, pause, view the next piece and score, and open settings without knowing any keyboard shortcuts.
- No raw options JSON, internal implementation checkbox, debugging text, or developer-only action appears in the normal playing experience.
- Switching the visual theme, reduced motion, and other presentation preferences does not reset the active game.
- Ruleset changes start a new run intentionally. No implicit rebuild/reload or silent loss of the current game.
- TetColor and Classic have correct, distinct rules and piece sets; legacy/naive remains available in a clearly separated Lab.
- Keyboard and touch controls work reliably. Overlays do not accidentally move pieces.
- The game runs as a static site and retains the existing PWA and relative-path deployment contracts.
- Gameplay timings, scoring, collisions, and cascades remain correct; no unexplained regression relative to the documented baseline.

## 2. Confirmed baseline (2026-11-06)

- `master` includes the Vite 7 migration (PR #2) and Vue 3 / Vuex 4 migration (PR #3).
- `src/App.vue` currently displays a `naive implementation` checkbox, drop-mode label, New Game button, raw options object, and the TetColor theme.
- `src/components/stakan.vue` is the **independent legacy implementation**, with its own game loop, keyboard listeners, themes (number keys), and UI.
- `src/components/themes/tetcolor.vue` draws the current TetColor well and embeds the next preview, score, level, blocks, and bonus.
- `src/components/themes/simple.vue` is an existing alternative renderer; it is **not** a complete selectable Classic game mode by itself.
- `src/utils/game.js` owns the main `requestAnimationFrame` loop, engine flags/timers and game lifecycle; it communicates through `src/utils/gameBus.js` (`mitt`).
- `src/game/tetcolor.js` and `src/game/tetris.js` implement separate clearing rules. `src/game/options.js` is copied to Vuex for display but is **not currently wired as the engine configuration**.
- `src/store.js` intentionally uses shallow `Object.freeze` to keep hot-path game data out of deep observation. Keep it intact.
- The main-game piece list in `App.vue` currently contains TetColor pieces; standard Tetris pieces are defined but commented out.
- The repository uses plain JavaScript, Options API, Stylus, `node:test`, and no UI framework.

These statements describe the code baseline, not evidence that all runtime paths have been tested.

## 3. UX and visual direction

### Approved design reference — Arcade Console (variant C)

![Approved JSTET Arcade Console design reference](./arcade-2077-ui-reference.avif)

This is the user-selected **Arcade Console** direction: a dark, softly illuminated physical arcade cabinet, warm amber/orange board frame and HUD, restrained violet highlights, and a synthwave city skyline with a striped setting sun and water reflections on the left. Keep the central board dominant and the right-hand side useful but restrained.

The image is a compact, optimized visual reference; the design is **not** a literal gameplay specification. Do not implement unplanned controls or invent gameplay features to match decorative mockup details. The documented gameplay and acceptance gates remain authoritative.

### 3.1 Product identity: Premium Arcade 2077

- Dark graphite/deep-navy surfaces; restrained cyan/violet accents; clear semantic colors for active, paused, warning, and game-over states.
- Glass/blur **on surrounding surfaces only**. Do not blur active blocks or use a visually noisy background behind the board.
- Crisp cell geometry, readable spacing, restrained glow, intentional motion, and high-contrast typography.
- A consistent token system for color, spacing, radius, typography, board cell size, elevation, timing, and focus rings.
- No generic full-screen cyberpunk wallpaper, excessive bloom, gratuitous animations, fake HUD metrics, or decorative text.
- Maintain a tasteful fallback for devices without `backdrop-filter` support.

### 3.2 Desktop layout

1. **Top bar:** JSTET identity; explicit mode selector (TetColor / Classic); New Game or Restart; Pause/Resume; Settings; optional compact theme switch.
2. **Game area:** centered, dominant board in a stable frame; no shifting during scoring, animations, or panel opening.
3. **HUD:** score, level, mode-specific progress (`Blocks` for TetColor, `Lines` for Classic), bonus only when applicable, and the next-piece preview.
4. **Help:** compact, unobtrusive key hints. Detailed controls belong in a Help/Settings panel.
5. **Overlays:** Pause and Game Over are visible, keyboard-operable, and keep the board context recognizable.

Desktop side panels are a layout choice, not a requirement to permanently occupy three columns. Avoid unused cards and duplicate stats.

### 3.3 Mobile layout

- Retain a full, readable game board with a correctly calculated fit based on visible well dimensions and viewport height.
- Condense HUD and controls into compact bands around the board; do not squeeze the playfield to make room for decorative panels.
- Provide large touch controls for left, right, rotate, down and drop, with reliable press/release behavior and no stuck movement.
- A game remains usable at 320px width, on common portrait phones, and in landscape; no horizontal overflow.
- Respect safe areas, screen-reader labels, touch targets, and reduced-motion preferences.

### 3.4 Themes are not game modes

- **Game mode** = rules and piece set (TetColor, Classic).
- **Visual theme** = colors and presentation on the modern game renderer (target: one polished default and at least one genuinely distinct alternate).
- **Engine** = modern engine vs independent naive prototype; engine selection belongs to Lab only.
- The naive engine's number-key text/ASCII themes remain a legacy Lab feature. Do not misrepresent them as supported modern renderer themes.
- Do not add unimplemented controls (Hold, Ghost Piece, audio, leaderboard, online features) simply to fill the interface.

## 4. Runtime behavior and settings contract

### 4.1 One owner for each concern

- **Engine** (`src/utils/game.js` and `src/game/*`): authoritative run state, rules, timers, collision, piece generation, scoring and clear cascades.
- **View adapter / events** (`mitt`, optional thin controller): commands into the engine and discrete status/progress events out. Keep event contracts explicit.
- **Vuex / UI state:** observable HUD snapshots, open panel/dialog, selected visual theme and user preferences. No per-frame board cloning.
- **Components:** rendering, layout, keyboard/touch input routing, settings UI, focus management. No game algorithms inside UI components.
- **Lab:** isolated legacy engine and diagnostic controls, never competing with the modern engine for global keyboard input.

Do not introduce Pinia, TypeScript, a new UI framework, or a wholesale engine rewrite. Use existing Options API and Stylus conventions.

### 4.2 Apply policy

| Setting/action | When it takes effect | Notes |
| --- | --- | --- |
| Visual theme, contrast, HUD, reduced motion | Immediately | Preserve the current board/run |
| Keyboard help visibility | Immediately | Presentation only |
| Soft/hard behavior of the Space drop action | Immediately | Preserve existing semantics; do not confuse with ArrowDown |
| Pause/Resume | Immediately | No gameplay movement while paused; clear held controls |
| Mode: TetColor / Classic | On a **new run** | User explicitly confirms discarding an active run |
| Piece set, board geometry, starting level, scoring/timing rules | On a **new run**, only if exposed | Do not create UI for unsupported settings |
| Single-block vs batch clearing | On a **new run** | It changes clear sequencing and therefore gameplay timing |
| Modern/naive engine | Lab-only, requires a clean engine switch | Dispose old listeners/timers before starting another engine |

No player setting may require editing source code, restarting Vite, or rebuilding the app.

### 4.3 Persistence

- Persist only safe player preferences (theme, motion, drop preference, optional help visibility) using a small versioned `localStorage` object.
- Read invalid/obsolete stored values defensively and fall back to defaults.
- Do not persist raw hot-path board arrays or claim saved-run/resume behavior unless separately implemented and tested.
- Avoid writing storage on each frame, each animation tick, or every cell update.

### 4.4 Keyboard, input focus, and run lifecycle

- Keep existing arrow key repeat semantics; do not replace them with OS auto-repeat.
- Preserve `ArrowLeft/ArrowRight` movement, `ArrowUp` rotation, `ArrowDown` downward movement, `Space` drop, `P` pause, `Y` new game, and `S` drop-mode toggle until intentionally reassigned.
- Debug keys (`N`, `F`) must be Lab-only or deliberately gated so normal play cannot invoke them accidentally.
- Key handlers must ignore editable fields and avoid gameplay commands when settings/dialogs are open; prevent page scrolling only for claimed game keys.
- Stop/clear active held commands on blur, overlay opening, mode switching, engine switching and unmount.
- Model observable run statuses at the UI boundary (`running`, `paused`, `gameOver`, possibly `idle`) without creating a second competing gameplay state machine.
- Restart must reset score, level, active/next pieces, counters and stale clear state consistently; no leaked animation loops or duplicated listeners.

## 5. Implementation roadmap

Each completed stage gets one or more **focused commits in the same implementation branch**. Before advancing to the next stage, update this file's checkbox, status and acceptance notes **in that branch**. Get explicit user acceptance of the visible milestone when applicable. Do not merge intermediary implementation stages.

### Stage 0 — Baseline and acceptance harness

**Status:** [x] Complete — code audit and focused tests done; local QA evidence recorded 2026-11-06 on `feat/arcade-2077-ui` (see [Stage 0 baseline](./arcade-2077-baseline.md), section 6). The only failing command is the pre-existing `npm run lint` config schema error, logged as an open tooling item; no gameplay code was changed.

- [x] Captured current desktop and phone-sized screenshots of modern TetColor and legacy naive views (older repository screenshots are only historical references).
- [x] Ran `npm run test:unit` (7/7 pass), `npm run build` (pass), and development/preview browser smoke tests from a full local checkout. `npm run lint` fails on a pre-existing ESLint config schema error (exit 2), recorded in the baseline.
- [x] Verified keyboard movement, held-key repeat, both drop behaviors, pause/resume, New Game, score, level (0 to 1 over 62 s), matching progress and game-over; documented pause-input, restart-noise, restart-state, game-over-overlay, focus, and dual-engine findings.
- [x] Documented code-confirmed baseline quirks and distinguished reproduced findings (B-01, B-02, B-03, B-05, B-07, B-08 in browser; B-04 by store/engine read) from confirmed-visible items (B-06).
- [x] Define a repeatable browser acceptance checklist and a screenshot capture protocol.
- [x] Add focused input-timing regression tests (3 cases); executed against an isolated local copy of the unchanged `events.js` source, **not** the complete checkout.

**Gate 0:** Evidence recorded (command results, browser checks, four screenshots in the baseline). `npm run lint` is blocked by a pre-existing config schema error; fixing it belongs to a later stage, without gameplay changes.

### Stage 1 — Game control and settings contract

**Status:** [x] Complete — implementation plus local browser regression QA passed 2026-11-06. See [Stage 1 handoff](./arcade-2077-stage1-handover.md).

- [x] One command binding for the modern engine: start/restart, pause/resume, drop, player input and status events.
- [x] Validate run options from the single source of truth `src/game/options.js` and apply them only on new game. Mode/rules options are wired; a playable Classic selection remains Stage 3.
- [x] Define immediate vs next-run settings policy, keyboard ownership and lifecycle in the handoff. Preference storage and UI controls remain Stage 3.
- [x] Disconnect the modern engine and keyboard before mounting naive; dispose legacy timer/animation work when leaving naive.
- [x] Add focused regression tests for options, event subscriptions, held-key release and keyboard focus gating.
- [x] Confirmed gameplay, pause timing (65 s freeze + timer exclusion), engine switching (x10, 1 listener per bus type, no errors) and restart-during-cascade in Mac Chrome; commands, screenshots and browser checks recorded in the handoff.
- [x] Verified lint after the schema fix: 1 new Stage 1 finding fixed (`keyboard.js` wrap); 7 remaining errors are pre-existing findings, not Stage 1 regressions.

**Gate 1:** Passed 2026-11-06 on recorded evidence: no duplicate timers, listeners or background moves; both renderers playable; run options and pause semantics verified in browser.

### Stage 2 — Responsive application shell and HUD

**Status:** [x] Complete — implementation plus desktop/mobile browser acceptance passed 2026-11-06. See [Stage 2 handoff](./arcade-2077-stage2-handover.md).

- [x] Replaced the raw root controls with a semantic header, centered board, functional New Game/Pause buttons, responsive HUD and compact keyboard help.
- [x] Extracted next-piece preview and score/level/blocks/bonus presentation into `NextPiece.vue` and `GameHud.vue` without changing their Vuex data sources.
- [x] Board size is controlled by a shared cell-size variable, not HUD or bonus width; mobile layout uses explicit grid areas.
- [x] Shared color/cell styles are used by both the board and next-piece preview; original `getWellValue` and `getNextValue` mapping is preserved.
- [x] Removed player-facing raw options JSON and the visible naive checkbox; legacy access is folded under Developer Lab pending Stage 5.
- [x] Added source-level shell/renderer contract checks in `tests/unit/ui-shell.test.js`.
- [x] Verified desktop 1440x900, phone 390x844/320x700 and landscape 844x390 (layout, clipping, readability, board stability); screenshots refreshed.
- [x] Verified full-game TetColor parity, pause/restart, next preview, legacy toggle and PWA in browser; QA evidence recorded in the handoff.

**Gate 2:** Passed 2026-11-06 on recorded evidence: complete desktop layout plus usable narrow layouts; TetColor gameplay parity verified; no dead/duplicate player controls.

### Stage 3 — Playable modes and settings

**Status:** [x] Complete — implementation plus full Mac/Chrome gameplay acceptance passed 2026-11-06. See [Stage 3 handoff](./arcade-2077-stage3-handover.md).

- [x] Real TetColor / Classic selection in the header. Active-run switching requires an accessible confirmation dialog; cancel resumes the existing run.
- [x] Classic has its own 7 tetrominoes, 10×20 well, complete-line removal, line-based scoring, mode-specific HUD and correctly sized 2×2/3×3/4×4 next preview.
- [x] Existing TetColor rules/4 pieces/7×18 board/cascade scoring retained; no change to the TetColor clearing algorithm.
- [x] Functional Settings dialog with live theme, reduced motion, keyboard help and Space-drop preference; clearing sequence is a staged next-run rule.
- [x] Live versus next-run application is labeled; dialogs release controls and temporarily pause a running game; focus handling is included.
- [x] Versioned, validated localStorage preferences; malformed or inaccessible storage falls back to safe defaults.
- [x] Added mode/line-clearing/persistence/unit and UI contract tests (11 new cases).
- [x] Validated 26-test suite, existing lint baseline (only the 5 pre-existing errors), production build and PWA in full checkout.
- [x] Verified actual gameplay of both modes, single/multi-line clearing (1 line/100 pts, 2 lines/200 pts), score/preview/game-over, dialog and settings semantics, restart and device layouts in Chrome. Evidence saved above.

**Gate 3:** Passed 2026-11-06 on recorded evidence: both modes genuinely playable and independently tested; visual options apply live, rule changes on next game, no reload/build needed.

### Stage 4 — Arcade 2077 visual system and game states

**Status:** [ ] Implemented in branch — **desktop/mobile browser QA and visual acceptance pending**. See [Stage 4 handoff](./arcade-2077-stage4-handover.md).

- [x] Define scoped Stylus/CSS tokens and night-sky arcade cabinet visual styling with a local SVG striped sunset, skyline and reflections.
- [x] Polish Arcade and retain the distinct Prism palette without changing core gameplay, board geometry or engine data.
- [x] Improve control focus, clear feedback, score/bonus/level presentation, and typography.
- [x] Add Paused / Game Over board overlays with native Resume/New Game controls and focus behavior; keep existing modal confirmations.
- [x] Add CSS-only score/bonus/clear animations, reduced motion for OS/player, and pause animation freezing.
- [x] Add five static visual/overlay contract checks in `tests/unit/arcade-visuals.test.js`.
- [ ] Validate fidelity and accessibility at desktop, narrow mobile and landscape viewports using real browser screenshots.
- [ ] Run full unit suite, lint, production build, PWA and live-game paint/memory checks.

**Gate 4:** **Pending local acceptance.** Visual milestone must be reviewed on desktop and phone; board, overlays and motion remain readable without a gameplay performance regression.

### Stage 5 — Mobile, controls, accessibility, Lab

**Status:** [ ] Not started

- Implement touch controls using the same commands as the keyboard; ensure press/release and cancellation work.
- Verify layout and gameplay at 320px, 375px, 768px and desktop widths, including short-height landscape and safe areas.
- Expose keyboard control reference and correct focus/tab behavior; modals have Escape/close and focus return.
- Add an unobtrusive, deliberate Lab entry for legacy/naive and any existing diagnostic features.
- Keep legacy number-key themes and diagnostic commands functioning only in the Lab context.
- Do not promise full mobile equivalence until physical or browser-emulated touch play has been exercised.

**Gate 5:** Full touch run is possible without a keyboard; normal play contains no internal/dev controls; accessibility smoke passed.

### Stage 6 — Final verification and release readiness

**Status:** [ ] Not started

- Run all existing unit checks, lint and production build; add targeted tests for mode/setting/regression issues discovered along the way.
- Perform desktop/mobile browser acceptance for TetColor, Classic, Lab, both themes, keyboard and touch, focus, overlays, score/bonus and restart.
- Verify PWA and relative-path deployment in `npm run preview`, including manifest/icons, service worker and offline reload.
- Check for duplicate event subscriptions, orphaned timers, hot-path Vue observation, unexpected frame drops and memory growth across repeated restarts.
- Review all changed files for unrelated refactors, unused options, dead UI elements and undocumented controls.
- Update README usage instructions, screenshots and this plan's acceptance checklist. Record any unverified checks as such.
- Only after user approval: mark the single Draft PR ready and merge it to `master`.

**Gate 6:** All P0 acceptance items pass, remaining issues are explicitly documented, and the user approves merge.

## 6. Acceptance matrix

### P0 — Required before merge

- [ ] Default TetColor launch, movement, rotation, drop and held-key behavior.
- [ ] Correct TetColor color matching, cascades, bonus/score and progression.
- [ ] Classic uses its own pieces and clears completed horizontal lines.
- [ ] Pause/Resume/Restart and Game Over render and behave correctly.
- [ ] Both modes render correct next preview and HUD values.
- [ ] Mode/rules changes start a clean new run without stale timers or input.
- [ ] Settings apply immediately or on next run exactly as labeled.
- [ ] Board and UI usable on desktop, mobile portrait and small-height layouts.
- [ ] Touch controls work; keyboard cannot affect game while a dialog owns focus.
- [ ] Lab/naive is isolated from player UI and does not leave background input/loops.
- [ ] No regressions to static build, subdirectory hosting or PWA basics.
- [ ] Unit tests, lint and production build run with outcome recorded; critical browser smoke completed.

### P1 — Expected polish (adjust only with user approval)

- [ ] Coherent visual tokens, balanced layouts, tasteful glow/blur and a second visual theme.
- [ ] Clear, accessible keyboard help and polished focus/hover states.
- [ ] Reduced motion respected for shell and in-game feedback.
- [ ] Stable layout during score updates, animations and overlay opening.

### Explicitly out of scope for this PR

- Replacing the game loop, rewriting piece/board structures, removing `Object.freeze`, or converting to Composition API/TypeScript.
- Online accounts, leaderboards, save/resume of full games, multiplayer, monetization.
- Hold Piece, Ghost Piece, new physics or level systems, music/SFX not backed by actual assets and tested behavior.
- A new UI framework or complex animation engine for decoration alone.
- New deployment infrastructure or GitHub Actions.

## 7. Single-PR workflow

1. **This roadmap is merged into `master` first** as a documentation-only change.
2. Create one implementation branch from the latest `master`, recommended name: `feat/arcade-2077-ui`.
3. Create **one Draft implementation PR** targeting `master` as soon as Stage 0 has its first meaningful commit.
4. Put Stages 0–6 into **that same branch and PR**, separated by focused commits and updated roadmap progress.
5. After each milestone, report changed files, real validation results, open risks, current stage and next stage; ask for visual acceptance when the stage changes user-facing UI.
6. No separate feature PRs, auto-merge, force pushes, GitHub Actions or intermediate merges unless explicitly authorized.
7. Keep the branch current with `master` using a non-destructive merge when needed, without rewriting shared history.
8. Merge the implementation PR **once**, after Stage 6 is accepted.

Suggested commit subjects: `test: capture gameplay baseline`, `refactor: expose game session controls`, `feat: add responsive game shell`, `feat: enable playable classic mode`, `feat: wire settings and themes`, `feat: polish arcade visuals`, `feat: add touch controls and lab`, `test: complete arcade UI acceptance`.

## 8. Decision log

- **2026-11-06:** Use the existing Vue 3 + Vite stack; do not revisit the framework migration.
- **2026-11-06:** Preserve the current engine and `Object.freeze` optimization; no speculative reactive-state rewrite.
- **2026-11-06:** One long-lived implementation branch and one Draft PR with multiple stage commits.
- **2026-11-06:** Player modes, visual themes and the legacy engine are separate concepts.
- **2026-11-06:** No player-facing setting should require a code rebuild.
- **2026-11-06:** Target a premium, restrained Arcade 2077 look rather than ornamental cyberpunk visuals.
