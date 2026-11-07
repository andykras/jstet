# JSTET — TetColor Visual FX 2077

> Status: **IN PROGRESS — Stages 0–2 implemented; full-repository and browser QA pending**  
> Updated: 2026-11-07  
> Branch: `feat/tetcolor-visual-fx-2077` (from the latest `master`)  
> Scope: modern Arcade gameplay renderer; **no changes to the legacy implementation**  
> Related: [Arcade 2077 UI roadmap](./arcade-2077-ui-roadmap.md), [project engineering guide](../../AGENTS.md)

## 1. Product goal

Make TetColor feel like a premium, tactile, futuristic arcade game: vivid glass-like blocks, subtle active-piece energy, responsive impact, clean elimination FX, and increasingly rewarding combo/cascade celebrations.

**Rule of contrast:** the idle board is elegant and readable; important gameplay events produce brief, satisfying motion. The board must remain visually primary. No permanent flashing or disruptive bloom.

### Non-negotiable defaults and boundaries

- **TetColor remains the default game mode** (`App.vue`: `mode: 'tetcolor'`). Classic remains available and playable.
- **Visual FX are OFF by default (No FX)** for all users, including first launch and when no preference is stored. The starting gameplay must look and behave as the current baseline, without enhanced glass materials, active-piece pulse, trails, impact flashes, particles, or combo celebrations.
- Add an explicit **Visual effects: Off / On** control under Settings. Opt-in only; enabling FX is immediate, does not restart or reset the game, and the choice persists across reloads. Turning it off immediately cancels existing cosmetic effects and restores baseline rendering.
- Implement the FX switch as a presentation preference (e.g. `visualFxEnabled: false`); **do not couple it to game mode or Arcade/Prism theme**. Both appearance themes remain selectable independently. Normalize missing/invalid historical saved values to `false` without losing existing preferences.
- Reduced motion remains an independent restriction: when FX is On but reduced motion is requested, present only static/low-motion styling. **No FX** must be fully inactive regardless of reduced-motion and sound settings.
- The **existing TetColor skin/palette is the visual baseline and default**. Preserve the original six TetColor colors (`#89fb6e`, `#ec64f8`, `#ec615c`, `#fffe73`, `#5458f6`, `#89fcfd`) and the current Arcade console appearance as the default (`preferences.theme: 'arcade'`). Add depth/gloss/light within those identities; do **not** silently switch the blocks to a generic all-cyan neon skin, create another default skin, or change their gameplay meaning.
- Keep existing Arcade and Prism appearance preferences functional; Prism remains a supported alternate with its own palette. FX should derive from color tokens rather than hard-coded one-theme values.
- Keep the existing light-gray TetColor well / grid contract in the default Arcade presentation unless explicitly approved otherwise.
- Retain current playable dimensions, centered board, measured square cell sizing, next-piece cropping, mobile HUD, and controls. No layout regressions.
- Existing `reducedMotion` preference and `prefers-reduced-motion` are authoritative; users who request reduced motion get static/low-distraction feedback.
- Preserve the modern game's rules, piece distribution, lock/drop timing, matching/line-clear order, scoring, bonuses, cascades, keyboard/touch semantics, and PWA/static deployment.
- Do not remove or refactor the deliberate `Object.freeze` hot-path optimization, migrate the framework, or rebuild the game engine.
- No deploy, merge, or GitHub Actions without explicit approval. Deliver one cumulative **Draft PR**, with checkpoints committed in sequence, followed by final browser QA and review.

## 2. What exists today (verified against the repository)

