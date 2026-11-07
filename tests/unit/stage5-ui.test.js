import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('touch controls use only the existing game command bus', () => {
  const pad = read('src/components/TouchControls.vue')
  const app = read('src/App.vue')
  for (const token of ["action: 'left'", "action: 'right'", "action: 'rotate'", "action: 'down'",
    "gameBus.emit('drop', this.hard)", "createTouchInput(command => gameBus.emit(command))",
    '@pointerdown=', '@pointerup=', '@pointercancel=', '@lostpointercapture=']) {
    assert.ok(pad.includes(token), token)
  }
  assert.ok(app.includes('<TouchControls :status="status"'))
  assert.ok(app.includes(':hard="hard"'))
  assert.ok(app.includes("components: { GameHud, NextPiece, CityscapeArt, TouchControls }"))
})

test('touch ownership is released on pause, hidden page, blur and unmount', () => {
  const pad = read('src/components/TouchControls.vue')
  for (const token of ["return this.status === 'running'", 'if (!value) this.releaseAll()',
    "window.addEventListener('blur'", "document.addEventListener('visibilitychange'",
    "window.removeEventListener('blur'", "document.removeEventListener('visibilitychange'",
    'beforeUnmount()', 'this.input.cancelAll()', 'setPointerCapture']) {
    assert.ok(pad.includes(token), token)
  }
})

test('keyboard activation of touch buttons does not double fire Space', () => {
  const pad = read('src/components/TouchControls.vue')
  const app = read('src/App.vue')
  assert.ok(pad.includes('event.detail !== 0'))
  assert.ok(pad.includes("aria-label=\"Touch game controls\""))
  assert.ok(app.includes("e.target.closest('.touch-pad')"))
  assert.ok(app.includes("e.code === 'Space' || e.code === 'Enter'"))
})

test('Legacy Lab retains all four skins and live animation/drop options', () => {
  const legacy = read('src/components/stakan.vue')
  for (const token of ['v-model.number="theme"', '1 · Symbols', '2 · ASCII',
    '3 · Text', '4 · Colors', 'v-model="linesAnimated"', 'v-model="dropSoft"',
    'Animate line clears (A)', 'Soft drop (S)', '@click="newGame"',
    'this.isLabControl(e.target)', 'this.cells = emptyCells()']) {
    assert.ok(legacy.includes(token), token)
  }
  assert.ok(legacy.includes("if (e.key == 'a') this.linesAnimated = !this.linesAnimated"))
  assert.ok(legacy.includes("if (e.key == 's') this.dropSoft = !this.dropSoft"))
})

test('touch layout remains accessible in portrait and short landscape', () => {
  const base = read('src/styles/arcade-stage5.styl')
  const responsive = read('src/styles/arcade-responsive.styl')
  const app = read('src/App.vue')
  for (const token of ['touch-action none', '.touch-pad__directions', '.touch-pad__drop']) {
    assert.ok(base.includes(token), token)
  }
  for (const token of ["'dashboard preview' 'board board' 'touch touch'",
    "'board dashboard' 'board touch'", 'position sticky', '@media (max-width: 920px)',
    'max-height: 520px', 'orientation: landscape', 'env(safe-area-inset-bottom)']) {
    assert.ok(responsive.includes(token), token)
  }
  assert.ok(app.includes("@import './styles/arcade-responsive.styl'"))
})
