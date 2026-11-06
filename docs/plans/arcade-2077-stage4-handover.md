# Arcade 2077 — Stage 4: Visual System and Game States

> Status: **RE-REVIEW COMPLETE 2026-11-06 on `feat/arcade-2077-ui` — refined composition verified in browser; explicit user approval requested; PR stays Draft**  
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

## 6. Visual reference comparison and follow-up refinement

The 1440×900 `arcade-desktop.png` captured during the first Stage 4 QA pass was compared to the approved Arcade Console / variant C.

**Comparison (2026-11-06): technical quality passed, visual fidelity not yet accepted.** The initial implementation had an oversized cropped sunset, insufficient high-rise skyline/reflection detail, a single very tall HUD panel with large blank regions, an overly wide board container around a narrow playfield, and an underdeveloped right sidebar. It should not be declared visually approved based on the earlier browser QA.

### Corrective work (same PR #7)

- Rebuild `CityscapeArt.vue` as a **portrait** 320×800 SVG with a correctly proportioned segmented sun, dense high-rise silhouette, stars and waterfront reflections.
- Rebalance the four-column desktop grid to emphasize the playable field and avoid excessive side margins.
- Split the score/level/blocks/bonus HUD into individual bounded cards while keeping their live Vuex values, and preserve a compact mobile layout.
- Add a clearly **illustrative** mode-specific match/line example to the help panel (not a second next-piece preview or a new game feature).
- Update the structural tests to cover the portrait SVG and layout/card refinements. No scoring, input, timers, game-state rules or `Object.freeze` changes.
- Retain the prior full browser evidence as the initial baseline rather than overwriting or mislabeling it.

### Re-review evidence — refined composition (2026-11-06)

Environment: macOS, Node v22.23.2, npm 10.9.8, headless Chrome 157.0.8103.38 via CDP, QA harness in git-ignored `qa-local/`. Commands: `npm install` clean, `test:unit` 33/33 (one new test initially asserted a single-line SVG coordinate string that the formatter had split across lines; fixed to assert the three attributes separately), `npm run lint` exit 1 with only the 5 pre-existing errors, `npm run build` exit 0.

- New Arcade desktop captures are labeled by run type: `arcade-clean.png` is a fresh load (0 settled cells, running), `arcade-populated.png` is the same session after real hard-drop play (25 settled cells, still running, score/lines from genuine play — not a synthetic filled well).
- Refined shell verified against variant C direction: portrait skyline column with proportional striped sun, dense high-rise silhouette with lit windows and water reflections; HUD split into SCORE / LEVEL (9-segment meter, 1 active) / BLOCKS cards; guide column with illustrative CONNECT THREE example; centered amber-framed 7x18/126-cell board; TetColor/Classic switch, New Game, Pause, Settings all visible, no raw JSON.
- Classic desktop: 10x20/200 cells, LINES label, correct 2x2/3x3/4x4-class previews (O + S shown), FILL A LINE example; Classic mobile 390x844 has no overflow.
- Responsive: 1200/1180 hide the skyline with no empty tracks or clipping; 390x844, 320x700, 844x390 in both modes — no horizontal scroll, no HUD/preview overlap, keys work, pause overlay fits and focuses Resume.
- Settings dialog and mode confirmation re-captured on the refined shell; live Arcade/Prism switch recolours real blocks (N6 `rgb(137,252,253)` to `rgb(139,214,255)`, restored on switch back); cancel keeps the running game.
- Gameplay spot checks on the refined build: pause overlay with focus ring, overlay New Game, header pause/resume via P, TetColor + Classic game overs with matching final scores and clean restarts, lab switch round-trip, settings tab trap — zero console errors.
- PWA preview on the refined build: relative assets, manifest + both icons 200, Service Worker controls the page, offline reload renders board, HUD and the SVG cityscape with zero non-network errors.
- Perf sample on the refined build (9.2 s active play): 6.4 layouts/s, 7.5 recalcs/s, heap +419 KB (no leak claim; headless reports no real frames so FPS is not claimed).

## 7. Gate 4 (re-review)

**Evidence recorded 2026-11-06; explicit user approval requested.** Do not start Stage 5 until the user approves the new composition. Keep PR #7 OPEN + Draft.

- [x] Run the expanded unit suite and production build; compare ESLint to the five pre-existing findings.
- [x] Capture new **Arcade theme from clean preferences**, at desktop 1440×900 **while the board has a meaningful number of settled cells**. Capture a second clean-start screenshot. Record which is which; do not treat a synthetic filled well as an ordinary run.
- [x] Compare desktop side-by-side to the approved image for composition, city visibility, color/contrast, board ratio, HUD density and right-side utility.
- [x] Check Classic at 1440×900 and both modes at 1200/1180 widths, 390×844, 320×700 and short landscape: no overflows or loss of game field.
- [x] Verify Arcade and Prism palettes, settings confirmation, Paused/Game Over overlays, key focus, reduced motion and PWA offline reload.
- [x] Record screenshots with commit SHA/browser and measured UI/perf observations in this handover; request **explicit user approval** for the new composition.

## 8. Historical TetColor palette correction (user requested)

After the refined Stage 4 QA, the user preferred the actual 1990s TetColor well rather than a dark sci-fi grid. The historical renderer in `src/components/themes/tetcolor.vue` at `f38d36c` confirms:
- Blank well cells: `#AAAAAA`, with a flat `#201F20` border on filled and adjacent cells.
- Six piece colors, already unchanged in the new Arcade theme: `#89FB6E`, `#EC64F8`, `#EC615C`, `#FFFE73`, `#5458F6`, `#89FCFD`.
- Clearing marker: `#000BA4`.

This correction scopes the historic flat well appearance **only to `theme-arcade` + TetColor mode**. Classic and Prism keep their current dark board and colors. The next-piece preview remains dark/transparent as before; the illuminated outer cabinet frame, skyline, HUD and game engine are unchanged.

The updated board uses CSS custom-property overrides, not runtime loops or mutations. Two source-level checks guard historical values and theme isolation.

**Post-change QA still required:** rerun unit tests, lint and build; inspect Arcade TetColor with both empty and populated cells, confirm borders/clearing marker and the unchanged Classic/Prism appearance on desktop/mobile, then verify PWA offline reload. Capture new screenshots with a commit SHA and request final visual approval. Do not treat the earlier 33/33 result as validation of this later correction; keep PR #7 Draft and Stage 4 acceptance pending.

## 9. User visual approval and Stage 5 verification carry-over

The user approved the modern cabinet with original TetColor colors and explicitly asked to continue. This approves the **visual direction**, not an unrun post-color production build. Stage 5 implementation has begun in the same Draft PR #7. The mandatory post-color verification is carried into [Stage 5 handoff](./arcade-2077-stage5-handover.md); Gate 4 remains technically open until test/build/Chrome proof is recorded.

## 10. Final Gate 4 closure (2026-11-07)

After the user's approval of the original TetColor color restoration, the Stage 5 Mac QA at `3430823` independently verified the final palette and previous visual work: **46/46 tests**, production build PASS, Arcade+TetColor empty cells `rgb(170, 170, 170)`, original `rgb(0, 11, 164)` clear markers, and Prism/Classic dark wells unchanged. Responsive checks, dialog overlays, reduced motion, touch, performance and PWA offline reload passed in Chrome 157 with zero console errors. See [Stage 5 recorded results](./arcade-2077-stage5-handover.md).

**Gate 4: CLOSED** on that evidence. This closes the earlier pending statements in sections 8–9; they remain as a chronological record, not current blockers. Stage 6 still requires its own final commit QA before any merge.
