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
