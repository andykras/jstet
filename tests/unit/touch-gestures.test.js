import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isSwipeDrop, isTap, pickZone } from '../../src/utils/touchGestures.js'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

const board = { left: 100, right: 220, width: 120 }

test('zone selection follows the rendered board edges, inside means rotate', () => {
  assert.equal(pickZone(board, 99), 'left')
  assert.equal(pickZone(board, 221), 'right')
  assert.equal(pickZone(board, 100), 'rotate')
  assert.equal(pickZone(board, 220), 'rotate')
  assert.equal(pickZone(board, 160), 'rotate')
})

test('zone selection rejects unusable board measurements', () => {
  assert.equal(pickZone(null, 50), null)
  assert.equal(pickZone({ left: 10, right: 10, width: 0 }, 50), null)
  assert.equal(pickZone({ left: NaN, right: 20, width: 10 }, 50), null)
})

test('a drop swipe travels 36px down and stays predominantly vertical', () => {
  assert.equal(isSwipeDrop(100, 400, 100, 436), true)
  assert.equal(isSwipeDrop(100, 400, 100, 435), false)
  // Fast flick: only the final pointerup position is known.
  assert.equal(isSwipeDrop(100, 400, 112, 470), true)
  // Diagonal movement is not a drop.
  assert.equal(isSwipeDrop(100, 400, 130, 436), false)
  assert.equal(isSwipeDrop(100, 400, 104, 460), true)
  // Upward or sideways-only motion never drops.
  assert.equal(isSwipeDrop(100, 400, 100, 380), false)
  assert.equal(isSwipeDrop(100, 400, 180, 400), false)
})

test('a tap stays within the tolerance circle of its start', () => {
  assert.equal(isTap(100, 400, 108, 406), true)
  assert.equal(isTap(100, 400, 100, 418), true)
  assert.equal(isTap(100, 400, 100, 419), false)
  assert.equal(isTap(100, 400, 117, 400), true)
  assert.equal(isTap(100, 400, 119, 400), false)
  assert.equal(isTap(100, 400, 114, 411), true)
})

test('the gesture component wires pure recognition to the same bus commands', () => {
  const surface = read('src/components/MobileTouchSurface.vue')
  assert.match(surface, /import \{ isSwipeDrop, isTap, pickZone \} from '@\/utils\/touchGestures\.js'/)
  assert.match(surface, /const action = pickZone\(bounds, event\.clientX\)/)
  assert.match(surface, /if \(!isSwipeDrop\(pointer\.x, pointer\.y, x, y, SWIPE_DISTANCE\)\) return/)
  assert.match(surface, /pointer\.dropped = true\n      gameBus\.emit\('drop', this\.hard\)/)
  assert.match(surface, /this\.input\.tap\('rotate'\)/)
  // A swipe must not rotate: the tap path is skipped once a drop was emitted.
  assert.match(surface, /if \(!pointer\.dropped && isTap\(/)
  // Held directions release on pointerup, cancel, pause, blur and hidden tab.
  assert.match(surface, /this\.input\.release\(event\.pointerId\)/)
  assert.match(surface, /this\.input\.release\(event\.pointerId, true\)/)
  assert.match(surface, /releaseAll\(\) \{\n      this\.pointers\.clear\(\)\n      this\.input\.cancelAll\(\)/)
  for (const token of ["window.addEventListener('blur', this.releaseAll)",
    "document.addEventListener('visibilitychange', this.onVisibilityChange)",
    'enabled(value) {\n      if (!value) this.releaseAll()\n    }']) {
    assert.ok(surface.includes(token), token)
  }
  // Duplicate pointers never double-bind one direction.
  assert.match(surface, /if \(this\.pointers\.has\(event\.pointerId\)\) return/)
  assert.match(surface, /createTouchInput\(command => gameBus\.emit\(command\)\)/)
})

test('touch hints dismiss per action, fade after three actions and replay on demand', () => {
  const surface = read('src/components/MobileTouchSurface.vue')
  assert.match(surface, /showHint\(action\) \{\n      return !this\.hintsDismissed && !this\.hintActions\.includes\(action\)\n    \}/)
  assert.match(surface, /if \(this\.hintInteractions >= 3\) \{\n        this\.hintsDismissed = true\n        persistHintStatus\(true\)/)
  assert.match(surface, /replayHints\(\) \{\n      this\.hintsDismissed = false\n      this\.hintActions = \[\]\n      this\.hintInteractions = 0\n      persistHintStatus\(false\)\n    \}/)
  assert.match(surface, /const HINTS_KEY = 'jstet\.touchHints\.v1'/)
  assert.match(surface, /localStorage\.getItem\(HINTS_KEY\) === 'done'/)
  for (const label of ['← MOVE', 'MOVE →', '↻ TAP', '↓ SWIPE · DROP']) {
    assert.ok(surface.includes(label), label)
  }
  const app = read('src/App.vue')
  assert.match(app, /replayTouchHints\(\) \{\n      if \(this\.\$refs\.mobileTouchSurface\) this\.\$refs\.mobileTouchSurface\.replayHints\(\)\n    \}/)
  assert.match(app, /:disabled="preferences\.touchControlsMode !== 'gestures'"/)
})

test('touch preferences default to gestures plus warp and survive old saves', () => {
  const prefs = read('src/utils/preferences.js')
  assert.match(prefs, /touchControlsMode: 'gestures'/)
  assert.match(prefs, /touchFxEnabled: true/)
  assert.match(prefs, /\['gestures', 'buttons'\]\.includes\(source\.touchControlsMode\)/)
  assert.match(prefs, /touchFxEnabled: typeof source\.touchFxEnabled === 'boolean' \? source\.touchFxEnabled : DEFAULT_PREFERENCES\.touchFxEnabled/)
  const app = read('src/App.vue')
  assert.match(app, /'touch-mode-' \+ preferences\.touchControlsMode/)
  assert.match(app, /<MobileTouchSurface v-if="preferences\.touchControlsMode === 'gestures'"/)
  assert.match(app, /:touch-fx-enabled="preferences\.touchFxEnabled"/)
  assert.match(app, /:reduced-motion="preferences\.reducedMotion" \/>/)
})

test('the button pad stays mounted and is hidden only in gesture mode on mobile', () => {
  const css = read('src/styles/arcade-touch-surface.styl')
  assert.match(css, /\.jstet-app\.touch-mode-gestures \.touch-pad\n    display none/)
  assert.match(css, /\.mobile-touch-surface\n  display none/)
  assert.match(css, /@media \(max-width: 920px\)\n  \.jstet-app\.touch-mode-gestures \.game-layout/)
  assert.match(css, /touch-action none/)
  assert.match(css, /overscroll-behavior contain/)
  // Warp and hint fade respect reduced motion.
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\n  \.mobile-touch-surface__warp\n    animation none\n    opacity 0/)
  assert.match(css, /\.touch-hint-fade-leave-active\n    transition none/)
  const app = read('src/App.vue')
  assert.ok(app.includes("<TouchControls :status=\"status\""))
})
