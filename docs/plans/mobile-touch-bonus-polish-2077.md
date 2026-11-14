# Mobile touch polish and in-board bonus rewards — 2077

Branch: `feat/mobile-touch-bonus-polish-2077` (from `master` at `cbc5139`).

## Implemented

- **Touch feedback:** eliminated hard blue ring outlines and concentric ring pseudo-elements. A short feathered backdrop-filter lens follows a registered tap; a quieter, vertically stretched optical trail appears only when a downward swipe actually triggers Drop. Both respect the existing Touch warp toggle and Reduced motion.
- **Hints:** larger tap targets visually (SVG icons / borders / padding), with thick arrows modeled on the old touch controls. The four hints dismiss **independently** upon the corresponding successful action, including Drop after a real downward swipe. There is no three-action global expiry. Hints revive on each new run and unpause; Settings replay remains available.
- **Bonus presentation:** an always-mounted `BonusRewardOverlay.vue` subscribes to actual engine `fx:combo` / `fx:cascade` events. It presents large `COMBO ×2 / +150` or `CHAIN ×2 / +500` typography near the match centroid, floating upward and fading over 1,250ms. It is independent of the optional Visual FX material effects, and still shows the value without motion in Reduced motion mode. `VisualFxOverlay.vue` no longer renders duplicate small badges/rings.
- **Reward dwell:** when a **positive** TetColor combo/cascade is awarded, the engine waits for the entire match/cascade clear queue to finish, then briefly holds piece motion and input for `BONUS_HOLD_MS = 270` ms. Gravity time resumes without catching up, and active pointer/key state is cleared. A user pause extends the hold rather than allowing it to expire in the background. Regular clears with no bonus and Classic remain unchanged.

## Agent QA / handoff (not executed here)

1. **Update tests** in a separate agent pass, especially existing visual-fx and touch-gesture snapshot/source assertions. This branch intentionally contains **no test edits**.
2. Run `npm run test:unit`, `npm run lint`, and `npm run build`; fix issues only in this branch.
3. Browser QA: real Android Chrome and viewport simulation at 320, 375, 390, 428px plus landscape. Check bold left/right arrows, a readable rotate icon and large downward swipe icon, legible hints with enough room around the board.
4. Trigger left/right/rotate **without swiping**: only the three corresponding hints disappear and the Drop hint stays. Trigger a valid swipe: the Drop hint fades independently. Verify replay after a new run, pause/resume, and Settings.
5. Tap both sides and board; verify no blue rings, only the feathered lens at the point of contact. Swipe down; verify one Drop respecting the existing Hard drop option, a subtle downward trail, and no rotation/extra tap effect. Disable Touch warp and Reduced motion separately.
6. Earn a second consecutive TetColor match (combo) and trigger at least one cascade. Verify the **actual awarded** multiplier/amount displays prominently over the board even with Visual FX off; compare with Visual FX on to ensure no duplicate reward badge. Watch overlapping rewards and near-edge clears.
7. Inspect the 270ms post-clear hold: a rewarded clear yields a short rest before movement resumes; ordinary clears do **not** gain a delay. Test pause/resume **during** the hold, keyboard and touch input, no stuck key, restart during clear or hold, and both `singleBlock` modes.
8. Check game-over, HUD, Classic, desktop keyboard controls, and performance. Keep reward effects independent of the Vue game-cell reactivity loop.

Do not run GitHub Actions, merge, or deploy without explicit authorization. Return findings and PR readiness.

## Follow-up polish (2026-11-10)

- Restore **two faint concentric contours** (outer border and inner pseudo-ring) on both the tap lens and the swipe lens. They are much less luminous than the original blue outlines, with alpha around 0.16–0.22 before feathering. The swipe contour remains quieter and vertically stretched. Keep the existing Touch warp and Reduced motion behavior.
- Remove the redundant **Bonus HUD card entirely** from `GameHud.vue`, including its desktop variant. Score/Level/Blocks remain visible; the rewarded in-board overlay is now the only bonus display.
- Reduce reward opacity from 1 to ~0.76 at its peak, soften shadows and stroke, and offset the floating label **about two cell widths outward and 1.8 cells upward** relative to the actual cleared-cell centroid. Do **not** clamp the reward to the well; it may float beyond the border without clipping. Keep 1.25s rise-and-fade.
- **No change to clear speed:** `speed.three = 80` and `speed.clear = 80` ms remain untouched. The earlier `BONUS_HOLD_MS = 270` after a completed awarded group remains. Changing opacity or FX layering can make clears look faster, but no new speed change was made.
- Agent should revise old unit expectations for the Bonus HUD card and the former ring-free touch effect, and visually verify that the new rings are present but subtle, rewards do not obscure cleared blocks, and the 270ms hold does not alter per-cell clearing cadence.

