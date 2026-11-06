import test from 'node:test'
import assert from 'node:assert/strict'
import { events } from '../../src/utils/events.js'

test('held horizontal input moves immediately and uses first/next repeat delays', () => {
  events.init()
  events.emit('left:start')
  assert.equal(events.left.active(1000), true)
  assert.equal(events.left.active(1299), false)
  assert.equal(events.left.active(1300), true)
  assert.equal(events.left.active(1339), false)
  assert.equal(events.left.active(1340), true)
  events.emit('left:stop')
  assert.equal(events.left.active(1400), false)
})

test('rotation repeats at 120 ms after its initial 300 ms delay', () => {
  events.init()
  events.emit('rotate:start')
  assert.equal(events.rotate.active(1000), true)
  assert.equal(events.rotate.active(1299), false)
  assert.equal(events.rotate.active(1300), true)
  assert.equal(events.rotate.active(1419), false)
  assert.equal(events.rotate.active(1420), true)
  events.emit('rotate:stop')
  assert.equal(events.rotate.active(1540), false)
})

test('down uses 60 ms repeat delay', () => {
  events.init()
  events.emit('down:start')
  assert.equal(events.down.active(1000), true)
  assert.equal(events.down.active(1059), false)
  assert.equal(events.down.active(1060), true)
  assert.equal(events.down.active(1119), false)
  assert.equal(events.down.active(1120), true)
  events.emit('down:stop')
  assert.equal(events.down.active(1200), false)
})

test('releasing an unheld key never arms a phantom repeat', () => {
  events.init()
  events.emit('right:stop')
  assert.equal(events.right.active(1000), false)
  events.emit('right:start')
  assert.equal(events.right.active(1010), true)
  events.emit('right:stop')
  assert.equal(events.right.active(1400), false)
  events.emit('right:start')
  assert.equal(events.right.active(2000), true)
  assert.equal(events.right.active(2299), false)
  assert.equal(events.right.active(2300), true)
})
