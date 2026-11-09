# Mobile touch surface — Arcade 2077

## Scope

This branch replaces the **default mobile** button pad with invisible gesture zones, while retaining the old button pad as a fallback in Settings. Desktop controls and game rules are unchanged.

## Behavior

- Tap or hold **left of the rendered well**: move left. Hold uses the existing keyboard-equivalent repeat timing.
- Tap or hold **right of the well**: move right.
- **Tap the well**: rotate once on release.
- **Swipe down starting on the well**: Drop once (recognized at 36px / predominantly vertical, including a fast pointerup).
- Drop emits `gameBus.emit('drop', hard)`. The existing **Hard drop** setting determines soft vs. hard behavior; the gesture does not implement a second drop rule.
- A swipe does not rotate the piece. Pointer cancellation / pause / blur / visibility loss releases held directions.

The invisible touch surface covers the full mobile board panel. The board boundaries are read from `.tetcolor-board.getBoundingClientRect()`, not hardcoded columns or screen percentages, so Classic and TetColor get the same interaction model.

## Touch onboarding

Hints on the initial mobile touch session: `← MOVE`, `MOVE →`, `↻ TAP`, `↓ SWIPE · DROP`. Each action dismisses its own hint; after three successful touch actions, any remaining hints fade out. Completion is recorded under `jstet.touchHints.v1` in localStorage, independently of the existing preferences schema. Settings includes **Show touch hints again** to replay.

## Touch warp

Each accepted touch produces a short-lived, radial, refracting lens at the actual touch location. The overlay lasts 320ms and is removed after its animation. Touch warp is **on by default**, separately from gameplay Visual FX; Settings has **Touch warp effect** to disable it. Reduced motion also suppresses warp. The effect lives in a separate component and does not mutate well cells or the game loop.

## Settings and compatibility

- `touchControlsMode`: `gestures` (default) or `buttons` (existing pad).
- `touchFxEnabled`: `true` (default).
- Existing saved preferences load with new defaults and retain existing values.
- Gesture mode removes the button-pad grid row, making the well taller on phones.
- Button mode retains the existing mobile pad and layout.
- The old pad remains mounted for desktop use; it is hidden in gesture mode only within the mobile media query.
- No new dependencies.

## Agent handoff — validation and deployment (not run in this branch)

1. Add/update unit coverage for zone selection, tap vs. swipe recognition, quick flick on pointerup, cancellation and held-direction release, duplicate pointers, hint state, preference fallback and persistence, and soft/hard drop dispatch. Existing `mobile-arcade.test.js` and `mobile-maxfit.test.js` contain **button-layout expectations** that should be revised to cover both modes.
2. Run `npm run test:unit`, `npm run lint`, and `npm run build` locally. Do not launch GitHub Actions.
3. Browser QA on narrow portrait (320/375/390/428px), landscape, and 768px: verify both TetColor/Classic, relative zone boundaries, holding directions, single rotate on tap, exactly one Drop on downward swipe, soft vs. hard setting, pause/resume, Settings, game over, no page scroll or stuck pointer after losing focus.
4. Confirm hints fade contextually and remain dismissed across refresh; **Show touch hints again** resets them. Toggle Touch warp / Reduced motion and check the overlay disappears promptly and creates no visible gameplay slowdown.
5. Compare **Buttons** fallback and desktop keyboard/gamepad behavior to the prior build. Check the extra reclaimed vertical space and that HUD cards remain readable.
6. Only after validation and explicit merge/deploy authorization: merge the PR, build and deploy through the existing kraspeed workflow, and verify the PWA/service worker release at `tetcolor.andykras.org`.

**Status:** implementation committed; tests, browser QA, merge, Actions, and deployment deliberately not performed here.
