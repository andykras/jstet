import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('board geometry tracks the active mode rather than assuming one grid size', () => {
  const app = read('src/App.vue')
  assert.match(app, /:style="boardGeometry"/)
  assert.match(app, /getDimensions/)
  assert.match(app, /'--board-columns': Math\.max\(1, \(width \|\| 9\) - 2\)/)
  assert.match(app, /'--board-rows': Math\.max\(1, \(height \|\| 19\) - 1\)/)
})

test('viewport sizing uses the real board container and preserves square cells', () => {
  const app = read('src/App.vue')
  const styles = read('src/styles/arcade-responsive.styl')
  assert.match(app, /@import '\.\/styles\/arcade-responsive\.styl'/)
  assert.match(styles, /height 100dvh/)
  assert.match(styles, /container-type size/)
  assert.match(styles, /100cqw/)
  assert.match(styles, /100cqh/)
  assert.match(styles, /var\(--board-columns/)
  assert.match(styles, /var\(--board-rows/)
})

test('compact screens keep touch controls and the complete board in the layout', () => {
  const styles = read('src/styles/arcade-responsive.styl')
  assert.match(styles, /@media \(max-width: 920px\)/)
  assert.match(styles, /'dashboard preview' 'board board' 'touch touch'/)
  assert.match(styles, /'board dashboard' 'board touch'/)
  assert.match(styles, /@media \(max-width: 640px\) and \(orientation: portrait\)/)
  assert.match(styles, /@media \(max-width: 920px\) and \(max-height: 520px\) and \(orientation: landscape\)/)
  assert.match(styles, /max-height: 560px/)
  assert.match(styles, /overflow visible/)
  assert.match(styles, /touch-pad__directions/)
})

test('header shortcuts, compact settings and pause flow are consistent', () => {
  const app = read('src/App.vue')
  const styles = read('src/styles/arcade-responsive.styl')
  for (const label of ['New Game (N)', 'Pause (P)', 'Settings (S)', 'Resume (P)']) {
    assert.ok(app.includes(label), label)
  }
  for (const action of ["KeyN: () => this.createStakan()", "KeyP: () => gameBus.emit('pause')",
    "KeyS: () => this.openSettings()"]) {
    assert.ok(app.includes(action), action)
  }
  assert.doesNotMatch(app, /KeyY:|pendingMode|modalWasRunning|<footer class="arcade-footer">/)
  assert.match(app, /if \(this.status === 'running'\) this.togglePause\(\)/)
  const close = app.split('closeSettings() {')[1].split('requestMode(mode) {')[0]
  assert.doesNotMatch(close, /togglePause\(\)/)
  assert.match(styles, /width 430px/)
  assert.match(styles, /max-width 100%/)
  assert.match(styles, /max-height calc\(100dvh - 32px\)/)
})

test('sound options and lifecycle from master survive the responsive redesign', () => {
  const app = read('src/App.vue')
  assert.match(app, /v-model="preferences.soundEnabled"/)
  assert.match(app, /attachSounds\(gameBus, \{ enabled: this.preferences.soundEnabled \}\)/)
  assert.match(app, /this.sounds.setEnabled\(this.preferences.soundEnabled\)/)
  assert.match(app, /this.sounds.dispose\(\)/)
})
