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
  assert.match(app, /if \(!this\.autoPaused \|\| this\.settingsOpen \|\| this\.leaderboardOpen \|\| this\.status !== 'paused'\) return\n      this\.autoPaused = false\n      gameBus\.emit\('pause'\)/)
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
  assert.ok(app.includes("components: { GameHud, NextPiece, CityscapeArt, TouchControls, MobileTouchSurface, Leaderboard }"))
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
    'Animate line clears (A)', 'Soft drop (S)', '@click="restartFromControls"',
    'this.isLabControl(e.target)', 'this.cells = emptyCells()']) {
    assert.ok(legacy.includes(token), token)
  }
  assert.ok(legacy.includes("if (e.key == 'a') this.linesAnimated = !this.linesAnimated"))
  assert.ok(legacy.includes("if (e.key == 's') this.dropSoft = !this.dropSoft"))
})

test('Legacy skins 1–3 use monochrome cells; skin 4 retains original colors', () => {
  const legacy = read('src/components/stakan.vue')
  assert.ok(legacy.includes("'legacy-screen--colors': theme === 4"))
  assert.ok(legacy.includes("'legacy-screen--text': theme === 3"))
  assert.ok(legacy.includes('.legacy-screen:not(.legacy-screen--colors)'))
  for (const token of ['&.N1,', '&.N2,', '&.N3,', '&.N4,', '&.N5,', '&.N6,', '&.N7',
    'background-color #aebece', 'color #202020', 'background-color #f7f7f7',
    '.legacy-screen.legacy-screen--text', 'background-color transparent',
    'color #f3f0fa']) {
    assert.ok(legacy.includes(token), token)
  }
  assert.ok(legacy.includes('if (p >= 1 && p <= 4)'))
  assert.ok(legacy.includes('background-color: #8cff8c'))
  assert.ok(legacy.includes('background-color: #4ff6ff'))
  // The old inline debug/status block and duplicate GitHub link overlapped the well.
  for (const removed of ['animated: {{', 'drop soft: {{', 'theme: {{', 'class="github"',
    'github.com/andykras/jstet']) {
    assert.equal(legacy.includes(removed), false, removed)
  }
  assert.ok(legacy.includes('Animate line clears (A)'))
  assert.ok(legacy.includes('Soft drop (S)'))
})

test('Legacy playfield retains arrow keys after entering the mode or changing options', () => {
  const legacy = read('src/components/stakan.vue')
  assert.match(legacy, /ref="gameField"[^>]*tabindex="0"/)
  assert.ok(legacy.includes('this.focusGameField()'))
  assert.ok(legacy.includes("this.$refs.gameField?.focus({ preventScroll: true })"))
  assert.equal((legacy.match(/@change="focusGameField"/g) || []).length, 3)
  assert.ok(legacy.includes('@click="restartFromControls"'))
  assert.ok(legacy.includes('restartFromControls()'))
  // Keep native Select and checkbox keyboard controls when they own focus.
  assert.ok(legacy.includes('shouldIgnoreGameInput(e.target) || this.isLabControl(e.target)'))
  assert.ok(legacy.includes('&:focus-visible'))
  assert.ok(legacy.includes('outline-offset 4px'))
})

test('Legacy next piece is centered within a transparent fixed 4x4 preview', () => {
  const legacy = read('src/components/stakan.vue')
  for (const token of ['v-for="(row, y) in nextPreview"', 'v-for="(cell, x) in row"',
    'value: this.getPiece(this.nextTet, sourceX, sourceY, 0) || 0',
    'Array.from({ length: 4 }, (_, y)', 'Array.from({ length: 4 }, (_, x)',
    'getSymbol(cell.sourceX, cell.sourceY, nextTet, 0)',
    '.main .next .row > div.N0', 'background-color transparent']) {
    assert.ok(legacy.includes(token), token)
  }
  assert.equal(legacy.includes('v-for="y in getSize(nextTet)"'), false)
})

test('Legacy well sizes to viewport without an inner scrollbar or phantom overlay row', () => {
  const legacy = read('src/components/stakan.vue')
  const shell = read('src/styles/arcade-shell.styl')
  const stage5 = read('src/styles/arcade-stage5.styl')
  for (const token of ['--legacy-cell-size', '100dvh', '100vw',
    'stakan stakan--board', 'position absolute', 'flex 0 0 var(--legacy-cell-size)']) {
    assert.ok(legacy.includes(token), token)
  }
  assert.match(shell, /\.lab-layout\n  \/\/ Legacy uses natural page flow[^\n]*\n  overflow visible/)
  assert.match(stage5, /\.lab-layout\n  max-width 100%\n  overflow visible/)
  assert.equal(stage5.includes('overflow-x auto'), false)
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
