import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import Piece from '../../src/utils/piece.js'
import { getPieceFxCells } from '../../src/utils/visualFx.js'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('FX snapshots use visible cells and do not retain mutable piece data', () => {
  const piece = Piece([[1, 2], [3, 4]], 4)
  const item = { T: 0, X: 2, Y: 16, R: 0 }
  const cells = getPieceFxCells(item, [piece], { width: 9, height: 19 })
  assert.deepEqual(cells, [
    { column: 1, row: 2, color: 1 },
    { column: 2, row: 2, color: 2 },
    { column: 1, row: 1, color: 3 },
    { column: 2, row: 1, color: 4 }
  ])
  assert.equal(Object.isFrozen(cells), true)
  assert.ok(cells.every(Object.isFrozen))
  piece[0][0] = 6
  assert.equal(cells[0].color, 1)
})

test('FX snapshots exclude walls, hidden rows and invalid pieces', () => {
  const pieces = [Piece([[1, 2], [3, 4]], 4)]
  const dimensions = { width: 9, height: 19 }
  assert.deepEqual(getPieceFxCells({ T: 0, X: 0, Y: 18, R: 0 }, pieces, dimensions),
    [{ column: 0, row: 0, color: 2 }])
  assert.deepEqual(getPieceFxCells({ T: 0, X: 1, Y: 20, R: 0 }, pieces, dimensions), [])
  assert.deepEqual(getPieceFxCells(null, pieces, dimensions), [])
  assert.deepEqual(getPieceFxCells({ T: 2, X: 1, Y: 1, R: 0 }, pieces, dimensions), [])
  assert.deepEqual(getPieceFxCells({ T: 0, X: 1, Y: 1, R: 0 }, pieces, null), [])
})

test('FX snapshot coordinates remain correct after rotation and for Classic', () => {
  const pieces = [Piece([[1, 2], [3, 4]], 4)]
  const cells = getPieceFxCells({ T: 0, X: 1, Y: 19, R: 1 }, pieces, { width: 12, height: 21 })
  assert.deepEqual(cells, [
    { column: 0, row: 1, color: 2 },
    { column: 1, row: 1, color: 4 },
    { column: 0, row: 0, color: 1 },
    { column: 1, row: 0, color: 3 }
  ])
})

test('engine publishes FX only on accepted gameplay movements and actual locks', () => {
  const engine = read('src/utils/game.js')
  assert.match(engine, /if \(\$bus\?\.all\.get\(type\)\?\.size\) \$bus\.emit\(type, makePayload\(\)\)/)
  assert.match(engine, /const accepted = set\(X, Y, R\)/)
  assert.match(engine, /if \(accepted && action !== 'gravity' &&/)
  assert.match(engine, /emitFx\('fx:move',/)
  assert.match(engine, /if \(!accepted && Y < item\.Y\)/)
  assert.match(engine, /if \(put\(item\)\) \{\s+emitFx\('fx:lock',/)
  assert.match(engine, /const distance = start\.Y - item\.Y/)
  assert.match(engine, /if \(distance > 0\) \{\s+emitFx\('fx:hard-drop',/)
  assert.match(engine, /hardDropPending = false/)
  assert.equal(engine.split("$bus.emit('sound:drop')").length - 1, 1)
})

test('FX overlay is optional, bounded and cleans up on all relevant lifecycles', () => {
  const board = read('src/components/themes/tetcolor.vue')
  const app = read('src/App.vue')
  const overlay = read('src/components/VisualFxOverlay.vue')
  assert.match(board, /<VisualFxOverlay v-if="visualFx"/)
  assert.match(board, /:reduced-motion="reducedMotion"/)
  assert.match(app, /:reduced-motion="preferences\.reducedMotion"/)
  assert.match(overlay, /const MAX_EFFECTS = 24/)
  assert.match(overlay, /\['fx:move', payload => this\.onMove\(payload\)\]/)
  assert.match(overlay, /\['fx:hard-drop', payload => this\.onDrop\(payload\)\]/)
  assert.match(overlay, /\['fx:lock', payload => this\.onLock\(payload\)\]/)
  assert.match(overlay, /\['start', \(\) => this\.clear\(\)\]/)
  assert.match(overlay, /status !== 'running'\) this\.clear\(\)/)
  assert.match(overlay, /document\.hidden/)
  assert.match(overlay, /window\.addEventListener\('blur', this\.clear\)/)
  assert.match(overlay, /window\.addEventListener\('resize', this\.clear\)/)
  assert.match(overlay, /beforeUnmount\(\)/)
  assert.match(overlay, /clearTimeout\(timer\)/)
  assert.match(overlay, /gameBus\.off\(type, handler\)/)
  assert.match(overlay, /this\.reducedMotion \|\| this\.osReducedMotion/)
})

test('motion/impact styling is opt-in, transparent to touch, and respects both motion settings', () => {
  const fx = read('src/styles/tetcolor-motion-fx.styl')
  const app = read('src/App.vue')
  assert.match(fx, /\.jstet-app\.fx-enabled \.tetcolor-board/)
  assert.match(fx, /\.jstet-app\.fx-enabled \.tetcolor-fx-layer/)
  assert.match(fx, /pointer-events none/)
  for (const name of ['--move', '--drop', '--lock', '--hard-lock']) {
    assert.ok(fx.includes('.tetcolor-fx-cell' + name), name)
  }
  for (const name of ['fx-piece-trace', 'fx-drop-trace', 'fx-lock-flash', 'fx-impact-ring']) {
    assert.ok(fx.includes('@keyframes ' + name), name)
  }
  assert.match(fx, /\.jstet-app\.fx-enabled\.reduce-motion \.tetcolor-fx-layer/)
  assert.match(fx, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(app, /@import '\.\/styles\/tetcolor-motion-fx\.styl'/)
})
