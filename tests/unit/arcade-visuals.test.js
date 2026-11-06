import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('Arcade cityscape is a local scalable striped-sunset illustration', () => {
  const art = read('src/components/CityscapeArt.vue')
  const app = read('src/App.vue')
  for (const token of ['viewBox="0 0 320 800"', 'city-striped-disc', 'city-windows', 'city-water']) {
    assert.ok(art.includes(token), token)
  }
  assert.ok(app.includes('<CityscapeArt class="cityscape-column"'))
  assert.ok(app.includes('aria-hidden="true"'))
})

test('pause and game-over overlays expose real actions and focus behavior', () => {
  const app = read('src/App.vue')
  for (const token of ['<Transition name="state-overlay">', "status === 'paused' || status === 'gameOver'",
    'role="dialog"', 'aria-labelledby="game-state-heading"', 'ref="statePrimary"',
    "status === 'paused' ? togglePause() : createStakan()", 'status(value)',
    '!this.settingsOpen && !this.pendingMode && !this.naive']) {
    assert.ok(app.includes(token), token)
  }
})

test('HUD uses real Vuex values for animated score, bonus and level progress', () => {
  const hud = read('src/components/GameHud.vue')
  for (const token of [':key="score"', ':key="bonus"', 'class="level-meter"',
    'v-for="value in maxLevel"', 'this.$store.state.options.maxLevel']) {
    assert.ok(hud.includes(token), token)
  }
})

test('city layout and board geometry are separate at desktop and mobile widths', () => {
  const style = read('src/styles/arcade-stage4.styl')
  for (const token of ["'skyline stats board preview'", '.cityscape-column',
    '.jstet-app .board-panel__well .tetcolor-board', '@media (max-width: 1200px)',
    '@media (max-width: 920px)', '@media (max-width: 480px)']) {
    assert.ok(style.includes(token), token)
  }
  assert.ok(read('src/components/themes/tetcolor.vue').includes('getWellValue'))
})

test('visual motion honors OS preference, player setting and pause', () => {
  const style = read('src/styles/arcade-stage4.styl')
  const shell = read('src/styles/arcade-shell.styl')
  const app = read('src/App.vue')
  for (const token of ['@media (prefers-reduced-motion: reduce)',
    '.jstet-app.is-paused .game-cell', '@keyframes clear-shimmer']) {
    assert.ok(style.includes(token), token)
  }
  assert.ok(shell.includes('.jstet-app.reduce-motion'), '.jstet-app.reduce-motion')
  assert.ok(app.includes("'is-paused': status === 'paused'"))
})

test('portrait skyline includes a proportional sunset and dense waterfront', () => {
  const art = read('src/components/CityscapeArt.vue')
  assert.ok(art.includes('viewBox="0 0 320 800"'))
  for (const token of ['cy="441"', 'r="104"', 'frontBuildings', 'backBuildings', 'city-windows']) {
    assert.ok(art.includes(token), token)
  }
})

test('reference refinement improves card balance without changing the board renderer', () => {
  const style = read('src/styles/arcade-stage4.styl')
  const app = read('src/App.vue')
  assert.ok(style.includes('grid-template-columns minmax(245px, 315px)'))
  assert.ok(style.includes('.game-hud .hud-stat'))
  assert.ok(style.includes('.guide-example'))
  assert.ok(app.includes('CONNECT THREE'))
  assert.ok(app.includes('FILL A LINE'))
  assert.ok(read('src/components/themes/tetcolor.vue').includes('getWellValue'))
})
