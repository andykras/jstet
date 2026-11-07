import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('board geometry tracks the active mode rather than assuming one grid size', () => {
  const app = read('src/App.vue')
  assert.match(app, /:style="boardGeometry"/)
  assert.match(app, /getDimensions/)
  assert.match(app, /'--board-columns': Math\.max\(1, \(width \|\| 9\) - 2\)/)
  assert.match(app, /'--board-rows': Math\.max\(1, \(height \|\| 19\) - 1\)/)
})

test('viewport sizing uses the real board container and preserves square cells', () => {
  const app = read('src/App.vue')
  const styles = read('src/styles/arcade-responsive.styl')
  assert.match(app, /@import '\.\/styles\/arcade-responsive\.styl'/)
  assert.match(styles, /height 100dvh/)
  assert.match(styles, /container-type size/)
  assert.match(styles, /100cqw/)
  assert.match(styles, /100cqh/)
  assert.match(styles, /var\(--board-columns/)
  assert.match(styles, /var\(--board-rows/)
})

test('compact screens keep touch controls and the complete board in the layout', () => {
  const styles = read('src/styles/arcade-responsive.styl')
  assert.match(styles, /@media \(max-width: 920px\)/)
  assert.match(styles, /'dashboard preview' 'board board' 'touch touch'/)
  assert.match(styles, /'board dashboard' 'board touch'/)
  assert.match(styles, /@media \(max-width: 640px\) and \(orientation: portrait\)/)
  assert.match(styles, /@media \(max-width: 920px\) and \(max-height: 520px\) and \(orientation: landscape\)/)
  assert.match(styles, /max-height: 560px/)
  assert.match(styles, /overflow visible/)
  assert.match(styles, /touch-pad__directions/)
})
