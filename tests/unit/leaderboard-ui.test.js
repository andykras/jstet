import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
const app = read('src/App.vue')
const component = read('src/components/Leaderboard.vue')
const badges = read('src/components/LeaderboardRunBadges.vue')
const details = read('src/components/LeaderboardRunDetails.vue')

test('leaderboard is driven by real game completion, without awaiting the network', () => {
  assert.match(app, /on\('done', \(\) => this\.onRunComplete\(\)\)/)
  assert.match(app, /this\.lastRun = run/)
  assert.match(app, /if \(isLeaderboardAutoPublishEnabled\(\)\) this\.queueCompletedRun\(run\)/)
  assert.match(app, /<Leaderboard v-if="leaderboardOpen"/)
  assert.match(app, /platform: detectRunPlatform\(\)/)
})

test('opening rankings pauses play and closing never auto-resumes it', () => {
  assert.match(app, /openLeaderboard\(\) \{[\s\S]*?this\.pauseForDialog\(\)[\s\S]*?this\.leaderboardOpen = true/)
  assert.match(app, /closeLeaderboard\(\) \{[\s\S]*?this\.leaderboardOpen = false/)
  assert.match(app, /&& !settingsOpen && !leaderboardOpen/)
})

test('new players opt in explicitly, not while playing offline', () => {
  assert.match(component, /@submit\.prevent="registerAndPublish"/)
  assert.match(component, /Save score/)
  assert.match(component, /!online/)
  assert.match(component, /automatically publishing/)
})

test('podium, regular rows and standing share accessible vector device badges', () => {
  const uses = component.match(/<LeaderboardRunBadges/g) || []
  assert.equal(uses.length, 3)
  assert.match(badges, /role="img"/)
  assert.match(badges, /aria-label="Hard Drop"/)
  assert.match(badges, /aria-label="Phone or tablet"/)
  assert.match(badges, /aria-label="Computer"/)
  assert.match(badges, /aria-label="Device unknown"/)
  assert.doesNotMatch(component, />ALL<|>HD<|>1×1</)
  assert.match(details, /entry\.singleBlock === false/)
  assert.match(details, /entry\.platform === 'mobile'/)
  assert.match(component, /toggleEntry\(playerId\)/)
  const styles = read('src/styles/leaderboard.styl')
  assert.match(styles, /\.leaderboard-run-badge--drop/)
  assert.match(styles, /\.leaderboard-run-badge--mobile/)
  assert.match(styles, /\.leaderboard-run-badge--desktop/)
})

test('PHP stores and returns platform metadata independently of score ranking', () => {
  const php = read('leaderboard-api/php/index.php')
  assert.match(php, /'platform' => \$platform/)
  assert.match(php, /'platform' => \$best\['platform'\] \?\? null/)
  assert.match(php, /'platform' => \$row\['platform'\]/)
  assert.match(php, /\$id \. '\|' \. \$run\['mode'\]/)
})
