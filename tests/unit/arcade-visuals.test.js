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
    '!this.settingsOpen && !this.naive']) {
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

test('cityscape and next share the left rail; scoreboard has an independent right rail', () => {
  const app = read('src/App.vue')
  const rails = read('src/styles/arcade-rails.styl')
  const sizing = read('src/styles/arcade-responsive.styl')
  for (const token of ['class="dashboard-column"', '<CityscapeArt class="cityscape-column"',
    'class="stats-column stats-column--left"', 'class="stats-column stats-column--right"',
    'class="right-column"']) {
    assert.ok(app.includes(token), token)
  }
  for (const token of ["'dashboard board right'", '.dashboard-column .next-panel',
    '.right-column .game-hud .hud-stat--bonus']) {
    assert.ok(rails.includes(token), token)
  }
  assert.ok(sizing.includes('container-type size'))
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

test('simplified cabinet retains only real gameplay panels', () => {
  const style = read('src/styles/arcade-rails.styl')
  const app = read('src/App.vue')
  assert.ok(style.includes('.right-column .game-hud .hud-stat--score'))
  assert.ok(app.includes('<NextPiece class="preview-column"'))
  assert.ok(!app.includes('guide-column'))
  assert.ok(!app.includes('guide-example'))
  assert.ok(!app.includes('arcade-footer'))
  assert.ok(read('src/components/themes/tetcolor.vue').includes('getWellValue'))
})

test('Arcade TetColor restores the original gray well and flat 1990s cell borders', () => {
  const styles = read('src/styles/arcade-stage4.styl')
  const cells = read('src/styles/game-cells.styl')
  const shell = read('src/styles/arcade-shell.styl')
  const app = read('src/App.vue')

  assert.ok(app.includes(':class="\'board-panel--\' + mode"'))
  assert.ok(styles.includes('.jstet-app.theme-arcade .board-panel--tetcolor'))
  for (const token of ['--cell-background: #aaaaaa', '--cell-border: #201f20',
    '--cell-empty-edge: #201f20', '--cell-empty-shadow: none']) {
    assert.ok(styles.includes(token), token)
  }
  for (const color of ['#89fb6e', '#ec64f8', '#ec615c', '#fffe73', '#5458f6', '#89fcfd']) {
    assert.ok(shell.includes(color), color)
  }
  assert.ok(cells.includes('background var(--cell-background, #10182f)'))
  assert.ok(cells.includes('border 1px solid var(--cell-border'))
  assert.ok(styles.includes('.game-cell.N-2'))
  assert.ok(styles.includes('background #000ba4'))
})

test('Prism, Classic and next preview do not inherit the classic TetColor well', () => {
  const app = read('src/App.vue')
  const styles = read('src/styles/arcade-stage4.styl')
  const shell = read('src/styles/arcade-shell.styl')
  assert.ok(app.includes("'board-panel--' + mode"))
  assert.ok(styles.includes('.jstet-app.theme-arcade .board-panel--tetcolor'))
  assert.ok(shell.includes('.jstet-app.theme-prism'))
  assert.ok(shell.includes('.next-piece .game-cell:not(.item)'))
})
