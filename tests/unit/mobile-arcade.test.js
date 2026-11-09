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

test('mobile stage prioritizes a large well with slim side rails', () => {
  const app = read('src/App.vue')
  const style = read('src/styles/arcade-mobile.styl')
  const responsive = read('src/styles/arcade-responsive.styl')
  assert.doesNotMatch(app, /PLAYFIELD \/ 01|PLAYING|statusLabel\(\)/)
  assert.match(style, /--mobile-rail: clamp\(64px, 18\.5vw, 148px\)/)
  assert.match(style, /width unquote\('calc\(100% - var\(--mobile-rail\) - var\(--mobile-rail\) - 12px\)'\)/)
  assert.match(style, /\.board-panel__well \.tetcolor-board/)
  assert.match(style, /--jstet-cell-size unquote\('max\(1px, min\(calc/)
  assert.doesNotMatch(style.split('.board-panel__well .tetcolor-board')[1].split('// The city art')[0], /min\(38px/)
  assert.match(responsive, /container-type size/)
})

test('mobile stage places Level and Next left; Score, Blocks and Bonus right', () => {
  const app = read('src/App.vue')
  const hud = read('src/components/GameHud.vue')
  const rails = read('src/styles/arcade-rails.styl')
  assert.match(app, /<NextPiece class="preview-column"/)
  assert.match(app, /<GameHud class="stats-column stats-column--left"/)
  assert.match(app, /<GameHud class="stats-column stats-column--right"/)
  assert.match(hud, /hud-stat--score/)
  assert.match(hud, /hud-stat--level/)
  assert.match(hud, /hud-stat--progress/)
  assert.match(hud, /hud-stat--bonus/)
  assert.match(rails, /\.dashboard-column \.game-hud \.hud-stat--level\n    left 9px/)
  assert.match(rails, /\.dashboard-column \.next-panel\n    position absolute\n    z-index 3\n    top 50%/)
  assert.match(rails, /\.right-column \.game-hud \.hud-stat--score\n    right 9px\n    left auto\n    top 9px/)
  assert.match(rails, /\.right-column \.game-hud \.hud-stat--progress\n    right 9px\n    left auto\n    top unquote/)
  assert.match(rails, /\.right-column \.game-hud \.hud-stat--bonus\n    right 9px\n    left auto\n    top auto\n    bottom 9px/)
  assert.match(hud, /mode === 'tetcolor'/)
  assert.match(hud, /bonus > 0 \? '\+' \+ bonus : '—'/)
})

test('mobile controls place left/right on the left and Drop/Rotate on the right', () => {
  const pad = read('src/components/TouchControls.vue')
  const style = read('src/styles/arcade-mobile.styl')
  const left = pad.split('class="touch-pad__left"')[1].split('class="touch-pad__right"')[0]
  const right = pad.split('class="touch-pad__right"')[1].split('</section>')[0]
  assert.match(left, /aria-label="Move left and right"/)
  assert.match(left, /v-for="control in moveControls"/)
  assert.match(right, /aria-label="Drop and rotate"/)
  assert.ok(right.indexOf("onPointerDown($event, 'drop')") < right.indexOf("onPointerDown($event, 'rotate')"))
  assert.match(pad, /action: 'left'/)
  assert.match(pad, /action: 'right'/)
  assert.doesNotMatch(pad, /action: 'down'/)
  assert.match(style, /\.touch-pad\n    grid-area touch/)
  assert.match(style, /justify-content space-between/)
  assert.match(style, /\.touch-pad__left,\n  \.touch-pad__right/)
  // Keyboard down remains supported, independently of the four touch buttons.
  assert.match(read('src/App.vue'), /ArrowDown: \(\) => gameBus\.emit\('down:start'\)/)
})

test('gesture mode reclaims the pad row while buttons mode keeps the prior layout', () => {
  const surface = read('src/styles/arcade-touch-surface.styl')
  const mobile = read('src/styles/arcade-mobile.styl')
  const app = read('src/App.vue')
  // Buttons mode keeps the classic stage/touch rows.
  assert.match(mobile, /grid-template-areas 'stage' 'touch'/)
  // Gesture mode collapses the pad row so the well grows taller.
  assert.match(surface, /\.jstet-app\.touch-mode-gestures \.game-layout\n    grid-template-areas 'stage'\n    grid-template-rows minmax\(0, 1fr\)/)
  assert.match(surface, /\.jstet-app\.touch-mode-gestures \.touch-pad\n    display none/)
  // The surface covers the panel itself, with hints and warp layers non-interactive.
  assert.match(surface, /\.mobile-touch-surface\n    position absolute\n    inset 0\n    z-index 4/)
  assert.match(surface, /&__hints\n      position absolute\n      inset 0\n      pointer-events none/)
  assert.match(surface, /&__warp/)
  assert.match(surface, /&--inactive\n      pointer-events none/)
  // The surface mounts only in gesture mode and reads live board geometry.
  assert.match(app, /<MobileTouchSurface v-if="preferences\.touchControlsMode === 'gestures'"/)
  const component = read('src/components/MobileTouchSurface.vue')
  assert.match(component, /querySelector\('\.tetcolor-board'\)/)
  assert.match(component, /board\.getBoundingClientRect\(\)/)
})

test('Legacy is desktop-only while TetColor and Classic stay in the mobile header', () => {
  const app = read('src/App.vue')
  const mobile = read('src/styles/arcade-mobile.styl')
  assert.match(app, /class="mode-switch__button mode-switch__button--legacy"/)
  assert.match(mobile, /@media \(max-width: 920px\)/)
  assert.match(mobile, /\.mode-switch__button--legacy\n    display none/)
  assert.match(app, /requestMode\('tetcolor'\)/)
  assert.match(app, /requestMode\('classic'\)/)
  assert.match(app, /requestMode\('legacy'\)/)
})
