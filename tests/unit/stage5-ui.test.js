import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('an inactive window pauses the run and returning focus resumes it', () => {
  const app = read('src/App.vue')
  // The blur/hidden pause is automatic and remembers its own origin.
  assert.ok(app.includes("window.addEventListener('blur', this.onFocusLost)"))
  assert.ok(app.includes("window.addEventListener('focus', this.onFocusGain)"))
  assert.ok(app.includes("document.addEventListener('visibilitychange', this.onVisibilityChange)"))
  assert.match(app, /autoPauseForFocus\(\) \{\n      if \(this\.naiveImplementation \|\| this\.status !== 'running'\) return\n      this\.autoPaused = true\n      gameBus\.emit\('pause'\)/)
  assert.match(app, /if \(!this\.autoPaused \|\| this\.settingsOpen \|\| this\.status !== 'paused'\) return\n      this\.autoPaused = false\n      gameBus\.emit\('pause'\)/)
  // Manual pause/resume and a fresh run clear the automatic origin, so focus
  // never resumes a session the player stopped on purpose.
  assert.match(app, /togglePause\(\) \{\n      this\.autoPaused = false\n      gameBus\.emit\('pause'\)/)
  assert.match(app, /this\.autoPaused = false\n      gameBus\.emit\('start', rules\)/)
  assert.match(app, /if \(value === 'gameOver'\) this\.autoPaused = false/)
  for (const token of ["window.removeEventListener('focus', this.onFocusGain)",
    "document.removeEventListener('visibilitychange', this.onVisibilityChange)"]) {
    assert.ok(app.includes(token), token)
  }
})

test('touch controls use only the existing game command bus', () => {
  const pad = read('src/components/TouchControls.vue')
  const app = read('src/App.vue')
  for (const token of ["action: 'left'", "action: 'right'", "onPointerDown($event, 'rotate')",
    "gameBus.emit('drop', this.hard)", "createTouchInput(command => gameBus.emit(command))",
    'touch-pad__left', 'touch-pad__right', 'moveControls',
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
