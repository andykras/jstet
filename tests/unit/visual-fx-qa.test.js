import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import Stakan from '../../src/utils/stakan.js'
import { sampleFxCells, getFxAnchor, captureClearCandidates, markedClearFxCells } from '../../src/utils/visualFx.js'
import { loadPreferences, DEFAULT_PREFERENCES } from '../../src/utils/preferences.js'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('large clearing snapshots are sampled evenly and never mutated', () => {
  const cells = Object.freeze(Array.from({ length: 40 }, (_, index) => Object.freeze({
    column: index % 10, row: Math.floor(index / 10), color: 1
  })))
  const selected = sampleFxCells(cells, 24)
  assert.equal(selected.length, 24)
  assert.deepEqual(selected[0], cells[0])
  assert.deepEqual(selected[selected.length - 1], cells[38])
  assert.equal(new Set(selected.map(cell => cell.row)).size, 4)
  assert.equal(cells.length, 40)
  assert.ok(selected.every(cell => cells.includes(cell)))
  assert.ok(selected.every(cell => Object.isFrozen(cell)))
})

test('sampling leaves short lists unchanged and handles zero, invalid or empty input', () => {
  const cells = Object.freeze([{ column: 0, row: 1 }, { column: 1, row: 1 }])
  assert.equal(sampleFxCells(cells, 24), cells)
  assert.deepEqual(sampleFxCells(cells, 1), [cells[0]])
  assert.deepEqual(sampleFxCells(cells, 0), [])
  assert.deepEqual(sampleFxCells(cells, -2), [])
  assert.deepEqual(sampleFxCells(cells, 2.5), [])
  assert.deepEqual(sampleFxCells(null, 24), [])
  assert.deepEqual(sampleFxCells([], 24), [])
})

test('visual rewards are anchored to full real match, not the sampled cells', () => {
  const cells = Array.from({ length: 40 }, (_, n) => ({ column: n % 10, row: Math.floor(n / 10) }))
  assert.deepEqual(getFxAnchor(cells), { column: 4.5, row: 1.5 })
  assert.ok(sampleFxCells(cells, 24).length < cells.length)
  assert.deepEqual(getFxAnchor(cells), { column: 4.5, row: 1.5 })
})

test('large Classic clears remain color-accurate at detection before sampling', () => {
  const board = new Stakan(21, 12, 4)
  for (let y = 5; y <= 8; y++) {
    for (let x = 1; x <= 10; x++) board[y][x] = 1 + (x + y) % 7
  }
  const candidates = captureClearCandidates(board)
  for (let y = 5; y <= 8; y++) {
    for (let x = 1; x <= 10; x++) board[y][x] = -2
  }
  const clear = markedClearFxCells(candidates, board)
  assert.equal(clear.length, 40)
  const selected = sampleFxCells(clear, 24)
  assert.equal(selected.length, 24)
  assert.equal(new Set(selected.map(cell => cell.row)).size, 4)
  assert.ok(selected.every(cell => cell.color >= 1 && cell.color <= 7))
})

test('No FX remains the fresh-install and legacy-save default after the final polish', () => {
  assert.equal(DEFAULT_PREFERENCES.visualFxEnabled, false)
  const storage = {
    getItem: () => JSON.stringify({ version: 1, preferences: { theme: 'prism', soundEnabled: false } })
  }
  const loaded = loadPreferences(storage)
  assert.equal(loaded.visualFxEnabled, false)
  assert.equal(loaded.theme, 'prism')
  assert.equal(loaded.soundEnabled, false)
  const app = read('src/App.vue')
  const board = read('src/components/themes/tetcolor.vue')
  assert.match(app, /'fx-enabled': preferences\.visualFxEnabled && !naiveImplementation/)
  assert.match(board, /<VisualFxOverlay v-if="visualFx"/)
})

test('FX opt-out invalidates pending clear snapshots in engine and cleans event subscription', () => {
  const engine = read('src/utils/game.js')
  const app = read('src/App.vue')
  assert.match(engine, /bus\.on\('fx:reset', resetFx\)/)
  assert.match(engine, /bus\.off\('fx:reset', resetFx\)/)
  assert.match(engine, /const resetFx = \(\) => \{ clearFxCells = EMPTY_FX_CELLS \}/)
  assert.match(app, /if \(!this\.preferences\.visualFxEnabled\) gameBus\.emit\('fx:reset'\)/)
  assert.match(engine, /clearFxCells = EMPTY_FX_CELLS/)
})

test('hard-drop during sequential clear cannot leak a phantom hard-lock flash', () => {
  const engine = read('src/utils/game.js')
  assert.match(engine, /const clearing = game\.singleBlock && \(\$lines\.length > 0 \|\| \$three\.size > 0\)/)
  assert.match(engine, /if \(!clearing && distance > 0\) \{/)
  assert.match(engine, /if \(!clearing\) game\.hardDropPending = true/)
  assert.match(engine, /game\.hardDropPending = false/)
})

test('FX overlay uses bounded fair sampling and cancels every timed effect', () => {
  const overlay = read('src/components/VisualFxOverlay.vue')
  const css = read('src/styles/tetcolor-motion-fx.styl')
  assert.match(overlay, /const MAX_EFFECTS = 24/)
  assert.match(overlay, /const selected = sampleFxCells\(cells, MAX_EFFECTS\)/)
  assert.match(overlay, /for \(const cell of selected\)/)
  assert.match(overlay, /clearTimeout\(this\.timers\.get\(expired\.id\)\)/)
  assert.match(overlay, /for \(const timer of this\.timers\.values\(\)\) clearTimeout\(timer\)/)
  assert.match(overlay, /this\.effects = \[\]/)
  assert.doesNotMatch(overlay, /celebrations/)
  assert.match(css, /pointer-events none/)
})

test('all FX layers are scoped; baseline cell material remains untouched', () => {
  const app = read('src/App.vue')
  const baseline = read('src/styles/game-cells.styl')
  for (const path of [
    'tetcolor-visual-fx.styl', 'tetcolor-motion-fx.styl', 'tetcolor-clear-fx.styl'
  ]) {
    assert.ok(app.includes(`@import './styles/${path}'`), path)
    assert.match(read(`src/styles/${path}`), /\.jstet-app\.fx-enabled/)
  }
  // Bonus feedback is deliberately NOT fx-scoped: it works with FX off too.
  assert.ok(app.includes(`@import './styles/tetcolor-bonus-fx.styl'`))
  const bonus = read('src/styles/tetcolor-bonus-fx.styl')
  assert.match(bonus, /\.tetcolor-board \.bonus-reward-layer/)
  assert.doesNotMatch(bonus, /\.jstet-app\.fx-enabled/)
  assert.doesNotMatch(baseline, /fx-active|fx-enabled|fx-clear|fx-reward|bonus-reward/)
})