- Vue 3 Options API + Vuex 4 + Vite 7 + Stylus + mitt.
- `src/components/themes/tetcolor.vue` renders the active playable well as `.game-cell` elements with `N1`…`N7` color classes and `N-2` clear markers.
- `src/components/NextPiece.vue` reuses `.game-cell` and crops empty preview margins; the FX treatment must work with this without animating unused preview cells.
- `src/styles/game-cells.styl` owns shared block colors and edge treatment. `src/styles/arcade-shell.styl` owns theme tokens, default TetColor well styling, Prism overrides and reduced-motion rules. Additional responsive styles are layered in `arcade-*.styl`.
- `src/utils/game.js` is the animation/game loop. It already emits `update`, `status`, `bonus`, `sound:drop`, `sound:clear`; `src/utils/sounds.js` subscribes to the existing sound events.
- Current audio assets: mainframe hum `buzz.mp3`, keyboard `click.mp3`, landing `drop.mp3`, clear `line2.mp3`.
- TetColor matching uses `src/game/tetcolor.js`; Classic line clears use `src/game/tetris.js`. TetColor supports a `singleBlock` clear option; the UI must not presume all matches disappear simultaneously.
- No dedicated cosmetic FX event/payload contract or overlay layer exists yet. Visual FX should not try to deduce lock/match coordinates from score changes.
- Current default preferences: `theme: 'arcade'`, `reducedMotion: false`. Existing `game-cell` CSS and tests protect TetColor color/grid baseline.

## 3. FX architecture and performance contract

**Game simulation owns outcomes; a presentation-only controller owns FX.**

1. Keep `src/game/*` as the source of truth. Publish a few **discrete, immutable FX descriptors** at meaningful game-event boundaries via the existing `gameBus` (`mitt`), only when necessary. Candidate event names: `fx:move`, `fx:lock`, `fx:clear-start`, `fx:clear-step`, `fx:combo`, `fx:cascade`. Final names/payloads are part of Stage 0 and must be documented/tests covered. Do not emit a new event on every animation frame.
2. Payloads carry the event type, logical playable-cell coordinates and colors, and optional magnitude/streak; **copy small metadata, not mutable board arrays**. Coordinate conversion must respect the current hidden rows and well getters.
3. Use CSS custom properties, gradients, borders, pseudo-elements and short keyframe animations for block appearance. Add an **absolutely positioned, pointer-events-none FX overlay** scoped to the well for transient trails/waves/particles. Overlay elements must not change grid geometry or steal touch input.
4. Introduce a thin Vue Options API FX component/controller only as needed. Subscribe/unsubscribe on mount/unmount and on mode/legacy switches. Use stable IDs and a small bounded pool of effects; remove expired instances and cancel animation/timeout/RAF work on restart, pause, visibility change and unmount.
5. Scope continuous glow and animation to the **active falling piece**, not every settled block. Identify active cells correctly from the piece's state rather than coloring all same-valued blocks alike.
6. Animate `transform` and `opacity` when possible. Avoid per-frame Vuex changes, board clones, large animated `box-shadow`/filter layers, dozens of permanent `will-change` hints, and huge particle DOM counts. Gradient styling is mostly static; any animation should be bounded.
7. Respect **both** application reduced motion and OS media preference. Keep final-state information and scoring visible when animation is suppressed. Pause/hidden tab = no new visible effects; reset clears all stale FX.
8. Share timing with already-existing audio/event sources: impact when `sound:drop` fires; match at `sound:clear` only as appropriate. Do not add duplicate sound playback or delay engine outcomes while an animation finishes.
9. Feature gracefully degrades with disabled animations or under-resourced mobile hardware. The game must remain fully playable without the overlay.

## 4. Sequential implementation plan

**Workflow for each stage:** implement a narrow slice, add targeted tests, run `npm run test:unit`, `npm run lint`, `npm run build`, visually inspect desktop + mobile and both modes, then commit on this branch. Update this plan with evidence and stage status. Advance only after the preceding stage is complete. Keep the PR Draft; do not merge intermediate stages.

### Stage 0 — Establish FX contracts and baseline

**Status:** [ ] Code implemented; browser baseline and full-repository checks pending — see [Stage 0 handoff](./tetcolor-visual-fx-2077-stage0.md).

Tasks:
- Capture baseline screenshots and a short representative perf trace for TetColor/Classic on desktop and a real phone or mobile browser; record current cell size, preview, frame-time behavior and existing animation.
- Check present bus event order, especially hard drop, normal lock, repeated match clearing, TetColor cascades, single-block versus batch clearing, and Classic line clears.
- Specify minimal immutable FX payloads and cell-to-overlay coordinate conversion (including resized wells).
- Set a bounded effect-count / animation-lifetime policy; define cancellation on `pause`, restart, legacy switch, game-over, navigation and visibility changes.
- Create reusable FX tokens/timings and reduced-motion fallback before creating elaborate effects.
- Add the explicit Visual effects Off/On preference with **default false**, persistence and backward-compatible normalization; define a reliable baseline/no-FX CSS gate. Ensure the preference can change immediately without restarting the game.
- Add Stage 0 contract tests so audio/gameplay events cannot be accidentally duplicated.

