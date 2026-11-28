import test from 'node:test'
import assert from 'node:assert/strict'
import store from '../../src/store.js'
import Stakan from '../../src/utils/stakan.js'
import Piece from '../../src/utils/piece.js'
import { put } from '../../src/game/put.js'
import { getThreeBlock, removeThreeBlock, removeThreeBlockSorted, resetThreeBlocks } from '../../src/game/tetcolor.js'

const board = () => {
  const cells = new Stakan(19, 9, 4)
  store.commit('setCells', cells)
  store.commit('setPieceState', null)
  resetThreeBlocks()
  return cells
}

test('a top-edge match stays colored in the well but renders as pending, then clears completely', () => {
  const cells = board()
  cells[2][4] = 1
  cells[14][4] = 2
  for (const y of [16, 17, 18]) cells[y][4] = 6

  const pending = getThreeBlock()
  assert.equal(pending.size, 3)
  assert.deepEqual([cells[16][4], cells[17][4], cells[18][4]], [6, 6, 6])
  assert.equal(store.state.pendingClears.size, 3)
  assert.equal(store.getters.getWellValue(5, 19), -2)

  assert.equal(removeThreeBlock(), 3)
  assert.deepEqual([cells[2][4], cells[14][4]], [1, 2])
  assert.deepEqual([cells[16][4], cells[17][4], cells[18][4]], [0, 0, 0])
  assert.equal(store.state.pendingClears.size, 0)
  assert.equal(store.getters.getWellValue(5, 19), 0)
})

test('two quick locks can enqueue independent matches before one ALL CLEAR resolution', () => {
  const cells = board()
  for (const y of [3, 4, 5]) cells[y][2] = 3
  const first = getThreeBlock()
  assert.equal(first.size, 3)

  for (const y of [8, 9, 10]) cells[y][5] = 4
  const second = getThreeBlock()
  assert.equal(second, first)
  assert.equal(second.size, 6)
  assert.equal(store.state.pendingClears.size, 6)
  assert.equal(getThreeBlock().size, 6)

  assert.equal(removeThreeBlock(), 6)
  assert.equal(store.state.pendingClears.size, 0)
  for (const y of [3, 4, 5]) assert.equal(cells[y][2], 0)
  for (const y of [8, 9, 10]) assert.equal(cells[y][5], 0)
})

test('a completed clear can produce a new cascade from settling survivors', () => {
  const cells = board()
  for (const x of [3, 4, 5]) cells[3][x] = 6
  for (const y of [2, 4, 5]) cells[y][4] = 4

  assert.equal(getThreeBlock().size, 3)
  assert.equal(removeThreeBlock(), 3)
  assert.deepEqual([cells[2][4], cells[3][4], cells[4][4]], [4, 4, 4])

  assert.equal(getThreeBlock().size, 3)
  assert.equal(removeThreeBlock(), 3)
  assert.equal(store.state.pendingClears.size, 0)
  assert.deepEqual([cells[2][4], cells[3][4], cells[4][4]], [0, 0, 0])
})

test('a fresh match cannot reuse already pending cells', () => {
  const cells = board()
  for (const x of [2, 3, 4]) cells[5][x] = 3
  assert.equal(getThreeBlock().size, 3)
  cells[5][5] = 3

  assert.equal(getThreeBlock().size, 3)
  assert.equal(store.state.pendingClears.has(5 * cells.height + 5), false)
  assert.equal(cells[5][5], 3)
})

test('overlapping horizontal and vertical matches are collected in one detection', () => {
  const cells = board()
  for (const x of [3, 4, 5]) cells[6][x] = 3
  for (const y of [5, 6, 7]) cells[y][4] = 3

  assert.equal(getThreeBlock().size, 5)
  assert.equal(removeThreeBlock(), 5)
  assert.equal(store.state.pendingClears.size, 0)
})

test('STEP CLEAR removes the highest pending cell first and updates its visual state', () => {
  const cells = board()
  for (const y of [16, 17, 18]) cells[y][4] = 5
  const pending = getThreeBlock()
  assert.equal(pending.size, 3)

  removeThreeBlockSorted()
  assert.equal(cells[18][4], 0)
  assert.equal(store.state.pendingClears.size, 2)
  assert.equal(store.getters.getWellValue(5, 19), 0)

  removeThreeBlockSorted()
  removeThreeBlockSorted()
  assert.equal(store.state.pendingClears.size, 0)
  assert.deepEqual([cells[16][4], cells[17][4], cells[18][4]], [0, 0, 0])
})

test('a new run discards pending cells from the old run', () => {
  const cells = board()
  for (const y of [6, 7, 8]) cells[y][3] = 4
  assert.equal(getThreeBlock().size, 3)
  resetThreeBlocks()

  assert.equal(store.state.pendingClears.size, 0)
  assert.equal(store.getters.getWellValue(4, 8), 4)
})

test('put rejects collisions and top overflow without partial writes', () => {
  const cells = board()
  store.commit('setPieces', [new Piece([[1, 0, 0], [1, 0, 0], [0, 0, 0]], 4)])

  assert.equal(put({ X: 4, Y: 18, R: 0, T: 0 }), false)
  assert.equal(cells[18][4], 0)

  cells[5][4] = 5
  assert.equal(put({ X: 4, Y: 4, R: 0, T: 0 }), false)
  assert.equal(cells[4][4], 0)
  assert.equal(cells[5][4], 5)

  assert.equal(put({ X: 4, Y: 7, R: 0, T: 0 }), true)
  assert.equal(cells[7][4], 1)
  assert.equal(cells[8][4], 1)
})
