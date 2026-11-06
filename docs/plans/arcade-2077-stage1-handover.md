# Arcade 2077 — Stage 1: Game Control and Settings Contract

> Status: **IMPLEMENTED IN PR #7 / LOCAL BROWSER QA PENDING**  
> Source: `feat/arcade-2077-ui`  
> Previous gate: [Stage 0 — Complete](./arcade-2077-baseline.md)  
> Next gate: [Stage 2 — Responsive UI Shell](./arcade-2077-ui-roadmap.md#stage-2--responsive-application-shell-and-hud)

## Goals and implemented boundaries

Stage 1 makes the original game engine safe to drive from a future polished UI. It does **not** introduce a new screen, a playable Classic selector, or a new rendering architecture.

### Engine commands

`src/utils/gameCommands.js` binds a single `mitt` bus to one modern engine instance and returns a deterministic disposer. `setup(bus)` also returns a disposer and rejects a second live binding.

| Bus input | Meaning | Preconditions |
| --- | --- | --- |
| `start` with run options | Start/restart with current well/pieces and validated rules | App sets the new well and piece list first |
| `pause` | Toggle pause/resume; pause time is excluded from timers | Running only |
| `drop` with boolean `hard` | Existing Space behavior | Running, not paused |
| `left/right/rotate/down:start/stop` | Same held-key repeat engine as Stage 0 | Running, not paused; reset on pause, blur and stop |
| `next` / `fill` | Historical diagnostic commands | Disabled in player mode; future Lab only |

`src/utils/game.js` emits `status` as `running`, `paused`, `gameOver` or `idle`; Vuex mirrors it for the upcoming HUD. `done` still fires on genuine game over, not on switching engines.

The board, active piece and match/line-clear algorithms remain authoritative in the existing engine. No hot-path state cloning, deep freezing or observer-related refactoring was introduced.

### Run-level options and presentation settings

`src/game/options.js` is the **only place** defining run-level defaults; `resolveRunOptions()` validates and copies them. The engine applies them at the beginning of a run. The options are:

| Option | Default | Validation | When applied |
| --- | --- | --- | --- |
| `maxLevel` | 9 | Integer >= 1 | New run |
| `levelTime` | 60 | Integer >= 1 | New run |
| `scorePart` | 10 | Integer >= 0 | New run |
| `bonusSize` | 500 | Integer >= 0 | New run |
| `singleBlock` | true | Boolean | New run |
| `tetcolor` | true | Boolean | New run; Classic's tetromino selection is Stage 3 |

The Vuex `options` snapshot is not a second source of defaults; the new run takes it explicitly. The current UI still starts TetColor with the existing TetColor piece set. Do **not** expose the Classic toggle as fully playable until Stage 3 wires its pieces and renderer.

Immediate presentation settings will be: display theme, reduced motion, keyboard help, visibility preferences, and the existing `S` soft/hard Space-drop selector. They must not reset the run. An actual UI settings panel and versioned persisted preferences are Stage 3; this stage defines their application policy without adding unused UI.

### Lifecycle and baseline regression fixes

- **B-01:** `App.vue` watches the naive switch, stops the modern RAF and removes its listeners/bus subscriptions before the legacy component takes control; the reverse transition starts a clean modern run.
- **B-02:** Pausing freezes gravity, clearing, held-key movement and level progression; pause duration does not advance game timers.
- **B-03:** New Game now always starts with a clean well; the old alternating random-noise debug experiment is not a player feature.
- **B-04:** Engine rules come from validated options on each start, not an unrelated hard-coded duplicate.
- **B-05:** Both Tetris line-clear and TetColor cascade state is reset when a new run begins; zeroed counters and initial piece are emitted immediately.
- **B-08:** Input focus guard ignores editable controls and dialogs, and blur clears held input. Legacy handler no longer calls `preventDefault()` on every key.
- **Legacy async cleanup:** Unmount cancels current intervals, delayed line clear and drop/clear animation frames, preventing activity after a mode switch.
- **Lint tooling:** Adjusted the obsolete `vue/max-attributes-per-line` configuration schema so ESLint can inspect source; other pre-existing violations may remain.

B-06 (player-facing debug UI) is Stage 2/5 and B-07 (visible game-over overlay) is Stage 4; neither is falsely marked complete here.

## Validation performed by this change

| Check | Result |
| --- | --- |
| Three new game-command tests and four input tests | **PASS** in isolated Node.js harness |
| One keyboard-focus test | **PASS** in isolated Node.js harness |
| Pure-module syntax check (`gameCommands.js`, `keyboard.js`, `options.js`) | **PASS** in isolated Node.js harness |
| Full repository unit suite, ESLint, Vite build and browser smoke | **NOT RUN** here — Mac/Opencode required |

Isolated tests use a local copy of the exact new pure modules and `events.js`, but do **not** load the Vue app or the bundled engine; browser acceptance is mandatory before this gate is closed.

## Mac / Opencode handoff

Use the existing **Draft PR #7** and `feat/arcade-2077-ui`, not a new PR. Verify there are no unrelated local changes before touching files.

```sh
git switch feat/arcade-2077-ui
git pull --ff-only
npm install
npm run test:unit
npm run lint
npm run build
npm run dev
```

Record **actual command status** and terminal errors. The Stage 0 suite contained seven tests; Stage 1 adds five test cases (expected twelve total). Since the original ESLint configuration is now corrected, distinguish newfound legacy lint failures from Stage 1 regressions.

### Required browser checks

- [ ] Desktop TetColor loads with board, active/next pieces and counters; arrow controls, held repeat, both Space-drop modes and rotation work.
- [ ] Press P and attempt arrows, Space and long holds for at least 3 seconds: **no movement, clearing, score or level progression while paused**. Resume and verify motion and progression continue naturally.
- [ ] Keep the game paused for at least 65 seconds; after resume, verify the level does not advance from paused wall-clock time.
- [ ] Restart using both New Game and Y at least six times: every well is clean; score, lines, bonus and level are zeroed.
- [ ] Restart during an active match clear/cascade: new run has no inherited blocks, score, lines or bonus (B-05).
- [ ] Switch modern → naive → modern ten times, including during rapid movement, pause and clear: at most one engine consumes keys; legacy stops when hidden; no duplicate listeners, intervals, RAF loops or console errors.
- [ ] While a text input has focus (can be injected with DevTools), press arrows, Space, S, P, Y: the game is unchanged. Repeat with legacy. Confirm focus cleanup releases any held key.
- [ ] In naive, keys 1/3/4 still change themes, A/S behave as before, movement and line clears work; switching back restores the default modern game.
- [ ] Verify `N` and `F` do nothing in normal player mode. No hidden debug action is accidentally exposed by input handlers.
- [ ] Verify genuine game over updates Vuex `status` to `gameOver` (UI overlay comes in Stage 4).
- [ ] Check keyboard/board behavior at 390×844 and 1440×900; `npm run preview` keeps built assets and PWA intact.

For deterministic checks, inspect engine status/metrics in DevTools and record observations. Do not infer pass from source code.

## Gate decision

**Do not mark Stage 1 complete** before the above command/browser checks are recorded. On success, update this file with evidence, mark Stage 1 complete in the roadmap, commit to the **same branch** and proceed to Stage 2. Keep PR #7 Draft until Stage 6 approval. No GitHub Actions or intermediate merge.
