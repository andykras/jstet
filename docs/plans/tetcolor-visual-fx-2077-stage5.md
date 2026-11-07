# JSTET — Visual FX 2077 / Stage 5 QA and hardening report

> Updated: 2026-11-07  
> Branch: `feat/tetcolor-visual-fx-2077`, HEAD `2392c8c`  
> PR: [#12](https://github.com/andykras/jstet/pull/12) — **Draft**  
> Status: **Repository checks, browser QA matrix, reduced motion and performance complete. Physical-device testing not performed (no phone available). Merge still needs explicit approval.**

## Repository checks (executed, latest run)

- `npm run test:unit` — **126/126 pass** (one obsolete assertion updated, new regression tests for every fix below).
- `npm run lint` — exit 0.
- `npm run build` — exit 0; PWA precache **23 entries, 1108.96 KiB**, `dist/service-worker.js` generated.

## Bugs found and fixed during Stage 5 QA

| Commit | Severity | Bug | Fix |
| --- | --- | --- | --- |
| `12be06e` | **Critical** | `hasFxConsumer` checked `bus.all.get(type)?.size`, but mitt stores handler stacks in **arrays**, so `.size` was `undefined` and every engine FX emission (`fx:move`, `fx:hard-drop`, `fx:lock`, `fx:clear-*`, `fx:combo`, `fx:cascade`) was silently skipped. With FX On the overlay stayed empty forever. | Test consumer presence by array `.length`; regression test locks the array semantics. |
| `437087a` | High | Two clear-FX adapter gaps: (1) TetColor matches reaching the top visible row were invisible — the detector cannot mark row `height-1` as `-2` while the removal compaction deletes it; (2) a batch-mode lock during a pending clear **replaced** the global snapshot, erasing the first group's charge/release effects. | Membership now derives from the detected group itself (`Set.has(x*h+y)` / row list); pending snapshots accumulate via pure `mergeClearFxCells` until the lifecycle resets; `fx:clear-start` fires once per lifecycle. |
| `2392c8c` | Medium | OS-level `prefers-reduced-motion: reduce` hid the FX layer but kept the permanent `fx-glass-breathe` animation on the active piece: the media override used a 4-class selector and lost the specificity race against the `.is-running` animation rule. | Override selector matches the animation rule's specificity and wins by order. |
| `f259bf4` | Test | Obsolete hard-drop FX assertion did not match the intentional `!clearing` guard. | Assertion updated, guard semantics kept. |
| `8476f35` | Feature (user request) | Returning to an inactive window resumed gravity with accumulated speed ("+100 to speed"). | Window blur / hidden tab auto-pauses the run; focus/visibility restores it; only the automatic pause is reversible by focus — manual pause, fresh run and game over keep their state. Verified in browser for 7 scenarios. |

## Browser QA (headless Chrome 157 via CDP, dev :1337 and production preview :4173)

- **FX Off (default) parity:** no `.tetcolor-fx-layer` DOM, no `.fx-enabled` class, original colors (`empty = rgb(170,170,170)`, palette N1–N6 unchanged), no `.fx-active` cells, identical geometry. Toggling FX On→Off mid-run does not reset the game (score/settled/status preserved).
- **FX On behavior:** movement trails after accepted moves only, hard-drop streak + lock flash, charge/step on clears, `COMBO ×n` celebration rendered in the live 760 ms window, active piece `fx-active` pulse, Next preview static, effects strictly inside the board rectangle and exactly aligned to the cell grid (0 px deviation from the nearest cell), event order `fx:lock → fx:clear-start → fx:clear-step → fx:combo` correct.
- **Gameplay parity:** Classic single-line clear `score = lines × 100 × (level+1)` verified live; TetColor organic triple match and two consecutive matches awarding combo verified live; no duplicated `sound:drop`.
- **Lifecycle:** pause mid-effect, restart (KeyN), game over, mode switching, Legacy round trip (Lab stays FX-clean, return restores the layer), hidden tab and blur clear timed effects; preferences survive restarts.
- **Reduced motion:** OS emulation and the app checkbox independently hide the layer and stop the breathe animation (after `2392c8c`).
- **Themes:** Arcade and Prism under FX Off/On; Prism palette tokens flow through `--cell-N` untouched; screenshots captured for both.
- **Responsive matrix:** 320×568, 375×667, 390×844, 428×926, 768×1024, 1366×768, 844×390 landscape × dev + production preview × FX Off/On. Cells square and uniform everywhere, no horizontal/vertical overflow, no HUD overlaps, board/preview/controls inside the viewport, FX layer matches the cell grid exactly, touch targets ≥ 44 px. Short-landscape buttons measure 42 px — pre-existing `arcade-mobile.styl` styling (PR #11 territory), untouched by this branch. Screenshots for 390×844 and 1366×768 in both FX states.
- Screenshots stored in `qa-local/` session output (`/tmp/jstet-qa6/shots/`, `docs/plans/baseline/screenshots/qa12-*.png` regenerated on demand).

## Performance (measured, not estimated)

Headless Chrome 157; the rig ran both with GPU compositing and with forced software rendering:

| Scenario | FX Off | FX On |
| --- | --- | --- |
| FPS (GPU, representative play: moves + hard drops) | 60.1 | **60.1** |
| Frame p95 / max (GPU) | 17.8 / 19.8 ms | 18.1 / 19.0 ms |
| Frames > 20 ms (GPU, 6 s) | 0 | 0 |
| FPS during one-line clear burst (GPU) | 60.2 | 60.1 |
| FPS (software renderer, no GPU — rig artifact) | 60.1 | 44.3, p95 58 ms |

- Input latency keydown → store update: **0.2–23 ms** in both FX states, no regression.
- Memory: heap 3.2–5.5 MB across 5 restarts and 4 FX toggles (drift 2.3 MB, GC noise); FX elements bounded by `MAX_EFFECTS = 24`, drain to 0 after settle; no timer/DOM leak observed.
- **Physical-device testing was not performed** — the ~60 FPS target is verified on the desktop GPU path and emulated mobile viewports only.

## Deployment note

The user explicitly requested and approved deploying this branch to production during QA (releases `20261107-123418-437087a`, `20261107-124150-8476f35`, `20261107-124603-2392c8c`); production currently serves this branch. The PR remains a Draft and merge still requires separate approval.

## Acceptance criteria

- [x] `npm run test:unit`, `npm run lint`, `npm run build` — pass.
- [x] Desktop browser visual QA matrix, both themes, FX Off/On, lifecycle cleanup.
- [x] Emulated mobile/responsive matrix, dev + production preview.
- [x] Performance comparison FX Off/On (desktop GPU path ~60 FPS).
- [x] All discovered regressions fixed (`12be06e`, `437087a`, `2392c8c`).
- [ ] Physical-device (real phone) gameplay and FPS check.
- [ ] User review and explicit merge approval.

**Conclusion:** Stage 5 QA is complete for this environment. Remaining known gap: real-device verification. PR #12 stays **OPEN + Draft**; merge needs explicit approval.
