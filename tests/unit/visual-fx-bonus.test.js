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
  // Rewards are gameplay feedback in their own overlay, independent of opt-in FX.
  const overlay = read('src/components/BonusRewardOverlay.vue')
  assert.match(overlay, /\['fx:combo', payload => this\.onReward\('combo', payload\)\]/)
  assert.match(overlay, /\['fx:cascade', payload => this\.onReward\('cascade', payload\)\]/)
  assert.match(overlay, /multiplier < 2/)
  assert.match(overlay, /!Number\.isInteger\(payload\.amount\) \|\| payload\.amount <= 0/)
  assert.match(overlay, /document\.hidden/)
  assert.match(overlay, /const anchor = getFxAnchor\(payload\.cells\)/)
  assert.match(overlay, /if \(!anchor\) return/)
  assert.doesNotMatch(overlay, /\['score'|\['bonus'|\['sound:clear'/)
  assert.match(overlay, /kind === 'combo' \? 'COMBO' : 'CHAIN'/)
  assert.match(overlay, /×{{ reward\.multiplier }}/)
})

test('bonus animations are bounded, canceled on lifecycle changes, and stay independent of FX', () => {
  const overlay = read('src/components/BonusRewardOverlay.vue')
  const fx = read('src/components/VisualFxOverlay.vue')
  const css = read('src/styles/tetcolor-bonus-fx.styl')
  const board = read('src/components/themes/tetcolor.vue')

  assert.match(overlay, /const MAX_REWARDS = 3/)
  assert.match(overlay, /const REWARD_DURATION = 1250/)
  assert.match(overlay, /if \(this\.rewards\.length >= MAX_REWARDS\)/)
  assert.match(overlay, /this\.timers\.set\(reward\.id, setTimeout/)
  assert.match(overlay, /this\.rewards = \[\]/)
  assert.match(overlay, /for \(const timer of this\.timers\.values\(\)\) clearTimeout\(timer\)/)
  assert.match(overlay, /beforeUnmount\(\)/)
  assert.match(overlay, /gameBus\.off\(type, handler\)/)
  assert.match(overlay, /\['start', \(\) => this\.clear\(\)\]/)
  assert.match(overlay, /\['status', status => \{ if \(status !== 'running'\) this\.clear\(\) \}\]/)
  assert.match(overlay, /document\.addEventListener\('visibilitychange', this\.onHidden\)/)

  // The reward overlay mounts always; only the gameplay FX overlay is opt-in.
  assert.match(board, /<BonusRewardOverlay \/>/)
  assert.match(board, /<VisualFxOverlay v-if="visualFx"/)
  // Rewards float beyond the well and are visible in every theme.
  assert.match(css, /\.tetcolor-board \.bonus-reward/)
  assert.doesNotMatch(css, /\.jstet-app\.fx-enabled/)
  assert.match(css, /pointer-events none/)
  assert.match(css, /@keyframes bonus-reward-rise/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  // Celebrations are gone from the FX overlay entirely.
  assert.doesNotMatch(fx, /fx:combo|fx:cascade|celebration|MAX_CELEBRATIONS/)
})

test('FX off keeps the bonus visible: preferences fail closed to the FX-off default', () => {
  assert.equal(DEFAULT_PREFERENCES.visualFxEnabled, false)
  assert.equal(normalizePreferences({ theme: 'prism' }).visualFxEnabled, false)
})
