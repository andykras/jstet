import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('../../src/App.vue', import.meta.url), 'utf8')
const component = readFileSync(new URL('../../src/components/Leaderboard.vue', import.meta.url), 'utf8')

test('leaderboard stays outside the engine and listens for real game completion', () => {
  assert.match(app, /on\('done', \(\) => this\.onRunComplete\(\)\)/)
  assert.match(app, /this\.lastRun = run/)
  assert.match(app, /if \(leaderboardConfigured && canRankRun\(run\)\) \{\n        if \(isLeaderboardAutoPublishEnabled\(\)\) this\.sendCompletedRun\(\)/)
  assert.match(app, /<Leaderboard v-if="leaderboardOpen"/)
  assert.match(app, /<button ref="leaderboardTrigger"/)
})

test('opening the ranking pauses play and does not automatically resume it', () => {
  assert.match(app, /openLeaderboard\(\) \{[\s\S]*?this\.pauseForDialog\(\)[\s\S]*?this\.leaderboardOpen = true/)
  assert.match(app, /closeLeaderboard\(\) \{[\s\S]*?this\.leaderboardOpen = false/)
  assert.match(app, /&& !settingsOpen && !leaderboardOpen/)
})

test('first publication requires a nickname and explicit opt-in', () => {
  assert.match(app, /hardDrop: this\.hard/)
  assert.match(app, /singleBlock: this\.preferences\.singleBlock/)
  assert.match(component, /@submit\.prevent="registerAndPublish"/)
  assert.match(component, /Join & publish score/)
  assert.match(component, /automatically/)
  assert.match(component, /role="dialog"/)
  assert.match(component, /role="alert"/)
})

test('ranking rows carry option badges and expandable run details', () => {
  assert.match(component, /leaderboard-badge--hard/)
  assert.match(component, /toggleEntry\(playerId\)/)
  assert.match(component, /leaderboard-entry__details/)
  assert.match(component, /formatRunDuration\(entry\.durationMs\)/)
  assert.match(component, /entry\.hardDrop === true \? 'Hard drop' : 'Soft drop'/)
  assert.match(component, /entry\.singleBlock === false \? 'All at once' : 'One at a time'/)
  assert.match(component, /leaderboard-personal__badges/)
  const styles = readFileSync(new URL('../../src/styles/leaderboard.styl', import.meta.url), 'utf8')
  const rules = readFileSync(new URL('../../src/utils/leaderboardRules.js', import.meta.url), 'utf8')
  assert.match(styles, /\.leaderboard-badge\n/)
  assert.match(styles, /\.leaderboard-entry__details\n/)
  assert.match(rules, /formatRunDuration/)
})