**Gate:** Baseline and event diagram recorded; default No FX is demonstrably identical to the pre-FX baseline; opt-in toggle, persistence, runtime cancellation, and legacy saved-preference migration are tested; cosmetics are isolated from gameplay; tests remain green.

### Stage 1 — Living TetColor glass blocks

**Status:** [ ] Implementation committed; full-repository and real-browser QA pending — see [Stage 1 handoff](./tetcolor-visual-fx-2077-stage1.md).

Visuals:
- Preserve every original TetColor hue; give filled cells a subtle inset highlight, directional glass gradient, slim crisp rim, low-strength inner shadow, and restrained specular glint.
- Build visual depth without changing cell boundaries or empty-cell legibility.
- Active falling piece: a very subtle low-frequency energy pulse or rim highlight; settled blocks remain mostly still and slightly calmer.
- Next-piece preview uses the same premium materials at an appropriately readable scale, **without aggressive pulse/trail/FX**.
- Preserve the current `N1`…`N7` color mapping for Classic and the Prism-specific color tokens.

Implementation:
- Prefer `src/styles/game-cells.styl` and isolated FX CSS tokens. Extend `tetcolor.vue` / `NextPiece.vue` only for correct active/preview identification.
- Any added pseudo-elements/markup must not affect square cell sizing, mobile maximum-fit layout or board hit testing.

**Gate:** With FX On, colors are unmistakably TetColor, cells are crisp at small phone sizes, board and Next remain geometrically unchanged, and reduced-motion produces a polished static look. With FX Off, block materials remain exactly at their baseline styling.

### Stage 2 — Motion, hard drop and physical landing

**Status:** [ ] Implementation committed; full-repository and real-browser QA pending — see [Stage 2 handoff](./tetcolor-visual-fx-2077-stage2.md).

Visuals:
- On lateral movement/rotation: a restrained ~80–150 ms edge/trail accent, never a full-board flash.
- On hard drop: a short vertical energy streak tied to the actual drop path (not simulated by visually slowing the piece).
- On lock/impact: a crisp ~100–220 ms contact flash / local shock ring, stronger for hard drop and smaller for natural gravity landings.
- Subtle board-frame response is allowed only if it does not change layout or visually hide cells.

Implementation:
- Emit distinct events at the **successful movement**, hard-drop and **actual lock** boundaries. Do not use raw keydown alone as proof of a movement.
- Obtain starting/ending logical coordinates before the engine mutates the item; handle zero-distance drops and blocked moves.
- Ensure touch buttons and keyboard trigger identical effects; do not play the landing sound twice.

**Gate:** FX tracks the real cells, no trail lingers or appears on blocked movement, 60 FPS target remains plausible on common phones, timing is aligned with existing audio.

### Stage 3 — Match and line elimination

**Status:** [ ] Not started

Visuals:
- Before removal, matched TetColor cells briefly charge/brighten (~80–140 ms visual cue) and a localized light sweep passes across the affected cells.
- On disappearance, a small bounded particle burst and quick fade convey a release of energy; gravity/cascades stay clearly readable.
- Classic: contiguous completed lines get a horizontal sweep rather than treating arbitrary matched TetColor coordinates as full rows.
- Distinguish one-by-one clearing from all-at-once clearing; no phantom cells or particles after the engine has advanced.

Implementation:
- Publish the exact affected coordinates when a match/line is detected, **before** the engine removes them. Preserve current `N-2` markers, removal order and game speed.
- Render cosmetics in an overlay so particles can outlive a removed cell briefly without forcing stale visual board values.
- Clear FX immediately on restart/switch and when the well dimensions change.

**Gate:** TetColor horizontal, vertical and diagonal triples, overlapping matches, subsequent cascades, single-block/batch modes and Classic multi-line clears all show correct effects **without affecting gameplay**.

### Stage 4 — Combo, cascade and bonus celebrations

**Status:** [ ] Not started

