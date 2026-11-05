import test from 'node:test'
import assert from 'node:assert/strict'

import Piece from '../../src/utils/piece.js'
import Stakan from '../../src/utils/stakan.js'

test('piece exposes its size and quarter-turn rotations', () => {
  const piece = new Piece([[0, 1, 0], [0, 1, 0], [0, 1, 0]], 4)
  assert.equal(piece.size, 3)
  assert.equal(piece.get(1, 0, 0), 1)
  assert.equal(piece.get(0, 1, 1), 1)
  assert.equal(piece.get(2, 1, 1), 1)
  assert.equal(piece.get(0, 0, 1), 0)
})

test('new well has boundaries, empty cells and hidden rows', () => {
  const cells = new Stakan(19, 9, 4)
  assert.equal(cells.height, 19)
  assert.equal(cells.width, 9)
  assert.equal(cells.length, 23)
  assert.equal(cells[0][4], -1)
  assert.equal(cells[1][0], -1)
  assert.equal(cells[1][8], -1)
  assert.equal(cells[1][1], 0)
})
