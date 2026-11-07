import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('mobile header keeps modes and accessible icon actions on one row', () => {
  const app = read('src/App.vue')
  const style = read('src/styles/arcade-mobile.styl')
  assert.match(app, /@import '\.\/styles\/arcade-mobile\.styl'/)
  for (const mode of ["requestMode('tetcolor')", "requestMode('classic')", "requestMode('legacy')"]) {
    assert.ok(app.includes(mode), mode)
  }
  for (const label of ['aria-label="New game"', "aria-label=\"Settings\"", 'header-action__icon',
    'New Game (N)', 'Settings (S)', 'Resume (P)']) {
    assert.ok(app.includes(label), label)
  }
  assert.match(style, /\.arcade-header\n    display flex\n    flex-wrap nowrap/)
  assert.match(style, /\.header-action__label\n    display none/)
  assert.match(style, /\.header-action__icon\n    display block/)
  assert.match(style, /\.header-actions\n    order initial/)
})

test('mobile board metrics occupy the four corners around the same well', () => {
  const app = read('src/App.vue')
  const hud = read('src/components/GameHud.vue')
  const style = read('src/styles/arcade-mobile.styl')
  assert.doesNotMatch(app, /PLAYFIELD \/ 01|PLAYING|statusLabel\(\)/)
  assert.match(app, /<NextPiece class="preview-column"/)
  assert.match(app, /<GameHud class="stats-column"/)
  assert.match(hud, /hud-stat--score/)
  assert.match(hud, /hud-stat--level/)
  assert.match(hud, /hud-stat--progress/)
  assert.match(style, /grid-template-areas 'stage' 'touch'/)
  assert.match(style, /\.board-panel__well\n    width unquote\('calc\(100% - var\(--mobile-rail\) - var\(--mobile-rail\) - 12px\)'\)/)
  for (const name of ['hud-stat--score', 'hud-stat--level', 'hud-stat--progress']) {
    assert.ok(style.includes('.dashboard-column .game-hud .' + name), name)
  }
  assert.match(style, /\.dashboard-column \.game-hud \.hud-stat--score\n    left 9px\n    bottom 9px/)
  assert.match(style, /\.dashboard-column \.game-hud \.hud-stat--level\n    right 9px\n    top 9px/)
  assert.match(style, /\.dashboard-column \.game-hud \.hud-stat--progress\n    right 9px\n    bottom 9px/)
  assert.match(style, /\.next-panel\n    grid-area stage/)
})

test('touch groups put rotate/drop on left and left/right on the right', () => {
  const pad = read('src/components/TouchControls.vue')
  const style = read('src/styles/arcade-mobile.styl')
  const left = pad.split('class="touch-pad__left"')[1].split('class="touch-pad__right"')[0]
  const right = pad.split('class="touch-pad__right"')[1].split('</section>')[0]
  assert.match(left, /onPointerDown\(\$event, 'rotate'\)/)
  assert.match(left, /onPointerDown\(\$event, 'drop'\)/)
  assert.match(right, /v-for="control in moveControls"/)
  assert.doesNotMatch(pad, /action: 'down'/)
  assert.match(style, /\.touch-pad\n    grid-area touch/)
  assert.match(style, /justify-content space-between/)
  assert.match(style, /\.touch-pad__left,\n  \.touch-pad__right/)
  // Keyboard down is still supported even though the compact touch pad has four keys.
  assert.match(read('src/App.vue'), /ArrowDown: \(\) => gameBus\.emit\('down:start'\)/)
})
