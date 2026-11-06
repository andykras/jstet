import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { attachSounds } from '../../src/utils/sounds.js'
import { normalizePreferences } from '../../src/utils/preferences.js'

const fixture = (enabled = true) => {
  const bus = new EventEmitter()
  const audios = []
  const createAudio = src => {
    const audio = {
      src,
      paused: true,
      plays: 0,
      pauses: 0,
      currentTime: 0,
      play() {
        this.plays++
        this.paused = false
        return Promise.resolve()
      },
      pause() {
        this.pauses++
        this.paused = true
      }
    }
    audios.push(audio)
    return audio
  }
  const sounds = attachSounds(bus, { enabled, basePath: '/arcade/', createAudio })
  const clips = name => audios.filter(audio => audio.src.endsWith('/' + name + '.mp3'))
  const count = name => clips(name).reduce((total, audio) => total + audio.plays, 0)
  return { bus, audios, sounds, clips, count }
}

test('audio tracks game status and plays input, lock and match cues', () => {
  const { bus, sounds, clips, count } = fixture()
  assert.equal(clips('buzz')[0].src, '/arcade/sounds/buzz.mp3')
  assert.equal(clips('buzz')[0].loop, true)
  bus.emit('left:start')
  assert.equal(count('click'), 0)

  bus.emit('status', 'running')
  assert.equal(count('buzz'), 1)
  bus.emit('left:start')
  bus.emit('right:start')
  bus.emit('drop', true)
  bus.emit('sound:drop')
  bus.emit('sound:clear')

  assert.equal(count('click'), 3)
  assert.equal(count('drop'), 1)
  assert.equal(count('line2'), 1)
  bus.emit('status', 'paused')
  assert.ok(clips('buzz')[0].paused)
  bus.emit('rotate:start')
  assert.equal(count('click'), 3)

  bus.emit('status', 'running')
  assert.equal(count('buzz'), 2)
  sounds.dispose()
  for (const type of ['status', 'left:start', 'sound:drop', 'sound:clear']) assert.equal(bus.listenerCount(type), 0)
  assert.ok(clips('buzz')[0].paused)
})

test('sound preference mutes and unmutes both ambient and effects', () => {
  const { bus, sounds, clips, count } = fixture(false)
  bus.emit('status', 'running')
  bus.emit('down:start')
  assert.equal(count('buzz'), 0)
  assert.equal(count('click'), 0)

  sounds.setEnabled(true)
  assert.equal(count('buzz'), 1)
  bus.emit('down:start')
  assert.equal(count('click'), 1)
  sounds.setEnabled(false)
  assert.ok(clips('buzz')[0].paused)
  bus.emit('sound:clear')
  assert.equal(count('line2'), 0)
  sounds.dispose()
})

test('sound preference defaults to enabled for older saved settings', () => {
  assert.equal(normalizePreferences(null).soundEnabled, true)
  assert.equal(normalizePreferences({ theme: 'prism' }).soundEnabled, true)
  assert.equal(normalizePreferences({ soundEnabled: false }).soundEnabled, false)
})
