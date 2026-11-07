import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DEFAULT_PREFERENCES, loadPreferences, normalizePreferences, savePreferences } from '../../src/utils/preferences.js'
import { toVisualFxCell } from '../../src/utils/visualFx.js'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('visual effects start disabled and reject invalid saved values', () => {
  assert.equal(DEFAULT_PREFERENCES.visualFxEnabled, false)
  assert.equal(normalizePreferences(null).visualFxEnabled, false)
  assert.equal(normalizePreferences({ theme: 'prism' }).visualFxEnabled, false)
  for (const invalid of ['on', 1, null, [], {}]) {
    assert.equal(normalizePreferences({ visualFxEnabled: invalid }).visualFxEnabled, false)
  }
  assert.equal(normalizePreferences({ visualFxEnabled: true }).visualFxEnabled, true)
})

test('previously saved v1 player preferences keep their fields and default FX to off', () => {
  const old = { version: 1, preferences: { theme: 'prism', reducedMotion: true, soundEnabled: false, hardDrop: true } }
  const storage = { getItem: () => JSON.stringify(old) }
  const prefs = loadPreferences(storage)
  assert.equal(prefs.theme, 'prism')
  assert.equal(prefs.reducedMotion, true)
  assert.equal(prefs.soundEnabled, false)
  assert.equal(prefs.hardDrop, true)
  assert.equal(prefs.visualFxEnabled, false)
})

test('opt-in choice persists and remains independent of theme, audio and reduced motion', () => {
  let raw = ''
  const storage = { getItem: () => raw, setItem: (_, value) => { raw = value } }
  const selected = { theme: 'prism', reducedMotion: true, soundEnabled: false, visualFxEnabled: true }
  assert.equal(savePreferences(selected, storage), true)
  assert.equal(JSON.parse(raw).version, 1)
  assert.equal(loadPreferences(storage).visualFxEnabled, true)
  assert.equal(loadPreferences(storage).theme, 'prism')
  assert.equal(loadPreferences(storage).reducedMotion, true)
  assert.equal(loadPreferences(storage).soundEnabled, false)
  assert.equal(savePreferences({ ...selected, visualFxEnabled: false }, storage), true)
  assert.equal(loadPreferences(storage).visualFxEnabled, false)
})

test('settings expose a live opt-in toggle gated to the modern app without changing game mode', () => {
  const app = read('src/App.vue')
  assert.match(app, /mode: 'tetcolor'/)
  assert.match(app, /'fx-enabled': preferences\.visualFxEnabled && !naiveImplementation/)
  assert.match(app, /v-model="preferences\.visualFxEnabled"\s+@change="persistPreferences"/)
  assert.match(app, /savePreferences\(this\.preferences\)/)
  assert.match(app, /<option value="arcade">Arcade<\/option>/)
  assert.match(app, /<option value="prism">Prism<\/option>/)
  assert.doesNotMatch(app, /visualFxEnabled[^\n]*createStakan/)
})

test('FX coordinate mapping respects TetColor and Classic playable bounds', () => {
  assert.deepEqual(toVisualFxCell(1, 18, { width: 9, height: 19 }), { column: 0, row: 0 })
  assert.deepEqual(toVisualFxCell(7, 1, { width: 9, height: 19 }), { column: 6, row: 17 })
  assert.deepEqual(toVisualFxCell(10, 20, { width: 12, height: 21 }), { column: 9, row: 0 })
  assert.deepEqual(toVisualFxCell(1, 1, { width: 12, height: 21 }), { column: 0, row: 19 })
  assert.ok(Object.isFrozen(toVisualFxCell(1, 18, { width: 9, height: 19 })))
})

test('FX coordinates discard hidden rows, borders, invalid cells and invalid dimensions', () => {
  const dims = { width: 9, height: 19 }
  for (const [x, y] of [[0, 10], [8, 10], [4, 0], [4, 19], [4, 20], [-1, 4], [1.2, 3]]) {
    assert.equal(toVisualFxCell(x, y, dims), null)
  }
  assert.equal(toVisualFxCell(1, 18, { width: 2, height: 19 }), null)
  assert.equal(toVisualFxCell(1, 18), null)
  assert.equal(toVisualFxCell(1, 18, { width: 9.1, height: 19 }), null)
})