## Follow-up UX iteration (2026-11-11 — supersedes earlier notes where inconsistent)

- **Swipe on any part of the mobile play surface** triggers the existing Drop/Hard Drop action according to the setting. A downward swipe beginning in the left/right zone cancels that held direction once Drop is recognized; it does not rotate. Tap/hold left or right still moves; tap on the board still rotates. Check rapid pointerup recognition and two-finger edge cases.
- **Touch hints:** four independent hints per eligible game, now limited to the **first three mobile games** (`showTouchHints = true`, `touchHintGamesSeen = 0..3`). Game count persists in `jstet.preferences.v1`. New Settings checkbox toggles hints; turning it on resets the three-game allowance; turning it off hides hints. Replay button still works while enabled. Pausing/resuming and desktop sessions never consume the allowance; check switching to mobile mid-session.
- **Next:** desktop card compact (`max-content`, at least 148px, capped to 100% parent), no minimum 158px height, cells capped at 30px, translucent glass background. Mobile remains board-sized but receives a more transparent glass background. Verify no overlapping well/HUD at wide and narrow viewports.
- **Bonus HUD:** restored transient Bonus card on the right, **no dash or empty card**. Positive engine bonus events show the value; zero clears it with 750ms exit fade. A new positive bonus restarts a 2.6s dwell, even if the number repeats. This does **not** replace the existing floating in-board reward; both now coexist. Check card transition, pause/restart and repeated bonuses.
- **270ms reward hold now freezes *only natural gravity*.** Inputs (left/right/rotate/manual down/Drop) and the rest of the simulation continue. Gravity uses its own interval ledger and pause offset to avoid a catch-up fall after the hold. User pause/resume preserves remaining hold duration; overlapping rewarded events preserve already elapsed gravity freeze. Test controls during the hold, both soft and hard Drop, singleBlock vs batch, combos/cascades, reset and pause. TetColor clear speed remains **80ms** per step. Other timers (level/clear) are not suspended.

**Agent scope remains:** validate/update tests and browser QA, no GitHub Actions, no merge and no deploy without explicit approval. No test files were changed in this iteration.

## Follow-up UX iteration (2026-11-12 — newest requirements)

- **Bonus HUD fade-out:** the pre-existing `bonus-reveal` CSS keyframes used `animation-fill-mode: both`, pinning the card's opacity to 1 and making Vue's leave transition appear instant. Override that animation for `.game-hud .hud-stat--bonus`, fade out over **1550ms** with a gentle lift. A new positive award still restarts the existing 2600ms display window. Reduced-motion users still get an immediate transition as requested by their OS.
- **Floating in-board reward:** peak opacity changed **0.76 → 0.57**, reduced glow, and shifted position **up 3.1 cells / outward 2.5 cells**. Rewards are still allowed to float outside the well; 1250ms animation remains.
- **Initial gesture hints:** significantly more transparent (`opacity: .60`, softened background/border/shadow); retain three-game-onboarding option. Hints do **not** replay after unpause (existing implementation, unchanged by this iteration).
- **Horizontal swipe:** swipe left/right across **any part of the play surface** moves the piece. The original side-zone taps continue to work, as do side-zone stationary holds after a 230ms deliberate hold threshold and tap-to-rotate inside the well. Both left/right hints now say **SWIPE** with their respective arrow.
- **No phantom horizontal movement on Drop:** formerly side-zone `pointerdown` dispatched `left:start` or `right:start` before knowing whether a downward swipe was intended. The new recognizer defers that command until the action is identified: a valid short tap on pointerup, an intentional stationary hold, or a horizontal swipe. On downward swipe the pointer is claimed by Drop and never triggers the side-zone tap/press. The same fast-swipe classification runs on pointerup, covering flicks with no intermediate move. A *later separate tap*, while the piece descends, still moves normally.
- **QA specifically required:** fast downward swipes beginning on both side rails (must Drop exactly once and move **zero** cells horizontally), fast horizontal swipes starting in the well (must move, not rotate), deliberately repeated taps during falling, long stationary left/right hold and repeat timing, diagonal/slow swipes, pointer cancel/blur/pause, no stale timers or stuck directions, invisible state when touch hints are switched off. Verify visual HUD fade after timeout and after a zero bonus event.
- **Execution constraints:** implementation only; no test authoring, test runs, GitHub Actions, merge, or deployment in this pass. Agent handles QA and tests.

## Drag control (2026-11-12 — replaces horizontal swipe/hold behavior above)

