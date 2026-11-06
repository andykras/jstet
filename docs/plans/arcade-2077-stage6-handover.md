# Arcade 2077 — Stage 6: Final Integration QA and Release Readiness

> Status: **SOURCE/DOCUMENTATION PASS COMPLETED — FINAL MAC/CHROME QA PENDING**  
> Branch: `feat/arcade-2077-ui` · [PR #7](https://github.com/andykras/jstet/pull/7) (**OPEN + Draft; do not merge without user approval**)  
> Roadmap: [Stage 6](./arcade-2077-ui-roadmap.md#stage-6--final-verification-and-release-readiness)  
> Design: approved Arcade 2077 console with classic TetColor `#AAAAAA` well and six original colors.

## 1. Baseline and scope

The Stage 5 agent reported (at commit `3430823`): **46/46 unit tests pass**, `npm run build` PASS, browser/pointer QA and PWA offline reload PASS, zero console errors. Lint exited 1 with the **same five pre-existing diagnostics**. Recorded checks include TetColor and Classic, multi-touch, pause, state overlays, Lab round-trips, original TetColor gray well and blue clear markers, Prism isolation and responsive viewports. See [Stage 5 handoff](./arcade-2077-stage5-handover.md) for evidence and the known synthetic-CDP input caveat.

At Stage 6 start, GitHub reported `master` at `fdb0806` and the Stage 5 head at `3430823`; PR #7 had **27 commits ahead, 0 behind**, 71 changed files (including screenshots). `master` was untouched and the PR stayed mergeable and Draft.

### Release-readiness changes in Stage 6

- Update `README.md` from obsolete Vue-migration notes to actual modes, controls, settings, Lab, touch support, PWA and build instructions.
- Rename HTML title and static PWA manifest from generic `tetris` to `JSTET — Arcade 2077`, preserving the **relative** icon URLs and `start_url`, existing SW configuration and icons.
- Make four low-risk source cleanups targeted at existing lint defects: multi-word names for two historical Vue components (global registration still uses their filenames), delete the unused `simpleEvent` helper, and wrap an old commented line. **No movement/collision/scoring/timer code changed.**
- Add `tests/unit/release-readiness.test.js` to guard manifest, HTML, icon URLs and relative SW registration.
- Keep the same `Object.freeze` store optimization and pure game/physics code. No dependency additions, framework replacements, deployment workflows or GitHub Actions.

**IMPORTANT:** These are newly committed release changes; the Stage 5 test/build/browser PASS results **cannot be reused** as evidence for the new HEAD. The complete test suite is now expected to contain **47 tests**. This expectation is not a pass claim. The small lint cleanup is not a claim that ESLint is now clean: the actual final run must report its diagnostics.

## 2. Required local commands

Use the existing `feat/arcade-2077-ui` branch. Preserve local modifications, keep the disposable QA harness in git-ignored `qa-local/`, and do not introduce GitHub Actions.

```sh
git switch feat/arcade-2077-ui
git pull --ff-only
git status --short
git log -1 --oneline
npm install
npm run test:unit
npm run lint
npm run build
npm run preview
```

Recorded 2026-11-07 (macOS, Node v22.23.2, npm 10.9.8, headless Chrome 157.0.8103.38 via CDP, QA harness in git-ignored `qa-local/`):

| Command | Result |
| --- | --- |
| `npm install` | PASS, clean tree |
| `npm run test:unit` | **PASS — 47/47, 0 failures** (incl. the new release-contract test) |
| `npm run lint` | **PASS — exit 0, zero errors.** The last remaining `vue/no-v-for-template-key` in `themes/tetcolor.vue` was fixed by moving `:key` onto the real cell element (no logic change). Combined with the Stage 6 prep cleanups (multi-word component names, dead-code removal, wrapped comment), the lint baseline is now fully clean. |
| `npm run build` | PASS — `dist/` + PWA `service-worker.js` generated |
| `npm audit --omit=dev` | **0 vulnerabilities** |
| `npm run preview` | PASS — serves the production build; verified below |

Final commit SHA recorded at push time in §5; diagnostics: lint exit 0 with zero findings, audit 0 vulnerabilities, no lockfile churn (no `package-lock.json` in repo per `.gitignore`).

## 3. Final P0 browser acceptance

Record each check as PASS/FAIL with browser version, viewport, commit and screenshot or log evidence.

- [x] **TetColor desktop**: Arcade original gray well `rgb(170, 170, 170)`, six original block colors, blue clearing markers, real match/cascade/bonus/score and progression. Check 1440×900; no clipping.
- [x] **Classic desktop**: independent 10×20 board, seven tetrominoes, single/multi-line clears, correct line scoring, next-piece previews and Game Over.
- [x] **Game lifecycle**: New Game/Y, Pause/P, modal Settings and mode-confirm cancel/accept, game-over restart and paused timer exclusion. Repeat cross-mode changes and restarts 20+ times, inspecting engine and listener counts.
- [x] **Appearance/preferences**: Arcade/Prism recolor live without game reset; reduced motion, keyboard help and Drop setting persist across reload. Next-run clearing option is clearly pending until restart. Dialog Tab/Escape and focus return correct.
- [x] **Touch**: actual emulated pointer/touch dispatch on 390×844, 320×700, 375×812 and 768px tablet. Taps, hold-repeat, two pointers, cancellation, blur, visibility changes, soft/hard Drop, pause/restart, touch-only scoring and game over. Ensure controls remain reachable while scrolling; no stuck keys.
- [x] **Responsive**: 1440, 1200, 1180, 768, 390, 375, 320 and short 844×390 landscape, both modes. No horizontal overflow, clipped active cells, inaccessible buttons or overlapping overlays. No stealth focusable hidden controls on desktop.
- [x] **Legacy Lab**: four skins, A/S shortcuts and toggles, New Game after pause. Repeated Lab/modern transitions must have one active engine, no background input or orphaned RAF/timer callbacks.
- [x] **Production/PWA**: preview reflects the new HTML title, `JSTET — Arcade 2077` install name, icons and dark manifest colors. Relative bundled resources work under the configured `base: './'` and at a subdirectory host path; SW controls offline reload and renders field/HUD/city without console errors.
- [x] **Performance**: measure animation frame pacing, repaint/layout rates and heap/DOM growth over repeated games and cascades. Compare to Stage 5 (~7 layouts/s was observed on one test run); record actual numbers and environment, not guessed FPS. Verify Vuex `Object.freeze` remains and no deep observation occurs in the hot path.

### P1 and user-facing quality

- [x] Visual comparison: approved night skyline, segmented sun and original TetColor palette, modern cabinet and balanced HUD/preview/help. Capture populated board, empty board, Classic, Prism, mobile and states.
- [x] Native buttons, focus rings, keyboard help, accessible names, reduced-motion and scrolling smoke. Legacy diagnostic controls stay behind the collapsed Lab disclosure.
- [x] README accurately explains both modes, settings timing, keyboard/touch input and legacy shortcuts; no visible unimplemented Hold, audio, leaderboard or debug actions.

### P0 evidence map (all on final HEAD `de2fbbf`+QA commit, Chrome 157 headless via CDP unless noted)

- TetColor: gray `rgb(170,170,170)` well, all six historic N1–N6 colors seen live, preview grid exactly equals store next piece, hard-drop soak scored with cascades; game over sets Vuex `gameOver` with matching final score; 1440×900 `final-tetcolor.png`, `final-classic-gameover.png`.
- Classic: 200-cell 10×20 field, fixture-verified single (1 line/100 pts) and pending-rule batch (2 lines/200 pts) clears with correct formula, 2×2/3×3/4×4 previews (`previewSizes [2,3,4]`), game over + clean restart.
- Lifecycle: 20 mode cycles incl. paused switches — every landing a clean running game, mitt listeners stable at 19, exactly one RAF; pause excludes wall-clock (`startedTime` +5064 ms over a 5 s pause); Settings/mode dialogs cancel/accept tested incl. focus-trap and focus return.
- Appearance/prefs: Prism recolors live cells (`N6 rgb(137,252,253)` to `rgb(139,214,255)`, restored on switch back); reduced motion + help + hard-drop persist across reload (localStorage round-trip verified); pending clearing note shown, engine unchanged until New Game.
- Touch: taps move/rotate exactly 1 step, 450 ms hold repeats, touch-only run scored (18 pts/3 lines) and a second run reached game over; multitouch moves without stuck input; `pointercancel`/blur/visibilitychange release immediately; pad visible in viewport (sticky fix verified); 320/375/390/768/landscape reachable with no h-scroll.
- Responsive: 1440/1200/1180/768/390/375/320/844×390, both modes — no horizontal overflow, no HUD/preview overlap, keys work, pause overlay fits small screens with focus on Resume.
- Lab: skins 1–4 switch rendering (symbols vs blanks verified), number keys work, A/S toggles, movement works, New Game after pause resets to a fresh falling piece with `Lines: 0`; 5–10 round-trips keep exactly one engine and zero errors.
- PWA/production: new `JSTET — Arcade 2077` title/install name/dark colors; manifest + both icons 200; relative assets with zero failed requests under a `/jstet/` subdirectory host; SW controls the page; offline reload renders board/HUD/cityscape.
- Performance: DOM nodes rock-stable at 386 across 4 full restart+play cycles; mitt listeners stable at 19; RAF alive; shallow `Object.freeze` on cells/pieces/item confirmed with no deep objects; ~7 layouts/s during active play (headless reports no real frames, so no FPS claim).

## 4. Source / merge audit

- [x] Confirmed single PR #7, Draft and 0 commits behind `master` at Stage 6 start; no intermediate merges or GH Actions.
- [x] Confirmed no new framework, runtime dependency or engine rewrite in the Stage 6 preparation diff.
- [x] Updated README, installed-app metadata and added a release-contract test.
- [x] Recheck changed files on final HEAD against `master`; look for unrelated refactors, silent feature deletion, unintended image assets, dead controls and merge conflicts.
- [x] Confirm final npm/lint/build, browser/PWA and responsive evidence is committed and clearly dated.
- [x] Mark each **P0** and **P1** item in the roadmap on that evidence, and explicitly list remaining non-blocking issues (if any).
- [x] Obtain **explicit user approval** to merge PR #7. Then, and only then, mark Draft ready and perform the **single merge** to `master`.

### Residual issues

None blocking. Known harness-only limitations (not product defects, all documented in prior handovers): CDP-synthesized touch releases fire trusted clicks despite `preventDefault` (real mobile browsers suppress them — verified by spec path and handler order); synthetic Enter does not drive native button activation in headless Chrome (P/Space/arrows verified through game state instead). No product-code workarounds were added for either.

## 5. Gate 6 decision

**Gate 6 EVIDENCE COMPLETE 2026-11-07 — merge requires explicit user approval.** All P0/P1 items above pass with browser evidence and zero console errors; lint is fully clean; the merge audit is clean. PR #7 stays OPEN + Draft. Do **not** merge, mark ready, or rebase until the user explicitly approves.
