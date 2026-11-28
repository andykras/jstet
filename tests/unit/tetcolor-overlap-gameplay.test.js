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
const { createGameBoard, createGamePieces } = await import('../../src/game/modes.js')

const advance = ms => {
  now += ms
  const pending = frames.splice(0)
  for (const frame of pending) if (frame) frame(now)
}

test('ALL CLEAR accepts a moved second Hard Drop before the first match resolves', () => {
  store.commit('setCells', createGameBoard('tetcolor'))
  store.commit('setPieces', createGamePieces('tetcolor'))

  const onUpdate = item => store.commit('setPieceState', item)
  gameBus.on('update', onUpdate)
  const dispose = setup(gameBus)

  try {
    gameBus.emit('start', { tetcolor: true, singleBlock: false })
    for (const [i, color] of [[0, 6], [1, 5], [2, 4], [3, 3]]) {
      const piece = store.state.pieces[i]
      piece[0] = [0, 0, 0]
      piece[1] = [color, color, color]
      piece[2] = [0, 0, 0]
    }

    gameBus.emit('drop', true)
    for (let i = 0; i < 40 && !store.state.pendingClears.size; i++) advance(16)
    assert.equal(store.state.pendingClears.size, 3)
    const previousX = store.state.item.X

    gameBus.emit('left:start')
    advance(16)
    gameBus.emit('left:stop')
    assert.equal(store.state.item.X, previousX - 1)
    assert.equal(store.state.pendingClears.size, 3)

    gameBus.emit('drop', true)
    gameBus.emit('down:start')
    for (let i = 0; i < 5; i++) advance(16)
    gameBus.emit('down:stop')

    assert.equal(store.state.pendingClears.size, 6)
    assert.equal(game.matchStreak, 2)
    assert.ok(game.started)

    for (let i = 0; i < 20 && store.state.pendingClears.size; i++) advance(16)
    assert.equal(store.state.pendingClears.size, 0)
    assert.ok(!store.state.cells.flat().includes(-2))
    assert.ok(game.started)
  } finally {
    gameBus.emit('down:stop')
    gameBus.emit('left:stop')
    dispose()
    gameBus.off('update', onUpdate)
  }
})
