# Arcade 2077 — Stage 0 Baseline and QA Record

> Status: **PARTIAL — local runtime and browser verification outstanding**  
> Source snapshot: `master` at `fdb08065e34324b8bb5f0f2cb98f475f282baf8c` (2026-11-06)  
> Work branch: `feat/arcade-2077-ui`  
> Scope: document current behavior **before** changing the game shell, settings, or engine contracts.  
> Reference design: [Arcade Console](./arcade-2077-ui-reference.avif)  
> Roadmap: [Stage 0](./arcade-2077-ui-roadmap.md#stage-0--baseline-and-acceptance-harness)

## 1. What has actually been verified

| Check | Status | Evidence / limitations |
| --- | --- | --- |
| Repository structure and current sources | **PASS — static** | GitHub sources examined at the snapshot above |
| Existing test commands identified | **PASS — static** | `package.json`: `test:unit`, `lint`, `build`, `dev`, `preview` |
| Input event repeat contracts | **PASS — isolated** | Three `node:test` checks against a local copy of the unchanged `src/utils/events.js`: 3/3 passed |
| Full checkout `npm install` | **NOT RUN** | Container cannot resolve `github.com` or `registry.npmjs.org` |
| Repository `npm run test:unit` | **NOT RUN** | Full repository checkout and dependencies unavailable in local execution container |
| Repository `npm run lint` | **NOT RUN** | Same environment blocker |
| Repository `npm run build` | **NOT RUN** | Same environment blocker |
| Vite dev and production preview | **NOT RUN** | Same environment blocker |
| Modern/naive desktop gameplay | **NOT RUN** | No runnable application available in this environment |
| Mobile viewport and touch/keyboard behavior | **NOT RUN** | No runnable application available in this environment |
| PWA/offline behavior | **NOT RUN** | Requires a built preview in a browser |

**Do not interpret static inspection or the isolated timing tests as a successful full build or playable browser session.** This file is intentionally the handoff record for the Mac/kraspeed QA pass.

## 2. Existing runtime contract (source-confirmed)

### Main TetColor mode

- Entry: `src/App.vue` creates `Stakan(19, 9, 4)` and four TetColor piece types, connects `mitt` events, and starts `src/utils/game.js`.
- Board: 19 visible well rows plus 4 hidden rows; 9 columns including side walls. `0` = empty, `-1` = wall, `-2` = clearing marker.
- Rendering: `src/components/themes/tetcolor.vue` uses Vuex getters; score, level, cleared blocks, bonus and next-piece preview appear in the existing view.
- Match-3: `src/game/tetcolor.js` detects triples along horizontal, vertical and both diagonal axes, marks blocks, removes them by column and can trigger follow-up cascades.
- Standard line-clearing functions exist in `src/game/tetris.js`, but the Classic mode and its tetromino set are **not exposed as an actual selectable product mode** today.
- Gravity/level timing is driven by `requestAnimationFrame` and `performance.now()`. Input-repeat logic has independent timing.
- `Object.freeze` in Vuex is **shallow and intentional**; nested well cells remain mutable. It must not be removed as UI cleanup.

### Existing keyboard controls

| Key | Current main-game action | Legacy/naive action |
| --- | --- | --- |
| Left/Right | Move | Move |
| Up | Rotate | Rotate |
| Down | Accelerate downward movement | Move downward |
| Space | Soft/hard drop, as selected | Soft/hard drop, as selected |
| P | Toggle main game pause | Pause/restart timer |
| Y | New main-game run | No dedicated Y command |
| S | Toggle main hard-drop flag | Lowercase `s` on keyup toggles soft-drop behavior |
| N | Force next piece (developer control) | No dedicated N command |
| F | Toggle clearing mode (developer control) | No dedicated F command |
| A | No main-game binding | Lowercase `a` toggles line animation |
| 0–9 | No main-game binding | Switch legacy renderer theme on keyup |

**Clarification:** `S` selects how `Space` behaves in the main game; it is not the ordinary downward movement key. The exact in-browser behavior must be confirmed locally.

### Historical screenshots already in repository

- [TetColor](../../assets/screenshots/tetcolor.png)
- [Legacy theme variants](../../assets/screenshots/themes.png)
- [Simple renderer](../../assets/screenshots/simple-default.png)

These are **historical artifacts**, not verified screenshots of the current Vue 3/Vite build. Fresh desktop/mobile captures are still required.

## 3. Pre-existing issues and risks (not introduced by Arcade 2077)

These are findings from source inspection, **not claims that a bug was reproduced in a browser**. Assign fixes to the appropriate implementation stage.

| ID | Evidence in current code | Impact / planned owner |
| --- | --- | --- |
| B-01 | `App.vue` keeps its main keyboard listeners and engine loop while `<stakan>` mounts its own keyboard listeners/intervals when the naive checkbox is enabled | Two active input/loop owners; isolate and dispose in **Stage 1** |
| B-02 | `game.js` gates gravity and level advancement on `!game.paused`, but still evaluates left/right/rotate/down input when paused | Input may change the board during pause; correct run-state contract in **Stage 1** |
| B-03 | `App.vue` toggles `randomNoise` after each `createStakan()` call, alternating clean and partially randomized boards | Restart is not guaranteed to be an identical clean start; distinguish intentional Lab setup from player restart in **Stages 1/3** |
| B-04 | `game.js` has fixed runtime option fields; `game/options.js` is only loaded into Vuex for display | UI options are not authoritative; wire one source of truth in **Stage 1** |
| B-05 | `game.js` has module-local `$lines` and `$three` collections; `start()` does not explicitly clear them | Potential stale removal/cascade state on restart during clearing; regression test and correct lifecycle in **Stage 1** |
| B-06 | The main view presents a naive checkbox, unformatted options JSON and debug keys N/F | Replace player-facing shell and gate debug controls in **Stages 2/5** |
| B-07 | `game.js` emits `done`, but `App.vue` only logs it, with no modern game-over overlay | Give game-over a visible UI state in **Stage 4** |
| B-08 | `App.vue` has global keydown handlers without editable-focus gating; legacy `keydown` calls `preventDefault()` broadly | Keyboard interference with future settings dialogs; isolate in **Stages 1/5** |

Do not change gameplay in Stage 0 merely to silence these risks. When a finding is fixed, add a focused regression test and link the implementation commit.

## 4. Repeatable local QA procedure

Run from a clean checkout on a machine with Node.js `^20.19.0 || >=22.12.0` and npm access. Do not add GitHub Actions.

```sh
git switch feat/arcade-2077-ui
git pull --ff-only
npm install
npm run test:unit
npm run lint
npm run build
npm run dev
```

Open `http://127.0.0.1:1337/`. Use a fresh browser profile or disable stale Service Workers when checking the development build.

Record for each command: **pass / fail / not run**, environment versions and any error log. Do not rewrite unrelated application code while collecting the baseline; report failures separately.

### Browser acceptance checks — modern TetColor

- [ ] The first page loads without console errors; board, next preview, level and score render.
- [ ] `Left` / `Right` move a piece; holding either key exhibits controlled repeat.
- [ ] `Up` rotates; `Down` accelerates downward movement; collisions keep pieces inside the well.
- [ ] `Space` performs the current drop behavior; `S` changes its mode; the selected mode is visibly reflected.
- [ ] `P` toggles pause; record whether movement/drop still work during pause (B-02).
- [ ] `Y` and New Game start new runs; record whether the initial well alternates with random noise (B-03).
- [ ] Score, cleared blocks and level update; check at least one matching triple and a successive clear/cascade.
- [ ] Game over terminates gameplay; record any missing visible indication (B-07).
- [ ] `N` and `F` behave as existing developer shortcuts (for later Lab migration).
- [ ] Switch naive mode while the modern game is active; document keyboard conflicts or simultaneous background activity (B-01).

### Browser acceptance checks — legacy / naive

- [ ] Legacy well and next preview render; movement, rotation and down/drop controls respond.
- [ ] Try number keys `1`, `3`, `4`: confirm renderer changes and note any overflow or stacking bugs.
- [ ] Try `a` (line animation) and `s` (drop mode), and verify `P` works.
- [ ] Observe a completed line, restart and game over if reproducible.
- [ ] Switching back to modern mode does not require a page reload; document any old timers/input still acting.

### Responsive and production checks

- [ ] Desktop **1440×900**: capture current modern and naive views.
- [ ] Phone portrait **390×844**: capture current modern and naive views (record overflow and usability issues even if broken).
- [ ] Narrow phone **320×700**: inspect horizontal clipping and control access.
- [ ] Short-height landscape **844×390**: inspect board visibility and scroll behavior.
- [ ] `npm run preview`: check the built UI, icons, `manifest.json`, Service Worker registration and offline reload.
- [ ] If hosted under a subdirectory, check that assets load with Vite `base: './'`.

Suggested screenshot output paths (tracked only once actually captured):

```text
docs/plans/baseline/screenshots/modern-desktop.png
docs/plans/baseline/screenshots/naive-desktop.png
docs/plans/baseline/screenshots/modern-mobile.png
docs/plans/baseline/screenshots/naive-mobile.png
```

Use browser devtools or Playwright viewport emulation; the device/viewport and commit must be recorded alongside the captures. Preserve failures as baseline evidence rather than fixing them silently.

## 5. Exit criteria and remaining handoff

**Stage 0 is not complete until** the full-checkout command results and browser/screenshot checks are recorded. Confirm which B-xx issues were reproduced, which remain only source-derived, and which checks could not be run.

When local QA is complete:
1. Update the checkboxes and result table in this file, embedding the screenshots from the paths above.
2. Set Stage 0 to **[x] Complete** in the roadmap only if Gate 0 is satisfied.
3. Commit the completed evidence to `feat/arcade-2077-ui` and update the **same Draft PR**.
4. Proceed to Stage 1 (game control and settings contract); do not open a second implementation PR.
