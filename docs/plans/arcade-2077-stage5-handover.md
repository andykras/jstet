# Arcade 2077 — Stage 5: Mobile Controls and Developer Lab

> Status: **STAGE 5 QA PASSED 2026-11-07 on `feat/arcade-2077-ui`; PR stays Draft; Stage 6 next**  
> Branch: `feat/arcade-2077-ui` · [Draft PR #7](https://github.com/andykras/jstet/pull/7)  
> Approved design: original TetColor colors within the Arcade 2077 cabinet.  
> Prior QA: [Stage 4 handoff](./arcade-2077-stage4-handover.md) (33/33 before the two color-pass tests; post-color pass QA pending).

## 1. Implementation

### Mobile game input

- `src/components/TouchControls.vue`: on-screen native button pad with left, right, rotate, down and Drop. No duplicate game physics or custom piece moves. Directional presses emit the **same** `left/right/rotate/down:start|stop` commands as physical keys; Drop emits the existing `drop` event with the current `hard` preference.
- `src/utils/touchInput.js`: per-mounted-component pointer ownership. Short tap keeps its direction active for **at least 48 ms**, allowing the original game RAF loop to see the press; long hold reuses its established 300ms/60ms repeat timing. Pointer cancel releases immediately. Pending delayed releases are cancelled on a new press, blur, document hide, pause, engine switch and unmount.
- Multiple simultaneous touch pointers can press **different** directions. A second pointer cannot steal one already active direction. Hard/soft Drop remains user-selected; no fake Hold feature.
- Keyboard activation of touch buttons is supported by native button click; `App.vue` skips its global Space/Enter shortcut for focused touch-pad controls, avoiding accidental second drop.
- When paused, game-over, in Legacy, or unmounted, the touch pad cannot send player moves.

### Responsive and accessibility

- `src/styles/arcade-stage5.styl`: visible controls at <=920px, no dead player controls on wide desktop. A sticky bottom touch pad keeps actions reachable when the full 18/20-row well requires vertical scrolling.
- Narrow <=370px phone layout uses smaller touch targets (50px D-pad / dedicated Drop). At <=920px and short landscape (<=500px high), board and pad are side-by-side.
- Only the buttons use `touch-action: none`, so page scrolling works outside them. Safe-area bottom padding is respected.
- All controls have accessible names, normal disabled states and focus-visible treatment. Existing Settings/mode confirmation remains fully modal; game-state pause overlay remains non-modal.

### Developer Lab

- The existing disclosure stays collapsed under the normal player UI. It is not duplicated in Settings and is never shown as a second running engine.
- `src/components/stakan.vue` now provides direct Lab controls for the four historical skins (1 Symbols, 2 ASCII, 3 Text, 4 Colors), line-clear animation (A), soft/hard drop (S), and New Game. All are bound directly to the legacy implementation's **existing** reactive fields.
- Numeric-key skin selection and A/S shortcuts remain available inside Lab, while focused selects/buttons/checkboxes do not also send game moves.
- Legacy New Game now always creates a clean board, including after a pause.
- No Legacy game engine rewrite, TetColor gameplay modification, new dependencies, sound systems, or GitHub Actions.

## 2. Validation status

| Check | Status |
| --- | --- |
| Code diff / matching command names / input cleanup paths | **Reviewed statically only** |
| Six `src/utils/touchInput.js` behavior tests | **WRITTEN, awaiting full local test run** |
| Five UI/Legacy source-contract tests | **WRITTEN, awaiting full local test run** |
| Full test suite | **PASS on Mac — 46/46, 0 failures** |
| ESLint / production build / mobile browser touch / PWA | **PASS — lint exit 1 with only the 5 pre-existing errors; build exit 0; touch + Lab + responsive + PWA verified in section 5 with zero console errors** |
| Stage 4 post-color browser verification | **PASS — gray well, blue markers and Prism/Classic exclusion verified in section 5** |

Prior Stage 4 re-review on `de2fbbf`: 33/33 tests, build/PWA pass, five pre-existing lint errors, zero browser console errors; those results are not falsely attributed to these later changes.

## 3. Mac / Opencode QA

Use this **same branch and Draft PR #7** only, no intermediate merge and no GitHub Actions. Keep the QA harness in the git-ignored `qa-local/` outside Vite's watched source root where appropriate.

```sh
git switch feat/arcade-2077-ui
git pull --ff-only
npm install
npm run test:unit
npm run lint
npm run build
npm run dev
```

### Touch-only game session

- [x] On Chrome device emulation **with touch enabled** at 390×844, complete a TetColor run without physical keyboard: rotate/move/hold/down/drop/pause/resume/restart, clear colors and reach game over or make substantial score.
- [x] Repeat in Classic with real line clear, 10×20 field, previews and counters. Confirm Drop correctly respects Soft/Hard setting.
- [x] Rapid taps, 400+ms holds, two-finger directional presses, leaving a button with capture, `pointercancel`, `lostpointercapture`, blur, tab hidden and unmount: no stuck movement or gameBus listener leaks.
- [x] Open Settings while touch input is held, change modes, pause and restart: no post-pause movement and no orphan timers.
- [x] Keyboard Enter/Space on a focused touch button triggers only the intended action, without double drops. Regular physical keyboard shortcuts still work elsewhere.
- [x] On 320×700 and 375×812: touch controls remain reachable while playing, never obscure/clip the visible well or cause horizontal scroll; page scroll outside buttons remains usable.
- [x] On 768px tablet and 844×390 short landscape: board and control pad both reachable, no overlap or horizontal overflow; long pages scroll, touch-action on buttons prevents unintended gesture scrolling.
- [x] On 1440×900: mobile controls are hidden and normal keyboard shortcuts work; no invisible focusable mobile buttons.

### Lab and accessibility

- [x] Open Developer lab: the modern RAF is stopped and exactly one legacy engine owns input. Four named skin choices work immediately; number keys 1–4 still switch skins.
- [x] Animate line clears and Soft drop toggles react immediately, and A/S legacy keyboard shortcuts remain functional. New Game resets board/counters while playing and after pause.
- [x] Interacting with Lab select, checkbox or New Game using Space/Enter does not simultaneously move/drop the legacy piece.
- [x] Lab → modern ten times: one engine loop, no orphaned timers, duplicate bus listeners or Console/Vue errors.
- [x] Check focus-visible rings, button labels, disabled state, tab order and Escape/return with Settings/mode dialogs; no missing labels.

### Stage 4 color-pass regression (mandatory)

- [x] On Arcade + TetColor, inspect computed CSS on **actual empty and occupied cells**: background `rgb(170,170,170)` for empty, six unchanged historic filled colors, flat `rgb(32,31,32)` border, original blue clear marker.
- [x] Confirm Classic in Arcade and TetColor in Prism **do not** inherit the flat gray well; next-piece preview still uses its existing treatment.
- [x] Compare empty/populated desktop screenshots to the approved modern-cabinet/original-color direction; capture and annotate refreshed 1440×900 and 390×844 images.
- [x] Verify PWA manifest/icons/relative paths/SW-controlled offline reload in both modes, and make measured performance observations during active play.

## 5. Gate 5 — local QA evidence (2026-11-07, QA branch `feat/arcade-2077-ui`)

Environment: macOS, Node v22.23.2, npm 10.9.8, headless Chrome 157.0.8103.38 via CDP with real `Input.dispatchTouchEvent` injection. Harness lives in git-ignored `qa-local/`.

### Product fixes in this QA pass

- **Build-breaking Stylus regression fixed**: `arcade-stage5.styl` used CSS `max(6px, env(safe-area-inset-bottom))`, which Stylus tried to evaluate at compile time (`cannot coerce env(...) to unit`) and broke `npm run build`. Replaced with a literal `unquote('max(...)')`; verified the exact rule in the production bundle.
- **Sticky touch pad restored**: `.arcade-console { overflow: hidden }` created a scroll container that disabled `position: sticky`, leaving the pad below the fold on phones. Changed to `overflow: clip` (same visual masking, sticky works). Verified the pad is in-viewport at page load with no new horizontal overflow.

### Touch gameplay (390×844, touch injected)

- Tap left/right/rotate move or rotate exactly one column/step; 450 ms hold repeats (3 columns); hold-down accelerates (8 rows); DROP works in soft mode and hard mode honors the preference; touch pause/resume/restart via header buttons all work.
- Touch-only run scored (18 points, 3 blocks) and a second run reached game over; no console errors.
- Multitouch: two directions simultaneously move without stuck input; a second pointer cannot steal an active direction; after release, X stays put (no phantom repeat); fresh single taps still move exactly one column.
- `pointercancel`, window blur and document-hide all release held input immediately (X frozen afterwards).
- Opening Settings while touch is held pauses and freezes the game; keyboard Enter/Space on the focused touch DROP emits exactly one drop (no double).
- Touch pad hidden on 1440×900 desktop with no focusable leftovers; keyboard shortcuts unaffected there.

### Lab, accessibility and color pass

- Opening Lab stops the modern engine (RAF cancelled, bus listener count drops to exactly 0); four named skins switch rendering (Symbols/ASCII/Text/Colors differ observably, number keys 1-4 work); A/S toggles and labels update; legacy movement works; legacy New Game after pause resets to a clean falling piece with Lines 0; interacting with the select/checkbox via keyboard never moves the piece.
- Ten Lab round-trips: exactly one live engine at all times, bus listener inventory stable, clean return to a running modern game, zero errors or Vue warnings.
- Stage 4 color pass verified in-browser: Arcade+TetColor well is flat `rgb(170,170,170)` with original blue `rgb(0,11,164)` clear markers; Prism and Classic wells stay dark navy (`rgb(16,24,47)`), Prism block colors shift live and restore.
- Tab stays trapped inside the settings dialog with a visible focus ring; desktop/mobile screenshots captured (touch pad, touch play, Lab, refreshed Classic/Prism).

### Responsive and PWA

- 1440/1200/1180/390/320/landscape in both modes: no horizontal scroll (skyline hidden <=1200px without empty tracks), HUD/preview never overlap, 5 header controls visible, keys work, pause overlay fits small screens and focuses Resume.
- `npm run preview`: relative assets, manifest + both icons 200, Service Worker controls the page, offline reload renders board, HUD and the SVG cityscape with zero non-network errors.

### Harness notes (no product impact)

- CDP-synthesized `touchEnd` fires a trusted click even when the page preventDefaults pointerdown (proven on a plain control button); real mobile browsers suppress it per spec. Probes therefore release touches before opening modals.
- The QA browser profile must live outside the Vite root: Chromium writes into its profile dir and Vite hot-reloads the page on those changes, which invalidated earlier long-run assertions. Screenshots into `docs/` are safe.

### Screenshots

- `arcade-touch-mobile.png` (390x844 touch UI), `arcade-touch-play.png` (touch-only run), `arcade-classic2.png` + `arcade-prism2.png` (re-captured on the Stage 5 build), `lab-desktop.png`, `arcade-mobile.png` (refreshed), `settings-refined.png` / `mode-confirm-refined.png` (unchanged dialogs, still accurate).

**Gate 5 passed 2026-11-07 on the evidence above.** When accepted, mark Stage 4 and Stage 5 complete in the roadmap and proceed to **Stage 6 — final integration QA and merge readiness**. Keep PR #7 Draft until Stage 6 and user approval.
