import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('the playing-field renderer no longer owns HUD or next-piece output', () => {
  const board = read('src/components/themes/tetcolor.vue')
  const hud = read('src/components/GameHud.vue')
  const preview = read('src/components/NextPiece.vue')
  assert.match(board, /getWellValue/)
  assert.doesNotMatch(board, /getNextValue|Score:|Blocks:|Bonus:/)
  assert.match(hud, /mapState/)
  assert.match(hud, /state => state\.score/)
  assert.match(hud, /state => state\.lines/)
  assert.match(preview, /getNextValue/)
})

test('the shell uses functional controls without exposing developer options in the player view', () => {
  const app = read('src/App.vue')
  assert.match(app, /@click="createStakan"/)
  assert.match(app, /@click="togglePause"/)
  assert.match(app, /<tetcolor :visual-fx="preferences\.visualFxEnabled"\s+:reduced-motion="preferences\.reducedMotion" \/>/)
  assert.match(app, /<GameHud /)
  assert.match(app, /<NextPiece /)
  assert.match(app, /requestMode\('legacy'\)/)
  assert.doesNotMatch(app, /<footer class="arcade-footer">/)
  assert.doesNotMatch(app, /{{\s*\$store\.state\.options\s*}}/)
})

test('a discreet build badge shows which commit is deployed', () => {
  const app = read('src/App.vue')
  const config = read('vite.config.mjs')
  assert.match(config, /'import\.meta\.env\.VITE_BUILD_ID': JSON\.stringify\(buildId\)/)
  assert.match(config, /git rev-parse --short HEAD/)
  assert.match(app, /class="build-badge"/)
  assert.match(app, /aria-hidden="true"/)
  assert.match(app, /buildId\(\) \{\n      return import\.meta\.env\.VITE_BUILD_ID \|\| 'dev'\n    \}/)
  assert.match(app, /\.build-badge\n  position fixed/)
  assert.match(app, /pointer-events none/)
})

test('the responsive shell preserves the shared board cell geometry', () => {
  const styles = read('src/styles/arcade-shell.styl')
  const cells = read('src/styles/game-cells.styl')
  assert.match(styles, /@media \(max-width: 920px\)/)
  assert.match(styles, /@media \(max-width: 480px\)/)
  assert.match(styles, /--jstet-cell-size:/)
  assert.match(cells, /width var\(--jstet-cell-size\)/)
  assert.match(cells, /height var\(--jstet-cell-size\)/)
})
