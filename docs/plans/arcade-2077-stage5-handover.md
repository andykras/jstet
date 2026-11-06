# Arcade 2077 — Stage 5: Mobile Controls and Developer Lab

> Status: **IMPLEMENTED; MAC/TOUCH QA REQUIRED**  
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
| Full test suite | **NOT RUN here** (expect 46 tests: 33 pre-color + 2 color + 11 Stage 5) |
| ESLint / production build / mobile browser touch / PWA | **NOT RUN here** |
| Stage 4 post-color browser verification | **NOT RUN here** — must be performed in this same QA |

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

- [ ] On Chrome device emulation **with touch enabled** at 390×844, complete a TetColor run without physical keyboard: rotate/move/hold/down/drop/pause/resume/restart, clear colors and reach game over or make substantial score.
- [ ] Repeat in Classic with real line clear, 10×20 field, previews and counters. Confirm Drop correctly respects Soft/Hard setting.
- [ ] Rapid taps, 400+ms holds, two-finger directional presses, leaving a button with capture, `pointercancel`, `lostpointercapture`, blur, tab hidden and unmount: no stuck movement or gameBus listener leaks.
- [ ] Open Settings while touch input is held, change modes, pause and restart: no post-pause movement and no orphan timers.
- [ ] Keyboard Enter/Space on a focused touch button triggers only the intended action, without double drops. Regular physical keyboard shortcuts still work elsewhere.
- [ ] On 320×700 and 375×812: touch controls remain reachable while playing, never obscure/clip the visible well or cause horizontal scroll; page scroll outside buttons remains usable.
- [ ] On 768px tablet and 844×390 short landscape: board and control pad both reachable, no overlap or horizontal overflow; long pages scroll, touch-action on buttons prevents unintended gesture scrolling.
- [ ] On 1440×900: mobile controls are hidden and normal keyboard shortcuts work; no invisible focusable mobile buttons.

### Lab and accessibility

- [ ] Open Developer lab: the modern RAF is stopped and exactly one legacy engine owns input. Four named skin choices work immediately; number keys 1–4 still switch skins.
- [ ] Animate line clears and Soft drop toggles react immediately, and A/S legacy keyboard shortcuts remain functional. New Game resets board/counters while playing and after pause.
- [ ] Interacting with Lab select, checkbox or New Game using Space/Enter does not simultaneously move/drop the legacy piece.
- [ ] Lab → modern ten times: one engine loop, no orphaned timers, duplicate bus listeners or Console/Vue errors.
- [ ] Check focus-visible rings, button labels, disabled state, tab order and Escape/return with Settings/mode dialogs; no missing labels.

### Stage 4 color-pass regression (mandatory)

- [ ] On Arcade + TetColor, inspect computed CSS on **actual empty and occupied cells**: background `rgb(170,170,170)` for empty, six unchanged historic filled colors, flat `rgb(32,31,32)` border, original blue clear marker.
- [ ] Confirm Classic in Arcade and TetColor in Prism **do not** inherit the flat gray well; next-piece preview still uses its existing treatment.
- [ ] Compare empty/populated desktop screenshots to the approved modern-cabinet/original-color direction; capture and annotate refreshed 1440×900 and 390×844 images.
- [ ] Verify PWA manifest/icons/relative paths/SW-controlled offline reload in both modes, and make measured performance observations during active play.

## 4. Gate 5

Keep Gate 4 post-color verification and Gate 5 **OPEN** until the above evidence is recorded in this document, with any discovered product fixes committed to the same branch. When accepted, mark Stage 4 and Stage 5 complete in the roadmap and proceed to **Stage 6 — final integration QA and merge readiness**. Keep PR #7 Draft until Stage 6 and user approval.
