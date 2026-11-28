# Continuous Level-Based Gravity — Visual Prototype

> Status: **IMPLEMENTED FOR MANUAL EVALUATION — DRAFT**
> Scope: modern TetColor / Classic, gravity only. Legacy unchanged.
> Related: PR #23 (10 ms Soft Drop), Visual FX 2077.

## Goal

Replace the visually discrete ordinary gravity (one cell per level-dependent
interval) with a smooth descent at **the same effective speed**. Do not
change simulation, collision, lock, input timing, clears or scoring.

This is NOT interpolation for Soft Drop or horizontal controls. Soft Drop
keeps the existing 10 ms setting; Hard Drop stays instant.

## Implementation

- `src/utils/game.js` exposes `game.visualGravityProgress(now)`. It reads
  the existing gravity counter and speed, yielding the normalized fraction
  of the *upcoming* cell interval. No game state is advanced for rendering.
- It returns zero during pause, bonus hold, pending lock scheduling, Soft
  Drop and blocked single-cell clears. Before returning a positive fraction,
  it performs a **read-only collision check against the next gravity row**
  using the same occupancy conditions as the engine's `set()` logic.
- `src/components/themes/tetcolor.vue` paints the active piece in a
  separate, non-interactive, clipped layer. The base grid keeps its layout
  and adjacency information but hides the active cells underneath the layer.
  The layer's blocks reuse the normal `game-cell` classes and theme colors.
- An independent presentation-only RAF applies **one**
  `translate3d(x, y, 0)` to the piece wrapper. Both X and Y are taken
  from authoritative Vuex piece coordinates; only ordinary gravity adds
  a fractional Y offset, derived from the engine's actual clock.
  No per-frame Vuex mutations, bus events or board cloning are introduced.
- Pause, reduced motion, hidden tabs and blocked downward motion snap to
  the integer position. Element measurements are refreshed on resize.
- Legacy `stakan.vue` is unchanged.

## Why predictive interpolation

An ordinary post-step CSS transition would animate the piece only **after**
a logical row change and could leave its display trailing the engine by
one row. This prototype instead visually traverses the next row during the
already-existing interval, arriving at its logical destination as the
engine performs the next discrete step.

## Manual preview / known trade-offs

- Experimental: visual prediction may snap to a logical row when the player
  moves horizontally over a new obstacle, during a collision, when a pause
  starts, or when a clear/bonus interrupts gravity. No predicted position is
  ever used for collision, locking, bonus or scoring.
- Normal gravity should look continuous at low levels and retain its
  level-based cadence. Soft Drop should feel as it does on master.
- Compare TetColor and Classic on desktop and phone, with Visual FX OFF
  and Reduced Motion OFF. Check pause/resume, walls, floor, turning,
  fast sideways input, fresh spawns, clears, level changes and Game Over.
- Check Reduced Motion ON (including the OS setting): no fractional
  movement should be rendered.
- The full regression/test/QA cycle has intentionally not been run;
  this branch is a temporary visual experiment, not a production release.

## Deployment

Deploy the exact PR branch commit, **without merging**, using the existing
versioned/rollback-capable deployment flow. A production build is necessary;
skip tests/lint as requested for this manual evaluation. Do not change
leaderboard backend, API or data. Restore the previous release if needed.
