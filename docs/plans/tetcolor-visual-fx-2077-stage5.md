# JSTET — Visual FX 2077 / Stage 5 QA and hardening report

> Updated: 2026-11-07  
> Branch: `feat/tetcolor-visual-fx-2077`  
> PR: [#12](https://github.com/andykras/jstet/pull/12) — **Draft**, do not merge or deploy  
> Status: **Static/source review and Stage 5 hardening committed. Full-repository/browser/mobile QA still BLOCKED and is not accepted.**

## Scope and delivered fixes

Stage 5 is the integrated QA gate for all opt-in Visual FX 2077 stages. The actual full Vue/Vite/Stylus runtime and browser checks have **not** been performed yet; the source audit identified and fixed three important opt-in edge cases:

1. **Fair, bounded effects on multirow Classic clears:** Previously `VisualFxOverlay.add()` appended every cell, then repeatedly evicted the oldest element once the 24-element limit was exceeded. A 40-cell, 4-row clear therefore preferentially displayed only the last 24 cells. `src/utils/visualFx.js` now exports pure `sampleFxCells(cells, limit)` that selects up to 24 source cells evenly across the original sorted list, without changing the source array or the engine's `clearFxCells` snapshot. `src/components/VisualFxOverlay.vue` uses it only for cosmetic materialization. For a 4×10 Classic clear, all four rows remain represented; the cap stays 24. Combo/cascade bonus anchors are still calculated from **all** original matched cells, never the sampled subset.
2. **Stale clear-group metadata after switching FX Off:** The new `fx:reset` command in `src/utils/game.js` clears the presentation-only `clearFxCells` snapshot. `App.vue` emits it when settings are persisted with `visualFxEnabled: false`, while `setup()` installs/removes its handler with the engine lifecycle. This prevents turning FX back on midclear from playing delayed effects for a match detected when the old layer was active. The actual clearing algorithm, `$three`, `$lines`, score, bonus and sounds are untouched.
3. **Hard-drop cosmetic state while a sequential clear is pending:** The old engine already ignores piece updates while `game.singleBlock` is clearing a TetColor group or Classic lines. Stage 2 introduced `hardDropPending` to distinguish a hard-lock flash. Stage 5 now checks that same original clearing guard before emitting `fx:hard-drop` or setting `hardDropPending`; a drop during the blocked window no longer marks a subsequent legitimate gravity lock as a hard drop. Original `dropDown()` gameplay calculations, `set()` loop and `update()` call remain intact.

### Tests added

`tests/unit/visual-fx-qa.test.js` adds **9 Node test cases** for large clear sampling (40→24 and four-row coverage), unchanged small arrays, invalid limits, true-center bonus anchoring, original Classic colors, FX Off preference migration and CSS isolation, `fx:reset`/listener cleanup, hard-drop guard, and timed-effect caps. Existing Stage 0–4 test files remain on the branch.

## Actual verification performed in this session

- Inspected the current feature branch code (including TetColor, Classic, bonus formulas, App, component, CSS, audio and preference paths) and identified the three fixes above.
- Checked GitHub feature-branch modifications and relevant source-contract references.
- Reconstructed **the pure utility logic** from the reviewed source into an isolated Node 22 fixture at `/tmp/jstet-fx-stage5/`, alongside the existing Piece/Stakan behavior. Executed `node --check` and **14/14 isolated Node tests PASS** covering board mapping, color snapshots, sampling, Classic 4-line coverage, live-piece detection and reward anchoring. This does **not** prove that the full repository unit suite or browser passes.
- Confirmed this execution container cannot resolve `github.com` (`curl: (6) Could not resolve host`), and lacks a mounted JSTET checkout, node_modules, Vue, Vite, Stylus, ESLint and a usable browser runtime. Consequently `npm run test:unit`, `npm run lint`, `npm run build` and real Playwright/phone QA **were not executed**. Do not report these as passed.
- No CI/Actions, merge, production deployment or server changes.

## Required Mac/Opencode validation before marking Stage 5 complete

Use the latest `feat/tetcolor-visual-fx-2077` branch and follow `AGENTS.md`. Work only on this PR; no GitHub Actions or deployment. First run:

```sh
git fetch origin
git switch feat/tetcolor-visual-fx-2077
git pull --ff-only
node --version
npm --version
npm install
npm run test:unit
npm run lint
npm run build
npm run dev
```

Record the actual command outputs, complete pass/failure counts and any changes. Use the dev server/preview for the checks below, and run `npm run preview` after the production build to validate the PWA/relative paths.

### Browser acceptance matrix

Check TetColor and Classic in Arcade and Prism with FX **Off (default)** and **On**, at: **320×568, 375×667, 390×844, 428×926, 768×1024, 1366×768**, plus short landscape. Baseline comparisons must be against the current `master`, not an assumed design.

1. **No FX and persistence:** clean profile -> Visual effects unchecked, unchanged block colors/borders and the original light-gray TetColor well; no FX-layer DOM, no transient animation and no change to Next preview or mobile layout. Migrated v1 saved preferences retain theme/audio/reduced-motion, defaulting only the new FX key to Off. FX On persists after reload; turning it Off immediately restores the original visual baseline without restarting or altering the live score.
2. **Geometry:** no shift in actual board size or row/column count; TetColor 7×18 and Classic 10×20; Next preview does not shrink or clip; no HUD/right-rail or controls overlap at 320px width. Verify the absolute FX-layer top-left alignment with the first/last colored cells, including 3px well frame.
3. **Glass:** all original six TetColor colors remain readable and distinguishable, Prism palette works; active falling piece pulses **only while running**; settled pieces never pulse; Next uses static material and preserves crop. Pause/game-over and both reduced-motion settings prevent the active pulse.
4. **Movement/impact:** keyboard/touch left, right, rotate, down, held-key repeat, gravity fall and hard drop. Only **successful** manual actions emit motion trails. Blocked wall/rotation, gravity and zero-distance drop cannot emit phantom trails. Hard drop streak follows the actual trajectory and ends at the settled piece; regular lock gives a smaller impact, hard lock a stronger one.
5. **Matching:** TetColor horizontal/vertical/diagonal/overlapping triples, sequential and batch clear options, new gravity cascades. Charge/sweep and debris must use only the actual matched cells and retain pre-`-2` original colors. Classic clears 1, 2, 3 and **4 rows at once**; all rows should be represented under the 24-element cap, with a left-to-right glint.
6. **Rewards:** first successful match has no combo pop; second/third consecutive **pieces** that match show correct `COMBO ×2`/`×3` and awarded amount, not total score. Breaking the streak produces no celebration. Actual gravity cascades show separate blue `CASCADE ×depth` ripple, the exact award, and a brief cyan frame pulse. Zero bonuses must not animate. No new sounds or duplicate `bonus`/`score` events.
7. **Cleanup:** pause/restart mid-effect, game over, switch modes, Legacy round trip, toggle FX Off/On midclear and midbonus, change theme, resize/rotate device, blur/focus and background tab. No stale trail, duplicated award, timer leak, stuck hard-lock glow or leaking event listener. Exercise app reduced motion **and** `prefers-reduced-motion` independently.
8. **Performance:** compare representative 30–60s gameplay sessions with FX Off and FX On in mobile Chrome and desktop browser. Target ~60 FPS/16.7ms frame budget with no meaningful key/touch latency regression. Check frame drops during multirow clears and cascade bursts, DOM node count (at most **24 FX cells + 2 active celebrations × 3 DOM nodes**), and heap/timer stability across 10+ restart/FX toggle cycles.
9. **Packaging and accessibility:** dev and production preview; check PWA reload/offline behavior and relative asset paths. Verify mouse/touch controls are clickable through the FX overlay, settings keyboard navigation, and that decorative reward text is `aria-hidden` to avoid duplicate screen-reader announcements.

Capture screenshots for FX Off vs On on **390×844 and 1366×768**, including an active clear/bonus, and record notes on visual quality, FPS and all failures. Fix any real issues on this branch, repeat tests and update the stage report with evidence.

## Acceptance criteria / remaining blockers

- [x] Stage 5 source audit and code hardening.
- [x] 14 isolated utility checks pass on Node 22; actual repository tests remain unexecuted.
- [ ] Complete `npm run test:unit`, `npm run lint`, `npm run build` from the repository.
- [ ] Desktop/mobile visual QA matrix against `master`.
- [ ] Browser/PWA smoke test and ~60 FPS/performance comparison.
- [ ] All discovered regressions fixed and evidence recorded.
- [ ] User reviews and explicitly approves PR merge/deployment.

**Current conclusion:** Stage 5 is **in progress**, not yet accepted. PR #12 must remain **OPEN + Draft** until the actual repository and browser gates are completed.
