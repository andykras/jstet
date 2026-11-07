import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getFxAnchor } from '../../src/utils/visualFx.js'
import { comboBonusForStreak, cascadeBonus } from '../../src/game/bonus.js'
import { DEFAULT_PREFERENCES, normalizePreferences } from '../../src/utils/preferences.js'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('celebration location follows the actual matched cells and is immutable', () => {
  const cells = [
    { column: 1, row: 5, color: 2 },
    { column: 3, row: 7, color: 2 },
    { column: 5, row: 9, color: 2 }
  ]
  const anchor = getFxAnchor(cells)
  assert.deepEqual(anchor, { column: 3, row: 7 })
  assert.ok(Object.isFrozen(anchor))
  assert.deepEqual(cells[0], { column: 1, row: 5, color: 2 })
  assert.equal(getFxAnchor([]), null)
  assert.equal(getFxAnchor(null), null)
  assert.equal(getFxAnchor([{ column: NaN, row: 3 }]), null)
  assert.deepEqual(getFxAnchor([{ column: 1, row: 2 }, { column: NaN, row: 4 }, { column: 4, row: 5 }]),
    { column: 2.5, row: 3.5 })
})

test('TetColor rewards stay authoritative; first match and zero rewards do not celebrate', () => {
  assert.equal(comboBonusForStreak(1, 10), 0)
  assert.equal(comboBonusForStreak(2, 10), 150)
  assert.equal(comboBonusForStreak(3, 10), 300)
  assert.equal(comboBonusForStreak(4, 10), 450)
  assert.equal(comboBonusForStreak(4, 0), 0)
  assert.equal(cascadeBonus(0, 500), 500)
  assert.equal(cascadeBonus(500, 500), 800)
  assert.equal(cascadeBonus(800, 500), 900)
  assert.equal(cascadeBonus(0, 0), 0)
})

test('combo FX follows the existing positive bonus award once, without touching scoring', () => {
  const engine = read('src/utils/game.js')
  const start = engine.indexOf("const combo = comboBonusForStreak(game.matchStreak, game.scorePart)")
  const end = engine.indexOf("$bus.emit('sound:clear')", start)
  assert.ok(start > 0 && end > start)
  const award = engine.slice(start, end)
  assert.match(award, /if \(combo > 0\) \{/)
  assert.match(award, /game\.bonus = combo/)
  assert.match(award, /game\.score \+= combo/)
  assert.match(award, /\$bus\.emit\('bonus', combo\)/)
  assert.match(award, /\$bus\.emit\('score', game\.score\)/)
  assert.match(award, /emitFx\('fx:combo', \(\) => Object\.freeze\(\{/)
  assert.match(award, /amount: combo/)
  assert.match(award, /streak: game\.matchStreak/)
  assert.match(award, /cells: clearFxCells/)
  assert.equal(engine.split("emitFx('fx:combo'").length - 1, 1)
})

test('cascade FX follows actual gravity re-matches and their positive awarded amount', () => {
  const engine = read('src/utils/game.js')
  assert.match(engine, /let cascadeBonusAwarded = 0/)
  assert.match(engine, /if \(\(\$three = detectClears\('tetcolor', getThreeBlock\)\)\.size\) \{/)
  assert.match(engine, /game\.cascadeDepth\+\+/)
  assert.match(engine, /game\.chainBonus = cascadeBonus\(game\.chainBonus, game\.bonusSize\)/)
  assert.match(engine, /game\.score \+= game\.chainBonus/)
  assert.match(engine, /cascadeBonusAwarded = game\.chainBonus/)
  assert.match(engine, /if \(cascadeBonusAwarded > 0\) \{\s+emitFx\('fx:cascade'/)
  assert.match(engine, /amount: cascadeBonusAwarded/)
  assert.match(engine, /depth: game\.cascadeDepth/)
  assert.match(engine, /cells: clearFxCells/)
  assert.match(engine, /game\.cascadeDepth = 0/)
  assert.equal(engine.split("emitFx('fx:cascade'").length - 1, 1)
})

test('celebrations require real nonzero awards, appropriate depth and active gameplay', () => {
  const overlay = read('src/components/VisualFxOverlay.vue')
  assert.match(overlay, /\['fx:combo', payload => this\.onCombo\(payload\)\]/)
  assert.match(overlay, /\['fx:cascade', payload => this\.onCascade\(payload\)\]/)
  assert.match(overlay, /payload\.streak < 2/)
  assert.match(overlay, /payload\.depth < 1/)
  assert.match(overlay, /!Number\.isInteger\(payload\.amount\) \|\| payload\.amount <= 0/)
  assert.match(overlay, /const anchor = getFxAnchor\(payload\.cells\)/)
  assert.match(overlay, /if \(!anchor\) return/)
  assert.match(overlay, /this\.running/)
  assert.match(overlay, /this\.reducedMotion \|\| this\.osReducedMotion \|\| document\.hidden/)
  assert.doesNotMatch(overlay, /\['score'|\['bonus'|\['sound:clear'/)
  assert.match(overlay, /label: kind === 'combo' \? 'COMBO ×' \+ value : 'CASCADE ×' \+ value/)
})

test('bonus animations are bounded, canceled on lifecycle changes, and stay optional', () => {
  const overlay = read('src/components/VisualFxOverlay.vue')
  const css = read('src/styles/tetcolor-bonus-fx.styl')
  const app = read('src/App.vue')
  const board = read('src/components/themes/tetcolor.vue')

  assert.match(overlay, /const MAX_CELEBRATIONS = 2/)
  assert.match(overlay, /const CELEBRATION_DURATION = 760/)
  assert.match(overlay, /if \(this\.celebrations\.length >= MAX_CELEBRATIONS\)/)
  assert.match(overlay, /this\.timers\.set\(celebration\.id, setTimeout/)
  assert.match(overlay, /this\.celebrations = \[\]/)
  assert.match(overlay, /clearTimeout\(timer\)/)
  assert.match(overlay, /beforeUnmount\(\)/)
  assert.match(overlay, /gameBus\.off\(type, handler\)/)
  assert.match(overlay, /\['start', \(\) => this\.clear\(\)\]/)
  assert.match(overlay, /\['status', status => \{ if \(status !== 'running'\) this\.clear\(\) \}\]/)

  assert.match(board, /<VisualFxOverlay v-if="visualFx"/)
  assert.match(css, /\.jstet-app\.fx-enabled \.tetcolor-fx-celebration/)
  assert.match(css, /\.jstet-app\.fx-enabled \.tetcolor-fx-rim/)
  assert.match(css, /&--tier-2/)
  assert.match(css, /&--tier-3/)
  assert.match(css, /&--cascade/)
  assert.match(css, /@keyframes fx-reward-rise/)
  assert.match(css, /@keyframes fx-reward-rim/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /\.jstet-app\.fx-enabled\.reduce-motion/)
  assert.match(app, /@import '\.\/styles\/tetcolor-bonus-fx\.styl'/)
  assert.equal(DEFAULT_PREFERENCES.visualFxEnabled, false)
  assert.equal(normalizePreferences({ theme: 'prism' }).visualFxEnabled, false)
})
