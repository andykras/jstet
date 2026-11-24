import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('run rules stay in one bottom-anchored group with the transient bonus', () => {
  const hud = read('src/components/GameHud.vue')
  const start = hud.indexOf('class="hud-footer"')
  const end = hud.indexOf('</section>', start)
  assert.ok(start >= 0 && end > start)
  const footer = hud.slice(start, end)
  assert.ok(footer.includes('<Transition name="bonus-hud">'))
  assert.ok(footer.includes('mode === \'tetcolor\' && displayBonus > 0'))
  assert.ok(footer.includes('class="hud-meta"'))
  assert.ok(footer.indexOf('hud-stat--bonus') < footer.indexOf('class="hud-meta"'))

  // Only the optional bonus card disappears; the footer itself stays anchored.
  assert.match(hud, /@media \(min-width: 921px\)[\s\S]*?\.right-column \.game-hud \.hud-footer\n[\s\S]*?margin-top auto/)
  assert.match(hud, /\.right-column \.game-hud \.hud-footer \.hud-stat--bonus\n\s+margin-top 0/)
  assert.match(hud, /\.right-column \.game-hud \.hud-footer \.hud-meta\n\s+margin-top 0/)
  assert.match(hud, /@media \(max-width: 920px\)[\s\S]*?\.right-column \.game-hud \.hud-meta/)
})

test('build ID stays inside the cabinet rather than the viewport border', () => {
  const app = read('src/App.vue')
  const shell = read('src/styles/arcade-shell.styl')
  const marker = app.slice(app.indexOf('.build-badge\n'))
  assert.ok(marker.includes('position absolute'))
  assert.ok(marker.includes('right clamp(20px, 2vw, 30px)'))
  assert.ok(marker.includes('bottom clamp(19px, 1.9vw, 28px)'))
  assert.ok(marker.includes('bottom 64px'))
  assert.ok(marker.includes('right 13px'))
  assert.doesNotMatch(marker, /position fixed/)
  assert.match(shell, /\.arcade-console\n  position relative/)
})

test('portrait bonus is lifted into the visible stage instead of hiding below the viewport', () => {
  const mobile = read('src/styles/arcade-mobile-maxfit.styl')
  const portrait = mobile.slice(mobile.indexOf('@media (max-width: 920px) and (orientation: portrait)'))
  assert.match(portrait, /\.right-column \.game-hud \.hud-stat--bonus\n\s+top auto\n\s+bottom unquote\('clamp\(90px, 14dvh, 170px\)'\)/)
  // Unlike desktop, the phone bonus is independently positioned over the stage.
  const hud = read('src/components/GameHud.vue')
  assert.match(hud, /<div v-if="section !== 'left'"\n\s+class="hud-footer">/)
  assert.match(hud, /@media \(min-width: 921px\)/)
})

test('portrait mobile well gets breathing room above without shifting or clipping the board', () => {
  const mobile = read('src/styles/arcade-mobile-maxfit.styl')
  assert.match(mobile, /@media \(max-width: 920px\) and \(orientation: portrait\)/)
  assert.match(mobile, /\.board-panel__well\n\s+padding-top clamp\(22px, 3\.5dvh, 34px\)\n\s+padding-bottom 0/)
  assert.match(mobile, /height 100%/)
  assert.doesNotMatch(mobile, /\.board-panel__well\n\s+transform translateY/)
})