- **Side-zone tap:** one left/right step on pointerup, unchanged. **Board tap:** rotate, unchanged. **Downward swipe from any point:** Drop, still obeys Hard Drop setting.
- **Horizontal finger tracking (Drag):** immediately recognize intentional horizontal movement, anywhere on the mobile play panel. Measure actual game-cell width from the board DOM once on pointerdown; capture the live piece's starting X. Target column is `startingPieceX + sign(dx) * round(abs(dx) / cellWidth)`, not an absolute finger-to-column snap. No jump at first touch, no auto-repeat, and reversing finger direction returns the figure toward its starting column.
- Emit `drag:move` with the target column. The engine walks one cell at a time through the existing `update()/set()` collision path, stops at walls or locked pieces, and publishes the ordinary piece update/FX. Desktop physical-key behavior and optional mobile Buttons pad are unchanged.
- After initial horizontal drag, a deliberate downward movement from the last horizontal step can still trigger Drop; no side-zone tap or extra move is emitted for a fresh downward swipe.
- Removed the **230ms long-hold repeat** from the gesture surface (not from physical keyboard / Buttons controls); long stationary presses simply become one tap on release.
- On pause, blur, visibility change, cancellation, or unmount, clear pointer state and any input pending taps. Multi-touch can still tap/rotate while a single pointer owns Drag; the second pointer cannot override the drag owner.
- Left/right onboarding labels now say **DRAG**, not SWIPE. They continue to appear for the first three games according to the existing preference.

### Agent QA additions

1. Start Drag from **left rail**, **well**, and **right rail**. Move 1, 2, 3 cell widths and back, including reversing several times without releasing the pointer. Confirm no initial snap and no key-repeat-driven drift.
2. Press against wall/settled blocks, drag farther, then reverse; the piece must stay within legal cells and follow the return. Check that collision failure cannot freeze the drag's target tracking.
3. Drag while gravity is active and during the 270ms bonus gravity hold; vertical piece motion must remain independent of horizontal finger displacement.
4. Down-swipe from each zone must Drop **exactly once**, with no phantom lateral step. Test one fast flick with only pointerup, slow downward swipe, diagonal movement, and down-swipe after first dragging horizontally.
5. Tap left/right still gives one step, board tap rotates, long stationary side press **does not** auto-repeat, and a later separate tap during a fall still moves as usual.
6. Confirm desktop keyboard and optional Buttons mode are unaffected. Update existing gesture/source tests to match the new drag protocol. Do not run GitHub Actions or deploy without authorization.

**Implementation only in this turn:** no test files written or tests/builds run.

## Vertical gesture lock (2026-11-14)

**Problem:** During finger-tracked Drag, a downward Drop swipe could continue emitting `drag:move` commands until the full 36px Drop threshold was reached. Small sideways drift near the end of a swipe could move the piece one cell left or right immediately before dropping.

**Fix (in this Draft PR):**

- Add `isVerticalIntent()` in `src/utils/touchGestures.js`: a downward displacement of at least **12px**, predominant over horizontal displacement by the same 1.25 ratio used by the existing swipe recognizer, locks the gesture as vertical.
- In `MobileTouchSurface.vue`, all swipes use `dropAnchorX/Y`: the original touch point, or the **last committed horizontal Drag step**. Recognize the vertical lock **before** another horizontal drag can be dispatched. Once locked, the pointer does not issue `drag:move`, even if it drifts sideways afterward.
- Drop remains **immediate at 36px downward** from the saved anchor, with no timeout or artificial delay. After a vertical lock, horizontal drift is ignored when deciding whether to finish the Drop. A fast flick with only a `pointerup` still triggers exactly one Drop. Held Drag movement, reversals, side taps, well taps and keyboard/Button controls keep their previous behavior.
- The lock is per-pointer, is cleared by the normal pointerup/cancel/blur/pause/unmount lifecycle, and never changes gameplay timing or collision logic.
- Updated `tests/unit/touch-gestures.test.js` (12 test cases now): lock threshold/vertical dominance, fresh downward swipes, horizontal/tap independence, and drag→vertical lock→Drop drift scenario. **12/12 tests passed in an isolated JS harness executing the exact checked-in helper and test bodies with checked-in source strings.** The actual repository `npm run test:unit`, lint, build and browser QA were not run here because a Git checkout and dependencies are not available in this environment. The component's actual method also passed 11 additional direct behavior assertions in the isolated harness.

**Browser acceptance:** On Android Chrome, drag the piece left 1–3 columns, then move the finger downward slowly. After 12px of predominant downward movement the piece must **stop moving horizontally**; at 36px it must Drop from that same column, even with late sideways finger jitter. Repeat with drag to the right, fast downward flicks from both rails, pure horizontal drags, reverse drags, and short taps. Verify single Drop, no unintended rotation, and no new input latency. Run full unit tests, lint and build locally before merging.

**No GitHub Actions, merge or deployment** were performed.
