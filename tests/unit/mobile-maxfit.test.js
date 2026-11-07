import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('mobile fit keeps a bounded center well instead of expanding into HUD rails', () => {
  const css = read('src/styles/arcade-mobile-maxfit.styl')
  const app = read('src/App.vue')
  assert.match(app, /:class="'game-layout--' \+ mode"/)
  assert.match(app, /@import '\.\/styles\/arcade-mobile-maxfit\.styl'/)
  assert.match(css, /\.board-panel__well\n(?:[^\n]*\n)*?    flex 0 0 auto/)
  assert.match(css, /max-width unquote\('calc\(100% - var\(--mobile-rail\) - var\(--mobile-rail\) - 12px\)'\)/)
  assert.match(css, /--mobile-card-width: var\(--mobile-rail\)/)
  assert.match(css, /--jstet-cell-size unquote\('max\(1px, min\(calc\(\(100cqw - 7px\)/)
  assert.match(css, /calc\(\(100cqh - 7px\) \/ var\(--board-rows, 18\)\)/)
})

test('mode-specific rails enlarge both gameboards while preserving side card space', () => {
  const css = read('src/styles/arcade-mobile-maxfit.styl')
  const original = read('src/styles/arcade-mobile.styl')
  assert.match(css, /--mobile-rail: clamp\(62px, 16vw, 130px\)/)
  assert.match(css, /\.game-layout--classic\n[\s\S]*?--mobile-rail: clamp\(53px, 13\.8vw, 110px\)/)
  assert.match(original, /--mobile-rail: clamp\(64px, 18\.5vw, 148px\)/)

  // CSS border-to-border geometry: the well starts at rail + 6px;
  // each 5px-offset card ends at rail + 5px. No playable cells overlap.
  for (const width of [320, 375, 390, 428, 768]) {
    for (const mode of ['tetcolor', 'classic']) {
      const rail = mode === 'classic'
        ? Math.max(53, Math.min(width * .138, 110))
        : Math.max(62, Math.min(width * .16, 130))
      const reservedWidth = width - 2 * rail - 12
      const wellStart = (width - reservedWidth) / 2
      assert.ok(5 + rail < wellStart, `${mode} ${width}px: metrics overlap board`)
      const [columns, rows] = mode === 'classic' ? [10, 20] : [7, 18]
      const playableCell = Math.min((reservedWidth - 7) / columns, (760 - 7) / rows)
      assert.ok(playableCell >= 1)
      assert.ok(columns * playableCell <= reservedWidth - 7)
      assert.ok(rows * playableCell <= 760 - 7)
    }
  }
})

test('arrow controls use large thick-stroke SVGs in left/right order', () => {
  const touch = read('src/components/TouchControls.vue')
  const css = read('src/styles/arcade-mobile-maxfit.styl')
  const left = touch.split('class="touch-pad__left"')[1].split('class="touch-pad__right"')[0]
  const right = touch.split('class="touch-pad__right"')[1].split('</section>')[0]
  assert.match(left, /v-for="control in moveControls"/)
  assert.match(left, /stroke-width="3\.4"/)
  assert.match(left, /<path :d="control\.path"/)
  assert.match(touch, /M27 16H5 M13 8l-8 8 8 8/)
  assert.match(touch, /M5 16h22 M19 8l8 8-8 8/)
  assert.ok(right.indexOf("onPointerDown($event, 'drop')") < right.indexOf("onPointerDown($event, 'rotate')"))
  assert.match(css, /\.touch-pad__arrow\n    width clamp\(29px, 6\.5vw, 39px\)/)
  for (const action of ['left', 'right', 'drop', 'rotate']) {
    assert.ok(touch.includes(action))
  }
  assert.match(touch, /@pointercancel="onPointerCancel"/)
  assert.match(touch, /@lostpointercapture="onPointerCancel"/)
})

test('mobile visuals retain the glowing playfield, distinct controls and bonus', () => {
  const css = read('src/styles/arcade-mobile-maxfit.styl')
  const rails = read('src/styles/arcade-rails.styl')
  assert.match(css, /background radial-gradient\(ellipse at 50% 43%/)
  assert.match(css, /\.touch-pad__key:active:not\(:disabled\)/)
  assert.match(css, /\.touch-pad__key\n    display grid/)
  assert.match(rails, /\.right-column \.game-hud \.hud-stat--bonus/)
  assert.match(css, /\.right-column \.game-hud \.hud-stat--bonus\n    right 5px\n    bottom 5px/)
})
