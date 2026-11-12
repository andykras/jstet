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
  assert.match(surface, /const zone = pickZone\(bounds, event\.clientX\)/)
  // Touches stay undecided on pointerdown; the piece position and cell size are
  // captured so drag targets stay relative to the finger's start.
  assert.match(surface, /const pieceX = this\.\$store\.state\.item\?\.X/)
  assert.match(surface, /const cellWidth = cell\?\.getBoundingClientRect\(\)\.width \|\| bounds\.width \/ columns/)
  assert.match(surface, /gesture: null/)
  // Whole-displacement classification: drop wins first, drag needs a single
  // owner, and horizontal movement is dominant over vertical drift.
  assert.match(surface, /recognizeGesture\(pointer, event\) \{\n      if \(pointer\.gesture === 'drop'\) return/)
  assert.match(surface, /const dropX = pointer\.gesture === 'drag' \? pointer\.dropAnchorX : pointer\.x/)
  assert.match(surface, /if \(isSwipeDrop\(dropX, dropY, event\.clientX, event\.clientY, SWIPE_DISTANCE\)\) \{/)
  assert.match(surface, /const threshold = Math\.max\(8, pointer\.cellWidth \* DRAG_THRESHOLD_RATIO\)/)
  assert.match(surface, /Math\.abs\(dx\) < threshold \|\| Math\.abs\(dx\) < Math\.abs\(dy\) \* 1\.35/)
  assert.match(surface, /if \(this\.dragOwner !== null && this\.dragOwner !== event\.pointerId\) return/)
  assert.match(surface, /pointer\.gesture = 'drag'/)
  assert.match(surface, /if \(pointer\.gesture !== 'drag'\) return/)
  assert.match(surface, /const cells = Math\.sign\(dx\) \* Math\.round\(Math\.abs\(dx\) \/ pointer\.cellWidth\)/)
  assert.match(surface, /gameBus\.emit\('drag:move', pointer\.pieceX \+ cells\)/)
  assert.match(surface, /this\.showWarp\(event, 'swipe'\)/)
  // Fast flicks classify on pointerup; taps land exactly once afterwards.
  assert.match(surface, /\/\/ Fast flicks can arrive only as pointerup without a final move\.\n      this\.recognizeGesture\(pointer, event\)/)
  assert.match(surface, /this\.input\.tap\('rotate'\)/)
  assert.match(surface, /this\.input\.tap\(pointer\.zone\)/)
  // Ownership and holds release everywhere: pointerup, cancel, pause, blur, hidden tab.
  assert.match(surface, /if \(this\.dragOwner === event\.pointerId\) this\.dragOwner = null/)
  assert.match(surface, /releaseAll\(\) \{\n      this\.pointers\.clear\(\)\n      this\.dragOwner = null\n      this\.input\.cancelAll\(\)/)
  for (const token of ["window.addEventListener('blur', this.releaseAll)",
    "document.addEventListener('visibilitychange', this.onVisibilityChange)",
    'enabled(value) {\n      if (!value) this.releaseAll()\n    }']) {
    assert.ok(surface.includes(token), token)
  }
  assert.match(surface, /if \(this\.pointers\.has\(event\.pointerId\)\) return/)
  assert.match(surface, /createTouchInput\(command => gameBus\.emit\(command\)\)/)
  // Warp feedback is short-lived, kind-specific, and freed when replaced by a swipe.
  assert.match(surface, /const WARP_DURATION = Object\.freeze\(\{ tap: 280, swipe: 300 \}\)/)
  assert.match(surface, /this\.showWarp\(event, 'swipe'\)/)
  assert.match(surface, /'mobile-touch-surface__warp--' \+ warp\.kind/)
})

test('the engine resolves drags cell by cell through the shared movement path', () => {
  const engine = read('src/utils/game.js')
  const commands = read('src/utils/gameCommands.js')
  // Drag targets a column and steps one cell at a time through update(), so
  // collisions and piece FX behave exactly like keyboard movement.
  assert.match(engine, /dragMove\(targetX\) \{\n      if \(game\.started && !game\.paused\) moveToColumn\(targetX\)\n    \}/)
  assert.match(engine, /const moveToColumn = targetX => \{/)
  assert.match(engine, /const destination = Math\.max\(0, Math\.min\(\$cells\.width - 1, Math\.trunc\(targetX\)\)\)/)
  assert.match(engine, /update\(before \+ step, item\.Y, item\.R, step > 0 \? 'right' : 'left'\)/)
  assert.match(engine, /if \(item\.X === before\) break \/\/ Wall, settled block or active clearing\./)
  // The command is optional: engines without it keep working unchanged.
  assert.match(commands, /if \(actions\.dragMove\) on\('drag:move', position => actions\.dragMove\(position\)\)/)
})

test('touch hints are preference-driven sessions: per-action dismiss and on-demand replay', () => {
  const surface = read('src/components/MobileTouchSurface.vue')
  // Hints come from App preferences and count real mobile games, not unpauses.
  assert.match(surface, /showHints: \{ type: Boolean, default: true \}/)
  assert.match(surface, /hintGamesSeen: \{ type: Number, default: 0 \}/)
  assert.match(surface, /showHint\(action\) \{\n      return this\.showHints && this\.hintsActive && !this\.hintActions\.includes\(action\)\n    \}/)
  // Each learned gesture dismisses its own hint; all four together close the session.
  assert.match(surface, /learn\(action\) \{\n      if \(!this\.hintsActive \|\| this\.hintActions\.includes\(action\)\) return\n      this\.hintActions\.push\(action\)\n      if \(this\.hintActions\.length === 4\) this\.hintsActive = false\n    \}/)
  // A new run replays hints only while the onboarding window is open.
  assert.match(surface, /reviveHints\(\) \{\n      this\.hintActions = \[\]\n      this\.hintsActive = this\.showHints && this\.isMobileLayout\(\) && this\.hintGamesSeen < 3\n      if \(this\.hintsActive\) this\.\$emit\('hint-game-start'\)\n    \}/)
  assert.match(surface, /gameBus\.on\('start', this\.reviveHints\)/)
  assert.match(surface, /gameBus\.off\('start', this\.reviveHints\)/)
  assert.match(surface, /if \(this\.enabled && this\.isMobileLayout\(\)\) this\.reviveHints\(\)/)
  assert.match(surface, /replayHints\(\) \{\n      if \(!this\.showHints\) return\n      this\.hintsActive = true\n      this\.hintActions = \[\]\n    \}/)
  // The component no longer owns hint persistence: App counts games in preferences.
  assert.doesNotMatch(surface, /localStorage|HINTS_KEY/)
  for (const label of ['SWIPE', 'TAP', 'SWIPE · DROP']) {
    assert.ok(surface.includes(label), label)
  }
  const app = read('src/App.vue')
  assert.match(app, /:show-hints="preferences\.showTouchHints"/)
  assert.match(app, /:hint-games-seen="preferences\.touchHintGamesSeen"/)
  assert.match(app, /@hint-game-start="countTouchHintGame"/)
  assert.match(app, /countTouchHintGame\(\) \{\n      if \(!this\.preferences\.showTouchHints \|\| this\.preferences\.touchHintGamesSeen >= 3\) return\n      this\.preferences\.touchHintGamesSeen\+\+\n      this\.persistPreferences\(\)\n    \}/)
  assert.match(app, /replayTouchHints\(\) \{\n      if \(this\.\$refs\.mobileTouchSurface\) this\.\$refs\.mobileTouchSurface\.replayHints\(\)\n    \}/)
  assert.match(app, /:disabled="preferences\.touchControlsMode !== 'gestures' \|\| !preferences\.showTouchHints"/)
})

test('touch preferences default to gestures plus warp and survive old saves', () => {
  const prefs = read('src/utils/preferences.js')
  assert.match(prefs, /touchControlsMode: 'gestures'/)
  assert.match(prefs, /touchFxEnabled: true/)
  assert.match(prefs, /showTouchHints: true/)
  assert.match(prefs, /touchHintGamesSeen: 0/)
  assert.match(prefs, /\['gestures', 'buttons'\]\.includes\(source\.touchControlsMode\)/)
  assert.match(prefs, /touchFxEnabled: typeof source\.touchFxEnabled === 'boolean' \? source\.touchFxEnabled : DEFAULT_PREFERENCES\.touchFxEnabled/)
  assert.match(prefs, /showTouchHints: typeof source\.showTouchHints === 'boolean' \? source\.showTouchHints : DEFAULT_PREFERENCES\.showTouchHints/)
  assert.match(prefs, /Math\.max\(0, Math\.min\(3, source\.touchHintGamesSeen\)\)/)
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
