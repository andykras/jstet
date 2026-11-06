# JSTET — Arcade 2077

A browser puzzle game with two playable modes, built with **Vue 3 (Options API)**, **Vuex 4**, **Vite 7**, **Stylus**, and **mitt**.

The original **TetColor** game mechanics are preserved inside a modern arcade interface. **Classic** provides a separate seven-tetromino ruleset. A historical, independently implemented version remains accessible in **Developer Lab**.

## Play

Start the development server or open the deployed static site. A TetColor game starts automatically. Use the **TetColor / Classic** selector to change modes; switching mid-game requires confirmation and starts a new run.

- **TetColor**: connect three or more blocks of the same color horizontally, vertically, or diagonally; matching blocks disappear and can trigger cascades and bonuses. The default Arcade theme retains the original light-gray `#AAAAAA` well and six TetColor colors.
- **Classic**: stack the seven tetrominoes and clear complete horizontal lines to score points.
- **New Game** resets the well and counters. **Pause / Resume** freezes and resumes the current run. **Game Over** shows the final score and offers a restart.
- **Settings**: change **Arcade / Prism** appearance, reduced motion, keyboard-help visibility, and hard/soft Space-drop behavior immediately. The clearing-sequence option applies to the **next game**. Visual/control preferences are stored locally; an unfinished game is not saved.\n- **Audio**: enable or mute the mainframe hum and the keyboard, piece-lock and clearing effects in Settings. The hum pauses with the game, and browsers may require the first keyboard/touch interaction before allowing playback.

### Keyboard

| Key | Action |
| --- | --- |
| **← / →** | Move left / right; hold for repeat |
| **↑** | Rotate the falling piece |
| **↓** | Move down; hold for accelerated descent |
| **Space** | Drop using the selected soft/hard behavior |
| **S** | Toggle soft/hard drop behavior |
| **P** | Pause / resume |
| **Y** | Start a new game |

Editable controls and modal Settings/confirmation dialogs own keyboard input while focused. `N` and `F` debug shortcuts are not available in normal play.

### Touch

On phone and tablet widths, on-screen controls provide **left**, **right**, **rotate**, **down**, and **Drop**. Touch and hold directional buttons to repeat movement. Drop uses the same soft/hard setting as Space. The touch pad stays reachable while the game scrolls on small displays. The header provides New Game, Pause/Resume, mode choice and Settings.

### Developer Lab

Expand **Developer lab** in the footer and enable **Legacy engine** to inspect the original self-contained `src/components/stakan.vue` implementation. The main engine is stopped while the Lab is active, and restarts cleanly on return.

Lab controls include four historical skins (**Symbols**, **ASCII**, **Text**, **Colors**), line-clear animation, soft/hard drop and New Game. The original Lab keyboard shortcuts still work: **1–4** change skins, **A** toggles line-clear animation, and **S** toggles drop behavior. These are Lab-only options, separate from the Arcade/Prism player themes.

## Development

Requires **Node.js 20.19+ or 22.12+** and npm.

```sh
npm install
npm run dev           # Vite dev server on http://localhost:1337/
npm run test:unit     # node:test suite
npm run lint          # ESLint
npm run build         # Vite production bundle in dist/
npm run preview       # local production preview
```

The historical `npm run serve` alias also starts Vite.

## Deployment and offline use

The site is a static build in `dist/`. Vite uses the relative base `./`, allowing deployment at a subdirectory path. `public/manifest.json` and icons are copied to the build, and `vite-plugin-pwa` generates `service-worker.js`; registration remains in `src/registerServiceWorker.js`. Service workers require HTTPS or localhost. Verify offline reload using the **production preview**, not only the development server.

### Hosting on kraspeed

The production deployment target is `https://tetcolor.andykras.org` through kraspeed's **existing lighttpd** and a dedicated hostname certificate. See the [deployment plan](docs/plans/tetcolor-kraspeed-deployment.md) and [local-agent handoff](docs/plans/tetcolor-kraspeed-agent-handoff.md) before touching DNS/TLS.

From a clean approved `master` on the **Mac** (after the vhost and TLS are provisioned):

```sh
bash scripts/preflight-kraspeed.sh  # read-only inventory; safe before provisioning
bash scripts/deploy-kraspeed.sh     # build/test/lint on Mac, rsync dist/, atomic release
bash scripts/rollback-kraspeed.sh   # swap back to a previously validated release
```

The scripts require working `ssh kraspeed` access and existing `sudo -n` on the server. No Node.js service is needed on kraspeed. **Do not run deploy/rollback until the live-host preflight and infrastructure configuration are approved.**

## Implementation notes

- The primary engine lives in `src/utils/game.js` and `src/game/*`. It emits state through `mitt` into Vuex, while the UI renders the board, next piece and HUD.
- The shallow `Object.freeze` calls in `src/store.js` are intentional protection from deep reactive observation of the hot-path game board. They are **not** a request to rewrite the game engine.
- Touch input feeds the same engine command bus as keyboard input; the Lab has a separate engine and input lifecycle.
- Unit tests cover focused game, input and UI contracts. Browser gameplay, layout, performance and offline behavior require independent acceptance checks.
- The [Arcade 2077 roadmap](docs/plans/arcade-2077-ui-roadmap.md) and its stage handoffs record the design decisions, regressions and QA evidence.
