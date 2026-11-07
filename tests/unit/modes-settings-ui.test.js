import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('both modes are real game sessions, not cosmetic theme toggles', () => {
  const app = read('src/App.vue')
  const modes = read('src/game/modes.js')
  assert.match(app, /requestMode\('classic'\)/)
  assert.match(app, /requestMode\('tetcolor'\)/)
  assert.match(app, /:aria-pressed="!naiveImplementation && mode === 'classic'"/)
  assert.match(app, /:aria-pressed="!naiveImplementation && mode === 'tetcolor'"/)
  assert.match(app, /createGamePieces\(this.mode\)/)
  assert.match(app, /createGameBoard\(this.mode\)/)
  assert.match(app, /tetcolor: this.mode === 'tetcolor'/)
  assert.match(modes, /createTShape\(4\)/)
  assert.match(modes, /new Stakan\(21, 12, 4\)/)
})

test('all three modes switch immediately without a confirmation dialog', () => {
  const app = read('src/App.vue')
  assert.match(app, /requestMode\('legacy'\)/)
  assert.match(app, /:aria-pressed="naiveImplementation"/)
  assert.match(app, /this.naive = true/)
  assert.match(app, /this.naive = false/)
  assert.match(app, /this.createStakan\(\)/)
  assert.doesNotMatch(app, /pendingMode|confirmMode|cancelMode|Your current game will be discarded/)
})

test('the settings use live preferences and next-game rule application', () => {
  const app = read('src/App.vue')
  assert.match(app, /v-model="preferences.theme"/)
  assert.match(app, /v-model="preferences.reducedMotion"/)
  assert.match(app, /v-model="pendingSingleBlock"/)
  assert.match(app, /singleBlock: this.pendingSingleBlock/)
  assert.match(app, /savePreferences\(this.preferences\)/)
  assert.match(app, /if \(this.status === 'running'\) this.togglePause\(\)/)
  assert.match(app, /Closing settings leaves an active session paused/)
  assert.doesNotMatch(app, /modalWasRunning/)
})

test('Classic HUD and next-piece preview derive from live Vuex game state', () => {
  const hud = read('src/components/GameHud.vue')
  const preview = read('src/components/NextPiece.vue')
  const engine = read('src/utils/game.js')
  assert.match(hud, /mode === 'classic' \? 'Lines' : 'Blocks'/)
  assert.match(preview, /previewSize\(\)/)
  assert.match(preview, /this.getSize \|\| 3/)
  assert.match(engine, /cleared \* game.scorePart \* 10 \* \(game.level \+ 1\)/)
  assert.match(engine, /\$bus.emit\('score', game.score\)/)
})

test('visual themes and reduced motion are independent of board state', () => {
  const shell = read('src/styles/arcade-shell.styl')
  const cells = read('src/styles/game-cells.styl')
  assert.match(shell, /\.jstet-app\.theme-prism/)
  assert.match(shell, /\.jstet-app\.reduce-motion/)
  assert.match(cells, /var\(--cell-7, #ffac65\)/)
  assert.match(cells, /var\(--cell-1, #89fb6e\)/)
})
