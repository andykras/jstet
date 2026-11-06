import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { attachGameCommands } from '../../src/utils/gameCommands.js'
import defaults, { resolveRunOptions } from '../../src/game/options.js'

test('run options are validated without changing the defaults', () => {
  assert.deepEqual(resolveRunOptions({ maxLevel: 5, singleBlock: false }), {
    ...defaults,
    maxLevel: 5,
    singleBlock: false
  })
  assert.deepEqual(resolveRunOptions({
    levelTime: 0,
    maxLevel: -1,
    scorePart: -2,
    bonusSize: '10',
    tetcolor: 'no',
    singleBlock: null
  }), defaults)
  assert.equal(defaults.levelTime, 60)
})

test('event binding forwards commands exactly once and detaches cleanly', () => {
  const bus = new EventEmitter()
  const received = []
  const actions = {
    input: value => received.push(['input', value]),
    start: value => received.push(['start', value]),
    pause: () => received.push(['pause']),
    drop: value => received.push(['drop', value]),
    fill: () => received.push(['fill']),
    next: () => received.push(['next'])
  }
  const detach = attachGameCommands(bus, actions)
  bus.emit('left:start')
  bus.emit('left:stop')
  bus.emit('start', { tetcolor: false })
  bus.emit('pause')
  bus.emit('drop', true)
  bus.emit('fill')
  bus.emit('next')
  assert.deepEqual(received, [
    ['input', 'left:start'], ['input', 'left:stop'], ['start', { tetcolor: false }],
    ['pause'], ['drop', true], ['fill'], ['next']
  ])
  detach()
  for (const name of ['left:start', 'left:stop', 'start', 'pause', 'drop', 'fill', 'next']) {
    assert.equal(bus.listenerCount(name), 0)
  }
  bus.emit('start', {})
  assert.equal(received.length, 7)
})

test('repeated mount and teardown do not accumulate bus listeners', () => {
  const bus = new EventEmitter()
  let starts = 0
  const actions = { input() {}, start() { starts++ }, pause() {}, drop() {}, fill() {}, next() {} }
  for (let i = 0; i < 3; i++) {
    const detach = attachGameCommands(bus, actions)
    bus.emit('start', {})
    detach()
    assert.equal(bus.listenerCount('start'), 0)
    assert.equal(bus.listenerCount('right:start'), 0)
  }
  assert.equal(starts, 3)
})
