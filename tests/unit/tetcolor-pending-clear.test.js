import test from 'node:test'
import assert from 'node:assert/strict'

let now = 0
const frames = []
Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true })
globalThis.requestAnimationFrame = fn => frames.push(fn) && frames.length
globalThis.cancelAnimationFrame = id => { delete frames[id - 1] }

const { default: store } = await import('../../src/store.js')
const { gameBus } = await import('../../src/utils/gameBus.js')
const { setup, game } = await import('../../src/utils/game.js')
const { put } = await import('../../src/game/put.js')
const { createGameBoard, createGamePieces } = await import('../../src/game/modes.js')

const board = () => {
  store.commit('setCells', createGameBoard('tetcolor'))
  store.commit('setPieces', createGamePieces('tetcolor'))
  return store.state.cells
}

test('put rejects overflow and overlap without partially writing the piece', () => {
  const cells = board()
  const piece = store.state.pieces[0]
  piece[0] = [1, 0, 0]
  piece[1] = [1, 0, 0]
  piece[2] = [0, 0, 0]

  assert.equal(put({ X: 4, Y: 18, R: 0, T: 0 }), false)
  assert.equal(cells[18][4], 0)

  cells[5][4] = 5
  assert.equal(put({ X: 4, Y: 4, R: 0, T: 0 }), false)
  assert.equal(cells[4][4], 0)
  assert.equal(cells[5][4], 5)
})

test('Hard Drop cannot move a new piece through a pending ALL CLEAR match', () => {
  const cells = board()
  const dispose = setup(gameBus)
  const onUpdate = item => store.commit('setPieceState', item)
  gameBus.on('update', onUpdate)

  const advance = ms => {
    now += ms
    const pending = frames.splice(0)
    for (const frame of pending) if (frame) frame(now)
  }
  const markers = () => cells.flat().filter(cell => cell === -2).length
  const pieceState = () => {
    const { X, Y, R, T, N } = store.state.item
    return { X, Y, R, T, N }
  }

  try {
    gameBus.emit('start', { tetcolor: true, singleBlock: false })
    const piece = store.state.pieces[store.state.item.T]
    piece[0] = [0, 0, 0]
    piece[1] = [6, 6, 6]
    piece[2] = [0, 0, 0]

    gameBus.emit('drop', true)
    for (let n = 0; n < 20 && !markers(); n++) advance(50)
    assert.equal(markers(), 3, 'a match is marked and still pending removal')
    const before = pieceState()
    const beforeCells = cells.map(row => [...row])

    gameBus.emit('drop', true)
    assert.deepEqual(pieceState(), before)
    assert.deepEqual(cells.map(row => [...row]), beforeCells)

    for (let n = 0; n < 20 && markers(); n++) advance(90)
    assert.equal(markers(), 0, 'pending match is removed')
    assert.ok(game.started, 'no premature game over')
  } finally {
    gameBus.off('update', onUpdate)
    dispose()
  }
})
