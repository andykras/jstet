import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getPreviewBounds, getPreviewRows } from '../../src/game/preview.js'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
const piece = (...points) => (x, y) => points.some(([px, py]) => px === x && py === y) ? 1 : 0

test('one-block preview crops 3x3 empty margins without shrinking the block', () => {
  const bounds = getPreviewBounds(3, piece([2, 2]))
  assert.deepEqual(bounds, { left: 2, right: 2, bottom: 2, top: 2 })
  assert.deepEqual(getPreviewRows(bounds), [{ y: 2, columns: [2] }])
})

test('horizontal three-block preview uses three columns and one row', () => {
  const bounds = getPreviewBounds(3, piece([1, 2], [2, 2], [3, 2]))
  assert.deepEqual(bounds, { left: 1, right: 3, bottom: 2, top: 2 })
  assert.deepEqual(getPreviewRows(bounds), [{ y: 2, columns: [1, 2, 3] }])
})

test('L-shaped piece preserves relative cell coordinates and empty interior gaps', () => {
  const bounds = getPreviewBounds(4, piece([2, 1], [1, 2], [2, 2]))
  assert.deepEqual(bounds, { left: 1, right: 2, bottom: 1, top: 2 })
  assert.deepEqual(getPreviewRows(bounds), [
    { y: 1, columns: [1, 2] },
    { y: 2, columns: [1, 2] }
  ])
})

test('preview is empty before a piece is available', () => {
  assert.equal(getPreviewBounds(3, () => 0), null)
  assert.deepEqual(getPreviewRows(null), [])
})

test('next-piece UI derives crop width from the current piece and keeps board-size cubes', () => {
  const component = read('src/components/NextPiece.vue')
  const rails = read('src/styles/arcade-rails.styl')
  const maxfit = read('src/styles/arcade-mobile-maxfit.styl')
  assert.match(component, /getPreviewBounds\(this.previewSize, this.getNextValue\)/)
  assert.match(component, /getPreviewRows\(this.previewBounds\)/)
  assert.match(component, /'--preview-columns': previewColumns/)
  assert.match(component, /v-for="row in previewRows"/)
  // Preview cubes are exactly the playable board cells on every rail;
  // per-piece rescaling (one huge cube, small triples) is gone.
  assert.match(rails, /--jstet-cell-size: var\(--jstet-preview-cell-size, 30px\)/)
  assert.match(maxfit, /--jstet-cell-size: var\(--jstet-preview-cell-size, 30px\)/)
  assert.doesNotMatch(rails, /var\(--preview-columns, 3\)\)\)'/)
  assert.doesNotMatch(maxfit, /var\(--preview-columns, 3\)\)\)'/)
})