Visuals:
- Second consecutive successful TetColor piece: compact localized combo pop, with score/bonus feedback synchronized to the existing HUD.
- Third and later consecutive matches: progressively richer, **not longer or more obstructive** accents.
- Cascades: a distinct energy ripple that communicates a chain reaction rather than another unrelated combo.
- Brief well-frame energy glow and a small floating bonus number; reserve full-board emphasis for genuinely rare high-value events.
- No celebration for a zero bonus, a failed consecutive match, or a stale event from an earlier run.

Implementation:
- Use the existing authoritative `matchStreak`, `bonus`, `score` and cascade accounting. Keep combo and cascade FX semantically separate.
- Add typed FX descriptors for bonus origin/amount/streak; dedupe against repeated `bonus` and `score` snapshots.
- Coordinate visuals with `line2.mp3` and existing HUD animation, without interfering with accessibility/score announcements.

**Gate:** Consecutive clears, streak reset and cascades produce proportionate FX. Values displayed by the effect exactly match awarded points; no double-counting.

### Stage 5 — Art direction, performance, regression QA and release decision

**Status:** [ ] Not started

Tasks:
- Tune the visual hierarchy using the rule **quiet at rest / rewarding on events**. Ensure all six TetColor colors remain distinct, including contrast on the light-gray Arcade well.
- Verify touch behavior and maximum-fit geometry at 320×568, 375×667, 390×844, 428×926, 768×1024, short landscape and desktop 1366×768.
- Cover both Arcade and Prism themes, **FX Off by default and FX On by explicit opt-in**, both modes, Next preview, bonus HUD, pause/resume, game over, new game, responsive resize and legacy-mode return.
- Verify keyboard/touch parity, normal vs hard drop, match types, cascades, sound enabled/disabled, background-tab cancellation, app reduced motion, and OS reduced motion.
- Compare representative frame times/memory against Stage 0. **Target** smooth 60 FPS on a representative phone without visible input lag; if not attainable, lower effect density rather than compromise the game.
- Run complete `npm run test:unit`, `npm run lint`, `npm run build`, inspect production preview and verify PWA/static build compatibility.
- Document observed results, remaining limitations, commit IDs and explicit acceptance notes in this plan and the Draft PR.

**Gate:** All regression checks pass and visual results are approved. Only then mark PR ready for review; merge and deployment need separate explicit approval.

## 5. Suggested file ownership

| Concern | Expected files |
| --- | --- |
| Block materials / palette | `src/styles/game-cells.styl`, new focused FX styles |
| Active vs settled cells | `src/components/themes/tetcolor.vue` |
| Next preview | `src/components/NextPiece.vue` |
| Transient overlay | new small component under `src/components/` and optional `src/utils/` FX controller |
| Discrete events | existing `src/utils/game.js` via `src/utils/gameBus.js`, only as required |
| Match/line metadata | `src/game/tetcolor.js`, `src/game/tetris.js` only where indispensable, **no rule edits** |
| User preferences/motion | existing `src/utils/preferences.js`, `src/App.vue`, `arcade-shell.styl` — FX starts Off |
| Unit/UI contracts | focused tests under `tests/unit/` |

Do not add a new rendering engine, a heavy particle library, a new dependency for simple CSS FX, or a separate game-state owner without measured need.

## 6. Progress tracker

- [ ] 0. Baseline and FX contracts — preference toggle, persistence and mapping implemented; full QA pending
- [ ] 1. Glass material and active-piece lighting — code committed; full QA pending
- [ ] 2. Movement, drop trails and landing impact — code committed; full QA pending
- [ ] 3. Match/line clear and particles
- [ ] 4. Combo/cascade/bonus celebrations
- [ ] 5. Final polish, mobile/performance regression and acceptance

**Current checkpoint:** Stages 0–2 are implemented and committed, with unit contracts and dedicated QA handoffs. The Stage 2 helper's 3 isolated Node tests passed, but the **repository** test/lint/build, actual Vue/Stylus compilation, browser/mobile checks and performance baseline remain pending. See [Stage 0](./tetcolor-visual-fx-2077-stage0.md), [Stage 1](./tetcolor-visual-fx-2077-stage1.md) and [Stage 2](./tetcolor-visual-fx-2077-stage2.md) handoffs. Next: finish QA, then Stage 3 (match/line-clear FX). Keep PR Draft; no merge/deploy.
