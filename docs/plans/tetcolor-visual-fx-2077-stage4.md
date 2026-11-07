# JSTET — Visual FX 2077 / Stage 4 handoff

> Updated: 2026-11-07  
> Branch: `feat/tetcolor-visual-fx-2077`  
> Status: **Implemented and committed; full-repository and browser QA still pending**  
> Pull request: [#12](https://github.com/andykras/jstet/pull/12) (Draft; do not merge or deploy)

## Objective and visual result

Premium but brief and readable **TetColor combo and gravity-cascade celebrations**, separated by real gameplay semantics:

- **Consecutive piece matches:** the second successful consecutive TetColor piece yields a compact warm `COMBO ×2` and `+150` popup near the matched cells (with default `scorePart: 10`). A third consecutive matching piece yields `COMBO ×3` and `+300`, etc. Later combos get brighter accents, **not longer animations**. A first match, broken streak, or zero bonus produces no celebration.
- **Gravity cascade:** a newly detected match caused by settling blocks yields a distinct cool-blue `CASCADE ×1` (or higher depth), the **exact amount already awarded by the engine**, a localized expanding ripple and a brief cyan well-rim response. Cascades never masquerade as consecutive-piece combos.
- **Well-frame response:** a nonopaque warm (combo) or cool (cascade) frame outline pulses for ~560 ms without changing the board's border, padding, cell sizes or HUD layout.
- **Local score feedback:** the popup near the average center of the actually matched cells shows the precise positive reward, not a predicted total. It animates upward/fades over ~760 ms without obscuring the board for an entire second.
- **Low-cost visuals:** a maximum of **two** transient celebration popups/frame cues at once; a maximum of 24 existing per-cell trails/clear effects from the previous stages. No particle dependencies, game-frame work, or new audio cues.

All Stage 4 effects are subject to **Visual FX Off by default**, are supported in Arcade and Prism (the active selected visual theme), and do not render in Legacy or Classic gameplay. The in-app Reduced motion setting and `prefers-reduced-motion` suppress these transient animations entirely.

## Source changes

### Engine boundary: `src/utils/game.js`

- `fx:combo` is emitted **once** inside the existing `if (combo > 0)` branch, **after** the engine updates `game.bonus` and `game.score` and publishes `bonus`/`score`. Its frozen descriptor contains `{ amount: combo, streak: game.matchStreak, cells: clearFxCells }`.
- `fx:cascade` is emitted **once** per new gravity-induced matching group after the authoritative cascade bonus and score are updated/published. Its frozen descriptor is `{ amount: cascadeBonusAwarded, depth: game.cascadeDepth, cells: clearFxCells }`; emission is gated by `cascadeBonusAwarded > 0`.
- `game.cascadeDepth` is **visual-only metadata**, initialized at each run and reset for each newly locked TetColor piece. It increments only when gravity discovers another matching group; neither `game.chainBonus` nor the original `cascadeBonus()` calculation changes.
- `detectClears()` captures original matched-color coordinates when the optional `fx:combo` / `fx:cascade` listener exists, in addition to Stage 3 clear subscribers. With FX Off, no new snapshot or celebration payload is created. The original audio, falling/locking logic, scores and bonus computations remain unchanged.

### Pure coordinates: `src/utils/visualFx.js`

- `getFxAnchor(cells)` computes the actual center of a nonempty matched-cell snapshot, excluding invalid positions and returning a frozen `{ column, row }` object (or `null` if none). It never reads DOM or changes the engine state.

### Presentation: `src/components/VisualFxOverlay.vue`

- Reuses the existing optional `v-if="visualFx"` overlay, with two new event listeners `fx:combo` and `fx:cascade`.
- A celebration is created **only** while running, unpaused, visible and allowed by both motion preferences; requires a positive integer amount and an actual matched-cell center. Combo requires `streak >= 2`; cascade requires `depth >= 1`.
- `MAX_CELEBRATIONS = 2`, `CELEBRATION_DURATION = 760`. Expired/evicted effects clear their timers. The existing `clear()` also clears celebrations on toggle Off, new game, pause, game over, resize, blur, tab hide, Legacy switch and unmount. All subscriptions are removed on teardown.
- Popups are `aria-hidden` because the existing accessible Bonus HUD already presents the authoritative amount; no duplicate score announcements or sound playback.

### Styling: `src/styles/tetcolor-bonus-fx.styl`

- `.jstet-app.fx-enabled`-gated styles for warm combo pop, cool cascade pop, two intensity tiers, a small expanding cascade energy ripple and a brief well-rim pulse.
- Anchors use the real CSS `--jstet-cell-size` and are clamped within the well; no extra width/height is applied to grid cells.
- CSS uses bounded `opacity` and `transform` animations. No full-board opaque overlay or continuous unsettled-block effects.
- Dedicated application and OS reduced-motion fallbacks. Imported at the end of the Stage 1–3 FX styles in `src/App.vue`.

## Tests and status

- Added `tests/unit/visual-fx-bonus.test.js` (6 repository test cases) for actual combo/cascade formula outputs, immutable match-coordinate anchoring, positive/typed FX contracts, no replay of `score` or `bonus` events, bounded event lifecycles, FX default Off, stylesheet opt-in isolation and responsive/reduced-motion rules.
- An isolated Node 22 reproduction of the exact pure reward/anchor calculations passed **5/5 tests** (rewards, cascade growth, center mapping, invalid data and filtering). This was **not** a run of the repository test suite.
- A new nested Stylus selector test mismatch was corrected in the same branch before handoff.
- **Unverified:** actual `npm run test:unit`, `npm run lint`, `npm run build`, Vue/Stylus compilation, browser/phone visuals, event-integration playthrough, FPS and PWA production preview. The execution environment has Node but cannot resolve github.com for `git clone`, and Vue/Vite/Stylus are not installed. Do not mark Stage 4 QA complete on the basis of isolated checks.
- No GitHub Actions, merge or deployment.

## Local Mac/Opencode QA gate

Use the project `AGENTS.md` and this branch. The full Stages 0–3 QA gates are also still pending.

1. From the branch, run `npm run test:unit`, `npm run lint`, `npm run build`; fix any failing code/test or Stylus compilation errors on the same branch. Document actual test counts.
2. On a clean browser profile, verify default **Visual FX Off** and unchanged TetColor/Arcade baseline. Toggle on/off during a live run; neither game state nor score should reset.
3. In TetColor, trigger two and three *consecutive pieces* that each cause a match: the popup should appear **only** on second and later matching pieces with exact awarded amounts, despite score and Bonus HUD updates. Break the streak and verify no false bonus effect.
4. Build a gravity cascade after a clear: trigger a separate blue ripple and actual `CASCADE ×depth` bonus; verify reward amounts match the HUD and no duplicate effect arises from `bonus` or `score` event snapshots.
5. Test cleared groups at the left/top/right/bottom, low and high scores, rapid repeated clears, and the maximum allowed concurrent effects. Labels must remain within the well, brief and legible.
6. Test both Arcade/Prism visual themes, TetColor and Classic modes, 320×568, 375×667, 390×844, 428×926, 768×1024 and 1366×768; Next preview, HUD and mobile controls must never shift. Classic must not show TetColor-specific combo/cascade labels.
7. Check both reduced-motion settings, sound on/off, pause, game over, new game, mode switch, Legacy round trip, resize, blur, tab hide and toggling FX Off mid-celebration for proper cleanup.
8. Inspect browser performance (approximately 60 FPS target on a representative phone), screenshots, and the PWA production preview. If FX are expensive, reduce FX density instead of altering gameplay.

## Next step

**Stage 5:** integrated full-repository validation, real-browser visual polish, mobile performance and final regression/acceptance. Do **not** merge or deploy until all gates are complete and the user explicitly approves.
