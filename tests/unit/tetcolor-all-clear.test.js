import test from 'node:test'
import assert from 'node:assert/strict'
import store from '../../src/store.js'
import Stakan from '../../src/utils/stakan.js'
import { getThreeBlock, removeThreeBlock, resetThreeBlocks } from '../../src/game/tetcolor.js'

const board = () => {
  const cells = new Stakan(19, 9, 4)
  store.commit('setCells', cells)
  resetThreeBlocks()
  return cells
}

const noPendingMarkers = cells => {
  for (let y = 1; y < cells.height; y++) {
    for (let x = 1; x < cells.width - 1; x++) {
      assert.notEqual(cells[y][x], -2, `stale clearing marker at (${x}, ${y})`)
    }
  }
}

test('ALL CLEAR empties vacated top rows after a match that reaches the top of the well', () => {
  const cells = board()
  const x = 4
  cells[2][x] = 1
  cells[14][x] = 2
  for (const y of [16, 17, 18]) cells[y][x] = 6

  const matched = getThreeBlock()
  assert.equal(matched.size, 3)
  assert.equal(cells[16][x], -2)
  assert.equal(cells[17][x], -2)
  // The detector includes the topmost visible row but cannot mark it.
  assert.equal(cells[18][x], 6)

  removeThreeBlock()

  assert.equal(cells[2][x], 1)
  assert.equal(cells[14][x], 2)
  assert.deepEqual([cells[16][x], cells[17][x], cells[18][x]], [0, 0, 0])
  noPendingMarkers(cells)
})

test('ALL CLEAR preserves survivors while clearing vacated cells in multiple columns', () => {
  const cells = board()
  for (const y of [3, 4, 5]) cells[y][2] = 3
  for (const y of [4, 5, 6]) cells[y][6] = 2
  cells[8][2] = 4
  cells[17][2] = 5
  cells[10][6] = 1
  cells[7][4] = 6

  assert.equal(getThreeBlock().size, 6)
  removeThreeBlock()

  assert.equal(cells[5][2], 4)
  assert.equal(cells[14][2], 5)
  assert.equal(cells[7][6], 1)
  assert.equal(cells[7][4], 6)
  assert.deepEqual([cells[16][2], cells[17][2], cells[18][2]], [0, 0, 0])
  noPendingMarkers(cells)
})
