# Arcade 2077 — Stage 4: Visual System and Game States

> Status: **IMPLEMENTED — MAC/BROWSER QA PENDING**  
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
| New tests | **WRITTEN, NOT RUN in full repository** |
| Prior Stage 3 Mac QA | **PASS — 26/26 tests + browser/PWA** |
| Expected total test count | **31 — prediction, not a pass claim** |
| New build, lint, desktop/mobile game QA, measured performance | **NOT RUN — needs Mac/Opencode** |

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

- [ ] Screenshot 1440×900 Arcade/TetColor and compare to the approved design: stars, sunset stripes, skyline/water reflection, physical cabinet rim, readable orange HUD, illuminated board and useful right panels.
- [ ] Screenshot Classic at 1440×900: all 200 cells intact, clear 10-column geometry, readable score and preview.
- [ ] Test at 1200 and 1180 widths: skyline disappears without empty tracks, clipped content or accidental horizontal scrolling.
- [ ] Check 390×844, 320×700 and 844×390, both game modes: controls, board, HUD, dialogs, no horizontal overflow or overlapping panels.
- [ ] Verify Prism looks intentionally distinct, with sufficient contrast for cells, next preview and status overlays.
- [ ] Change score to six digits, show bonus and advance level: board bounding rectangle stays stable; meter tracks real `maxLevel`.

### Game state, focus and feedback

- [ ] Pause via P and header: board freezes, overlay appears, focus lands on Resume and P/Resume returns to identical gameplay state.
- [ ] Click overlay New Game while paused; verify clean board/counters and no stale timer/listener.
- [ ] Reach or force genuine Game Over in TetColor and Classic: final score matches Vuex and overlay New Game restarts cleanly.
- [ ] Open Settings or mode confirmation during active play: their dialogs own focus, not the paused overlay; cancel/close restores exact pre-dialog pause state.
- [ ] Tab through overlay native buttons and verify focus ring; keyboard does not accidentally drop pieces while dialogs are open.
- [ ] Trigger TetColor cascades and Classic clears: score, bonus and clear animations appear subtly, without painting/reflowing the full board every update.
- [ ] Toggle player Reduced motion and emulate OS `prefers-reduced-motion`: transitions/animations effectively disabled; paused clearing cells stop animating.
- [ ] Repeat mode and legacy Lab switches, restarts and overlays: one live input owner, zero new console/Vue errors.

### Production, performance and evidence

- [ ] Record Chrome version, build/test/lint exit codes and real performance observations (frame pacing/repaints/heap) while pieces fall and clear. Do not invent FPS.
- [ ] Run `npm run preview` and verify subdirectory-relative resources, manifest/icons, SW control and offline reload including SVG/HUD.
- [ ] Save desktop Arcade, Classic, Prism, Paused, Game Over and mobile screenshots with viewport and commit metadata in `docs/plans/baseline/screenshots/`.
- [ ] Record defects, fix them in **the same branch**, update this handoff and the roadmap.

## 4. Gate 4

**OPEN.** Do not mark this stage complete until browser evidence exists and the user approves the visual milestone. Keep PR #7 Draft; Stage 5 follows only after Gate 4 acceptance.
