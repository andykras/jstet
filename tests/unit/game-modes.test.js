import test from 'node:test'
import assert from 'node:assert/strict'
import store from '../../src/store.js'
import { createGameBoard, createGamePieces, isGameMode } from '../../src/game/modes.js'
import { getSolidLines, clearAllLines, clearOneLine, resetSolidLines } from '../../src/game/tetris.js'
import { loadPreferences, savePreferences, normalizePreferences, DEFAULT_PREFERENCES } from '../../src/utils/preferences.js'

const countCells = piece => piece.reduce((sum, row) => sum + row.filter(cell => cell > 0).length, 0)
const fillRow = (cells, y, value = 1) => {
  for (let x = 1; x < cells.width - 1; x++) cells[y][x] = value
}

test('TetColor retains four original pieces and 7×18 playfield', () => {
  assert.equal(isGameMode('tetcolor'), true)
  assert.equal(isGameMode('unrecognized'), false)
  const pieces = createGamePieces('tetcolor')
  assert.deepEqual(pieces.map(countCells), [3, 2, 1, 3])
  const board = createGameBoard('tetcolor')
  assert.deepEqual([board.height, board.width], [19, 9])
  assert.equal(board.length, 23)
})

test('Classic exposes seven four-block pieces and 10×20 playfield', () => {
  const pieces = createGamePieces('classic')
  assert.equal(pieces.length, 7)
  assert.deepEqual(pieces.map(countCells), [4, 4, 4, 4, 4, 4, 4])
  assert.equal(pieces[0].size, 4)
  assert.equal(pieces[3].size, 2)
  assert.equal(pieces[6].size, 3)
  const board = createGameBoard('classic')
  assert.deepEqual([board.height, board.width, board.length], [21, 12, 25])
  assert.equal(board[0][5], -1)
  assert.equal(board[1][1], 0)
  assert.throws(() => createGameBoard('unknown'), RangeError)
})

test('Classic single-line clearing shifts the board and empties the highest row', () => {
  const cells = createGameBoard('classic')
  const pieces = createGamePieces('classic')
  store.commit('setCells', cells)
  store.commit('setPieces', pieces)
  resetSolidLines()
  fillRow(cells, 1, 2)
  cells[cells.height - 1][1] = 7
  const pending = getSolidLines({ asc: true, item: { Y: 1, T: 3 } })
  assert.equal(pending.length, 1)
  assert.equal(clearOneLine(), 1)
  assert.equal(cells[1][1], 0)
  assert.equal(cells[cells.height - 1][1], 0)
})

test('Classic simultaneous line clear removes two filled rows', () => {
  const cells = createGameBoard('classic')
  store.commit('setCells', cells)
  store.commit('setPieces', createGamePieces('classic'))
  resetSolidLines()
  fillRow(cells, 1, 4)
  fillRow(cells, 2, 5)
  const pending = getSolidLines({ asc: false, item: { Y: 1, T: 0 } })
  assert.equal(pending.length, 2)
  assert.equal(clearAllLines(), 2)
  assert.equal(cells[1][1], 0)
  assert.equal(cells[2][1], 0)
})

test('only supported visual preferences are saved and loaded', () => {
  let raw = ''
  const storage = { getItem: () => raw, setItem: (_, value) => { raw = value } }
  const value = { theme: 'prism', reducedMotion: true, showHelp: false, hardDrop: true, injection: 17 }
  assert.equal(savePreferences(value, storage), true)
  assert.deepEqual(loadPreferences(storage), normalizePreferences(value))
  assert.equal(loadPreferences(storage).injection, undefined)
  assert.equal(JSON.parse(raw).version, 1)
})

test('obsolete or malformed preferences fail closed to defaults', () => {
  const storage = { getItem: () => '{broken json', setItem: () => { throw new Error('quota') } }
  assert.deepEqual(loadPreferences(storage), DEFAULT_PREFERENCES)
  assert.equal(savePreferences({}, storage), false)
  assert.deepEqual(normalizePreferences({ theme: 'invalid', hardDrop: 'yes', showHelp: 0 }), DEFAULT_PREFERENCES)
})
