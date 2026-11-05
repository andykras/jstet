import test from 'node:test'
import assert from 'node:assert/strict'
import store from '../../src/store.js'
import { gameBus } from '../../src/utils/gameBus.js'

test('Vuex 4 store accepts mutations', () => {
  store.commit('setScore', 42)
  store.commit('setLevel', 2)
  assert.equal(store.state.score, 42)
  assert.equal(store.state.level, 2)
})

test('game event bus delivers and removes listeners', () => {
  const received = []
  const listener = value => received.push(value)
  gameBus.on('score', listener)
  gameBus.emit('score', 10)
  gameBus.off('score', listener)
  gameBus.emit('score', 20)
  assert.deepEqual(received, [10])
})
