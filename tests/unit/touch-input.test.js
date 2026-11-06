import test from 'node:test'
import assert from 'node:assert/strict'
import { createTouchInput } from '../../src/utils/touchInput.js'

const fixture = () => {
  let time = 0
  let nextId = 0
  const scheduled = new Map()
  const messages = []
  const input = createTouchInput(value => messages.push(value), {
    now: () => time,
    schedule: (fn, delay) => {
      const id = ++nextId
      scheduled.set(id, { fn, at: time + delay })
      return id
    },
    unschedule: id => scheduled.delete(id)
  })
  return {
    input,
    messages,
    pending: scheduled,
    advance(ms) {
      time += ms
      for (const [id, task] of [...scheduled]) {
        if (task.at <= time) {
          scheduled.delete(id)
          task.fn()
        }
      }
    }
  }
}

test('quick touch registers a full direction pulse without a stuck key', () => {
  const t = fixture()
  assert.equal(t.input.press(10, 'left'), true)
  t.advance(5)
  assert.equal(t.input.release(10), true)
  assert.deepEqual(t.messages, ['left:start'])
  t.advance(44)
  assert.deepEqual(t.messages, ['left:start', 'left:stop'])
})

test('long press preserves repeat until release, without a second delayed stop', () => {
  const t = fixture()
  t.input.press(1, 'down')
  t.advance(400)
  t.input.release(1)
  assert.deepEqual(t.messages, ['down:start', 'down:stop'])
  assert.equal(t.pending.size, 0)
})

test('pointer cancellation releases immediately and invalid release is ignored', () => {
  const t = fixture()
  assert.equal(t.input.press(4, 'rotate'), true)
  assert.equal(t.input.press(4, 'right'), false)
  assert.equal(t.input.press(5, 'rotate'), false)
  assert.equal(t.input.release(4, true), true)
  assert.equal(t.input.release(4), false)
  assert.equal(t.input.press(6, 'invalid'), false)
  assert.deepEqual(t.messages, ['rotate:start', 'rotate:stop'])
})

test('a new press cancels an outstanding pulse before starting again', () => {
  const t = fixture()
  t.input.press(1, 'right')
  t.input.release(1)
  assert.equal(t.pending.size, 1)
  t.advance(20)
  t.input.press(2, 'right')
  assert.deepEqual(t.messages, ['right:start', 'right:stop', 'right:start'])
  t.advance(200)
  t.input.release(2)
  assert.deepEqual(t.messages, ['right:start', 'right:stop', 'right:start', 'right:stop'])
  assert.equal(t.pending.size, 0)
})

test('cancelAll drops held directions and pending pulses on blur or pause', () => {
  const t = fixture()
  t.input.press(1, 'left')
  t.input.press(2, 'down')
  t.input.release(2)
  t.input.cancelAll()
  t.advance(100)
  assert.deepEqual(t.messages, ['left:start', 'down:start', 'left:stop', 'down:stop'])
  assert.equal(t.pending.size, 0)
})

test('keyboard activation pulses through the same command contract', () => {
  const t = fixture()
  t.input.tap('rotate')
  t.advance(50)
  assert.deepEqual(t.messages, ['rotate:start', 'rotate:stop'])
})
