import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { comboBonusForStreak, cascadeBonus } from '../../src/game/bonus.js'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('consecutive successful TetColor drops earn a visible combo bonus', () => {
  assert.equal(comboBonusForStreak(0, 10), 0)
  assert.equal(comboBonusForStreak(1, 10), 0)
  assert.equal(comboBonusForStreak(2, 10), 150)
  assert.equal(comboBonusForStreak(3, 10), 300)
  assert.equal(comboBonusForStreak(4, 10), 450)
})

test('gravity cascades keep the original independent increasing bonus', () => {
  assert.equal(cascadeBonus(0, 500), 500)
  assert.equal(cascadeBonus(500, 500), 800)
  assert.equal(cascadeBonus(800, 500), 900)
})

test('engine tracks streaks per locked piece and clears only after a miss', () => {
  const engine = read('src/utils/game.js')
  assert.match(engine, /this\.matchStreak = 0/)
  assert.match(engine, /this\.chainBonus = 0/)
  assert.match(engine, /if \(\$three\.size\) \{\s*game\.matchStreak\+\+/)
  assert.match(engine, /comboBonusForStreak\(game\.matchStreak, game\.scorePart\)/)
  assert.match(engine, /game\.score \+= combo/)
  assert.match(engine, /\$bus\.emit\('bonus', combo\)/)
  assert.match(engine, /\$bus\.emit\('score', game\.score\)/)
  assert.match(engine, /cascadeBonus\(game\.chainBonus, game\.bonusSize\)/)
  assert.match(engine, /game\.matchStreak = 0\s*game\.bonus = 0\s*\$bus\.emit\('bonus', 0\)/)
  assert.doesNotMatch(engine, /\$bus\.emit\('bonus', 0\)\s*item = next/)
})

test('desktop preview shares actual playable-cell size and bonus has its own panel', () => {
  const app = read('src/App.vue')
  const hud = read('src/components/GameHud.vue')
  const rails = read('src/styles/arcade-rails.styl')
  assert.match(app, /ref="wellContainer"/)
  assert.match(app, /getBoundingClientRect\(\)\.width/)
  assert.match(app, /ResizeObserver/)
  assert.match(app, /--jstet-preview-cell-size/)
  assert.match(rails, /--jstet-cell-size: var\(--jstet-preview-cell-size, 30px\)/)
  assert.match(rails, /grid-template-areas 'dashboard board right'/)
  assert.match(rails, /\.dashboard-column \.next-panel/)
  for (const name of ['hud-stat--score', 'hud-stat--progress', 'hud-stat--bonus']) {
    assert.ok(rails.includes('.right-column .game-hud .' + name), name)
  }
  assert.match(hud, /section !== 'left'/)
  assert.match(hud, /section !== 'right'/)
  assert.match(hud, /bonus > 0 \? '\+' \+ bonus : '—'/)
})
