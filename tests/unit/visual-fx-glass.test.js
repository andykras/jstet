import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import Piece from '../../src/utils/piece.js'
import { isActivePieceCell } from '../../src/utils/visualFx.js'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('active FX cells follow the actual piece position, not settled color values', () => {
  const piece = Piece([[1, 0], [2, 3]], 4)
  const pieces = [piece]
  const item = { T: 0, X: 2, Y: 4, R: 0 }
  assert.equal(isActivePieceCell(3, 5, pieces, item), true)
  assert.equal(isActivePieceCell(4, 5, pieces, item), false)
  assert.equal(isActivePieceCell(3, 6, pieces, item), true)
  assert.equal(isActivePieceCell(4, 6, pieces, item), true)
  // A settled block of color 1 elsewhere is not part of the live piece.
  assert.equal(isActivePieceCell(7, 5, pieces, item), false)
  assert.equal(isActivePieceCell(3, 5, pieces, null), false)
  assert.equal(isActivePieceCell(3, 5, null, item), false)
})

test('active FX cells follow rotation and displacement without relying on input events', () => {
  const pieces = [Piece([[1, 0], [2, 3]], 4)]
  const base = { T: 0, X: 2, Y: 4, R: 1 }
  assert.equal(isActivePieceCell(3, 5, pieces, base), false)
  assert.equal(isActivePieceCell(4, 5, pieces, base), true)
  assert.equal(isActivePieceCell(3, 6, pieces, base), true)
  assert.equal(isActivePieceCell(4, 6, pieces, base), true)
  assert.equal(isActivePieceCell(4, 5, pieces, { ...base, X: 3 }), false)
  assert.equal(isActivePieceCell(5, 5, pieces, { ...base, X: 3 }), true)
})

test('glass cell styling is scoped behind opt-in and reuses live palette tokens', () => {
  const fx = read('src/styles/tetcolor-visual-fx.styl')
  const app = read('src/App.vue')
  const baseline = read('src/styles/game-cells.styl')
  const shell = read('src/styles/arcade-shell.styl')

  assert.match(fx, /\.jstet-app\.fx-enabled/)
  assert.match(fx, /\.game-cell\.item:not\(\.N-2\):not\(\.N-1\)/)
  for (let n = 1; n <= 7; n++) {
    assert.ok(fx.includes(`--fx-block-color var(--cell-${n},`), `cell-${n} palette token`)
    assert.ok(shell.includes(`--cell-${n}:`), `cell-${n} existing token`)
  }
  assert.match(fx, /\.next-piece \.game-cell\.item::after/)
  assert.match(fx, /\.tetcolor-board \.game-cell\.fx-active/)
  assert.match(fx, /\.jstet-app\.fx-enabled\.is-running/)
  assert.match(fx, /\.jstet-app\.fx-enabled\.reduce-motion/)
  assert.match(fx, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(app, /'fx-enabled': preferences\.visualFxEnabled && !naiveImplementation/)
  assert.match(app, /'is-running': status === 'running' && !naiveImplementation/)
  assert.match(app, /<tetcolor :visual-fx="preferences\.visualFxEnabled" \/>/)
  assert.match(app, /@import '\.\/styles\/tetcolor-visual-fx\.styl'/)
  assert.match(baseline, /\.game-cell\n/)
  assert.doesNotMatch(baseline, /fx-active|fx-enabled|fx-glass/)
})

test('active-cell detection runs only in opted-in renderer and excludes clearing markers', () => {
  const board = read('src/components/themes/tetcolor.vue')
  assert.match(board, /visualFx: \{ type: Boolean, default: false \}/)
  assert.match(board, /this\.visualFx && val > 0 && isActivePieceCell\(/)
  assert.match(board, /'fx-active':/)
  assert.match(board, /getWellValue\(x, y\)/)
  const next = read('src/components/NextPiece.vue')
  assert.doesNotMatch(next, /fx-active|isActivePieceCell/)
})
