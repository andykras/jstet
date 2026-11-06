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

Capture exit codes, Node/npm versions, final commit SHA and complete diagnostics in this file. If any new or old ESLint errors remain, identify their exact rule/file/line and fix them **only if changes are behavior-preserving**. If full zero-error lint cannot be achieved safely, document the remaining violations and release implications instead of suppressing ESLint globally.

`npm audit --omit=dev` can be run for a production-dependency security check. Report advisory severity and whether the issue affects deployed static assets; do not automatically upgrade dependencies or introduce lockfile churn unrelated to the release.

## 3. Final P0 browser acceptance

Record each check as PASS/FAIL with browser version, viewport, commit and screenshot or log evidence.

- [ ] **TetColor desktop**: Arcade original gray well `rgb(170, 170, 170)`, six original block colors, blue clearing markers, real match/cascade/bonus/score and progression. Check 1440×900; no clipping.
- [ ] **Classic desktop**: independent 10×20 board, seven tetrominoes, single/multi-line clears, correct line scoring, next-piece previews and Game Over.
- [ ] **Game lifecycle**: New Game/Y, Pause/P, modal Settings and mode-confirm cancel/accept, game-over restart and paused timer exclusion. Repeat cross-mode changes and restarts 20+ times, inspecting engine and listener counts.
- [ ] **Appearance/preferences**: Arcade/Prism recolor live without game reset; reduced motion, keyboard help and Drop setting persist across reload. Next-run clearing option is clearly pending until restart. Dialog Tab/Escape and focus return correct.
- [ ] **Touch**: actual emulated pointer/touch dispatch on 390×844, 320×700, 375×812 and 768px tablet. Taps, hold-repeat, two pointers, cancellation, blur, visibility changes, soft/hard Drop, pause/restart, touch-only scoring and game over. Ensure controls remain reachable while scrolling; no stuck keys.
- [ ] **Responsive**: 1440, 1200, 1180, 768, 390, 375, 320 and short 844×390 landscape, both modes. No horizontal overflow, clipped active cells, inaccessible buttons or overlapping overlays. No stealth focusable hidden controls on desktop.
- [ ] **Legacy Lab**: four skins, A/S shortcuts and toggles, New Game after pause. Repeated Lab/modern transitions must have one active engine, no background input or orphaned RAF/timer callbacks.
- [ ] **Production/PWA**: preview reflects the new HTML title, `JSTET — Arcade 2077` install name, icons and dark manifest colors. Relative bundled resources work under the configured `base: './'` and at a subdirectory host path; SW controls offline reload and renders field/HUD/city without console errors.
- [ ] **Performance**: measure animation frame pacing, repaint/layout rates and heap/DOM growth over repeated games and cascades. Compare to Stage 5 (~7 layouts/s was observed on one test run); record actual numbers and environment, not guessed FPS. Verify Vuex `Object.freeze` remains and no deep observation occurs in the hot path.

### P1 and user-facing quality

- [ ] Visual comparison: approved night skyline, segmented sun and original TetColor palette, modern cabinet and balanced HUD/preview/help. Capture populated board, empty board, Classic, Prism, mobile and states.
- [ ] Native buttons, focus rings, keyboard help, accessible names, reduced-motion and scrolling smoke. Legacy diagnostic controls stay behind the collapsed Lab disclosure.
- [ ] README accurately explains both modes, settings timing, keyboard/touch input and legacy shortcuts; no visible unimplemented Hold, audio, leaderboard or debug actions.

## 4. Source / merge audit

- [x] Confirmed single PR #7, Draft and 0 commits behind `master` at Stage 6 start; no intermediate merges or GH Actions.
- [x] Confirmed no new framework, runtime dependency or engine rewrite in the Stage 6 preparation diff.
- [x] Updated README, installed-app metadata and added a release-contract test.
- [ ] Recheck changed files on final HEAD against `master`; look for unrelated refactors, silent feature deletion, unintended image assets, dead controls and merge conflicts.
- [ ] Confirm final npm/lint/build, browser/PWA and responsive evidence is committed and clearly dated.
- [ ] Mark each **P0** and **P1** item in the roadmap on that evidence, and explicitly list remaining non-blocking issues (if any).
- [ ] Obtain **explicit user approval** to merge PR #7. Then, and only then, mark Draft ready and perform the **single merge** to `master`.

## 5. Gate 6 decision

**OPEN.** The earlier Stage 5 QA is strong evidence but does not constitute release validation on the new Stage 6 commit. Leave PR #7 OPEN + Draft; use only this branch for final fixes and evidence. Once all P0 items are confirmed, any residual problems are documented and the user approves the merge, Gate 6 can close.
