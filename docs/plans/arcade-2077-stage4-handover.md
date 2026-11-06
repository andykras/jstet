# Arcade 2077 — Stage 4: Visual System and Game States

> Status: **STAGE 4 COMPLETE - local QA passed 2026-11-06 on `feat/arcade-2077-ui`; visual milestone awaits user approval; PR stays Draft**  
> Branch: `feat/arcade-2077-ui` · [Draft PR #7](https://github.com/andykras/jstet/pull/7)  
> Approved reference: [Arcade Console — variant C](./arcade-2077-ui-reference.avif)  
> Previous acceptance: [Stage 3](./arcade-2077-stage3-handover.md)

## 1. Scope implemented

- `src/components/CityscapeArt.vue`: local vector skyline, starfield, segmented sunset, reflective water and layered buildings; no network image requests and no full mockup screenshot used as a background. Decorative in the player screen.
- `src/styles/arcade-stage4.styl`: cohesive amber/violet cabinet skin, glow, typography, dark game board, real-cell clear markers, button/focus treatments and Stage 4 responsive layout.
- Desktop layout at >1200px: panoramic skyline | HUD | board | next/help. At <=1200px the artwork is hidden in favor of the prior three-column shell; at <=920px the original compact mobile stack is restored.
- `src/App.vue`: non-modal board Pause and Game Over overlays wired to the existing Vuex `status`, each with actual Resume/New Game actions. Initial focus is sent to the primary overlay action, except while Settings or mode confirmation owns focus.
- `src/components/GameHud.vue`: CSS-only score and bonus feedback plus level meter using `level+1` and the actual configured `maxLevel`.
- Reduced motion follows both the player preference and `prefers-reduced-motion`. Clearing animation pauses while the game is paused.
- `tests/unit/arcade-visuals.test.js`: five guardrail tests; no new test framework or runtime dependencies.

**Not implemented in Stage 4:** sound, hold, leaderboards, new game rules, touch controls or a new animation engine. No changes to `src/utils/game.js`, board structure, Vuex state model, `Object.freeze`, or scoring/collision algorithms. Stage 5 owns touch input and Lab polish.

## 2. Verification status

| Check | Result |
| --- | --- |
| Source inspection and GitHub diff | **PASS — static only** |
| New tests | **PASS on Mac — 31/31, 0 failures** (one new test initially read the wrong stylesheet for `.jstet-app.reduce-motion`; fixed to `arcade-shell.styl` where the rule lives) |
| Prior Stage 3 Mac QA | **PASS — 26/26 tests + browser/PWA** |
| Expected total test count | **31 — met: 31/31 pass** |
| New build, lint, desktop/mobile game QA, measured performance | **PASS — build exit 0, lint exit 1 with only the 5 pre-existing errors, full browser + perf evidence in section 5** |

Prior known lint baseline: 5 unrelated/pre-existing errors. Record new errors separately.

## 3. Mac / Opencode QA handoff

Use the **existing PR #7 and branch only**. Preserve local work. No GitHub Actions or intermediate merges.

```sh
git switch feat/arcade-2077-ui
git pull --ff-only
npm install
npm run test:unit
npm run lint
npm run build
npm run dev
```

### Visual and responsive acceptance

- [x] Screenshot 1440×900 Arcade/TetColor and compare to the approved design: stars, sunset stripes, skyline/water reflection, physical cabinet rim, readable orange HUD, illuminated board and useful right panels.
- [x] Screenshot Classic at 1440×900: all 200 cells intact, clear 10-column geometry, readable score and preview.
- [x] Test at 1200 and 1180 widths: skyline disappears without empty tracks, clipped content or accidental horizontal scrolling.
- [x] Check 390×844, 320×700 and 844×390, both game modes: controls, board, HUD, dialogs, no horizontal overflow or overlapping panels.
- [x] Verify Prism looks intentionally distinct, with sufficient contrast for cells, next preview and status overlays.
- [x] Change score to six digits, show bonus and advance level: board bounding rectangle stays stable; meter tracks real `maxLevel`.

### Game state, focus and feedback

- [x] Pause via P and header: board freezes, overlay appears, focus lands on Resume and P/Resume returns to identical gameplay state.
- [x] Click overlay New Game while paused; verify clean board/counters and no stale timer/listener.
- [x] Reach or force genuine Game Over in TetColor and Classic: final score matches Vuex and overlay New Game restarts cleanly.
- [x] Open Settings or mode confirmation during active play: their dialogs own focus, not the paused overlay; cancel/close restores exact pre-dialog pause state.
- [x] Tab through overlay native buttons and verify focus ring; keyboard does not accidentally drop pieces while dialogs are open.
- [x] Trigger TetColor cascades and Classic clears: score, bonus and clear animations appear subtly, without painting/reflowing the full board every update.
- [x] Toggle player Reduced motion and emulate OS `prefers-reduced-motion`: transitions/animations effectively disabled; paused clearing cells stop animating.
- [x] Repeat mode and legacy Lab switches, restarts and overlays: one live input owner, zero new console/Vue errors.

### Production, performance and evidence

- [x] Record Chrome version, build/test/lint exit codes and real performance observations (frame pacing/repaints/heap) while pieces fall and clear. Do not invent FPS.
- [x] Run `npm run preview` and verify subdirectory-relative resources, manifest/icons, SW control and offline reload including SVG/HUD.
- [x] Save desktop Arcade, Classic, Prism, Paused, Game Over and mobile screenshots with viewport and commit metadata in `docs/plans/baseline/screenshots/`.
- [x] Record defects, fix them in **the same branch**, update this handoff and the roadmap.

## 4. Gate 4

**Gate 4 passed on evidence 2026-11-06; the visual milestone itself awaits user approval.** Keep PR #7 Draft; Stage 5 follows only after user acceptance of the look.

## 5. Local QA evidence (2026-11-06, QA branch `feat/arcade-2077-ui`)

Environment: macOS, Node v22.23.2, npm 10.9.8, headless Chrome 157.0.8103.38 via CDP. Commands: `npm install` clean, `test:unit` 31/31, `lint` exit 1 (only the 5 pre-existing errors: single-word component names, `v-for` template key, unused legacy helper, commented-out long line), `build` exit 0. Harness lives in `qa-local/` (git-ignored, never committed).

### Fixes in this branch

- Product: pausing while game keys had focus (e.g. P with focus inside the non-modal game overlay) deadlocked keyboard input — `shouldIgnoreGameInput` treated any `role="dialog"` as modal. Scoped the focus trap to `aria-modal="true"`, so Settings/mode dialogs still own keys while the `aria-modal="false"` game overlay does not. Verified: P resumes from the focused Resume button; modal dialogs still swallow game keys.
- Test: one new `arcade-visuals` case asserted `.jstet-app.reduce-motion` in the wrong stylesheet; pointed at `arcade-shell.styl` where the rule lives. 31/31 pass.
- Lint: new `CityscapeArt.vue` introduced 81 `vue/max-attributes-per-line` errors; fixed with `eslint --fix` (attribute splitting only, no visual change). Back to the 5 pre-existing errors.

### Visual vs Arcade Console reference

1440x900 Arcade/TetColor shows the approved composition: starfield (14 stars), striped setting sun with water reflection and lit towers on the left, amber/orange glowing board frame, dark board, readable amber HUD with 9-segment level meter (1 active at level 1), next preview and help on the right. Board rect is pixel-stable across 6-digit scores, +bonus, level-ups and Arcade/Prism theme switches. Prism is clearly distinct (violet accents, recoloured N1 cell) with no geometry change.

### Game states, focus and motion

- Pause via P and header: overlay appears (`PAUSED`, `SESSION ON HOLD`), focus lands on Resume with a visible ring (outline 3px + glow), root carries `is-paused`, arrows/Space move nothing.
- Overlay New Game restarts clean (0 settled, score 0); header pause/resume cycle works; P resumes from the focused button.
- TetColor and Classic game overs show `GAME OVER` with the final score matching Vuex; overlay New Game restarts cleanly in both modes.
- Settings and mode-confirmation dialogs hide the paused overlay, own focus, and Escape/Keep-playing/Done restore the exact prior paused state.
- Clearing markers caught mid-animation freeze with `animation-play-state: paused` under `is-paused` (6 markers, all paused).
- Player Reduced-motion and OS `prefers-reduced-motion` reduce transitions/animations to ~0 (score ignite 0.38s to 0.01ms, cell transitions to 0/0.01ms).
- Synthetic Enter/Space do not drive native button activation in this headless setup (0 clicks on a plain control button), so Enter-to-Resume is validated by code path (focused primary action + native semantics), not by synthetic key; P/Space/arrows gating while paused is verified by engine state.

### Layout, PWA and performance

- 1440x900 / 1200 / 1180 / 390x844 / 320x700 / 844x390, both modes: no horizontal scroll, no HUD/preview overlap, skyline correctly hidden <=1200px, pause overlay fits small screens, keys work, zero console errors.
- `npm run preview`: relative assets, manifest + both icons 200, Service Worker controls the page, offline reload renders board, HUD and cityscape with zero non-network errors.
- 9.2 s of active play with drops: 136 layouts (14.8/s), 231 style recalcs (25.2/s), 78 ms layout + 673 ms recalc total (~7% of a 60 fps budget on style+layout); heap +1 MB over the window (no leak claim — single short window). Headless Compositor reports no real frames, so FPS is not claimed.

### Harness lessons (no product impact)

- Synthetic Space keyup on a focused overlay button natively resumes the game; input-gating probes now blur focus and use arrows. Game keys remain correctly gated while paused (verified via engine state).
- A Chrome profile inside the Vite root triggers full page reloads (Vite watches the tree); the QA profile now lives in `$TMPDIR`. Mid-run screenshots into `docs/` are safe.

### Screenshots

- `arcade-desktop.png` (1440x900 Arcade/TetColor), `arcade-prism.png`, `arcade-paused.png`, `arcade-gameover.png`, `arcade-classic.png`, `arcade-classic-mobile.png` (390x844), `arcade-clearing-paused.png`.
