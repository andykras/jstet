import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
const app = read('src/App.vue')
const component = read('src/components/Leaderboard.vue')
const badges = read('src/components/LeaderboardRunBadges.vue')
const details = read('src/components/LeaderboardRunDetails.vue')
const client = read('src/utils/leaderboardClient.js')

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
  assert.match(component, /automatic publishing/)
})

test('podium and ranked rows share accessible vector device badges', () => {
  const uses = component.match(/<LeaderboardRunBadges/g) || []
  assert.equal(uses.length, 2)
  assert.match(badges, /role="img"/)
  assert.match(badges, /aria-label="Hard Drop"/)
  assert.match(badges, /leaderboard-run-badge__impact/)
  assert.doesNotMatch(badges, /leaderboard-run-badge__fist|M12 2v12m-5-5 5 5 5-5/)
  assert.match(badges, /aria-label="Phone or tablet"/)
  assert.match(badges, /aria-label="Computer"/)
  assert.match(badges, /aria-label="Device unknown"/)
  assert.doesNotMatch(component, />ALL<|>HD<|>1×1</)
  assert.match(details, /entry\.singleBlock === false/)
  assert.match(details, /entry\.platform === 'mobile'/)
  assert.match(component, /toggleEntry\(playerId, source\)/)
  const styles = read('src/styles/leaderboard.styl')
  assert.match(styles, /\.leaderboard-run-badge--drop/)
  assert.match(styles, /\.leaderboard-run-badge--mobile/)
  assert.match(styles, /\.leaderboard-run-badge--desktop/)
})

test('the full Top 20 includes podium players even when there are only three entries', () => {
  assert.ok(component.includes('<span>TOP 20</span>'))
  assert.ok(component.includes('<small>RANK 01—20</small>'))
  assert.ok(component.includes('aria-label="Top 20 players"'))
  assert.ok(component.includes('v-for="entry in leaderboardRows"'))
  assert.ok(!component.includes('remainingEntries'))
  assert.ok(!component.includes('RANK 04—20'))
  assert.ok(!component.includes('v-if="remainingEntries.length"'))
})

test('your standing replaces the matching row and remains pinned below Top 20 when unranked there', () => {
  assert.ok(component.includes('v-for="entry in leaderboardRows"'))
  assert.ok(component.includes('class="leaderboard-entry__standing-label">YOUR STANDING</span>'))
  assert.ok(component.includes("'leaderboard-entry--standing-only': entry.standingOnly === true"))
  assert.ok(component.includes("if (this.entries.some(entry => entry.playerId === this.profile.id)) return this.entries"))
  assert.ok(component.includes('standingOnly: true'))
  assert.ok(!component.includes('leaderboard-personal'))
})

test('podium and Top 20 rows expand independently and third place sits lower', () => {
  assert.ok(component.includes("toggleEntry(entry.playerId, 'podium')"))
  assert.ok(component.includes("toggleEntry(entry.playerId, 'list')"))
  assert.ok(component.includes("expandedSource === 'podium' && expandedId === entry.playerId"))
  assert.ok(component.includes("expandedSource === 'list' && expandedId === entry.playerId"))
  assert.ok(component.includes("if (this.expandedSource !== 'podium') return null"))
  const styles = read('src/styles/leaderboard.styl')
  assert.ok(styles.includes('.leaderboard-podium__slot--1 .leaderboard-podium__button\n  min-height 216px'))
  assert.ok(styles.includes('.leaderboard-podium__slot--2 .leaderboard-podium__button\n  min-height 188px'))
  assert.ok(styles.includes('.leaderboard-podium__slot--3 .leaderboard-podium__button\n  min-height 164px'))
  assert.ok(styles.includes('  .leaderboard-podium__slot--1 .leaderboard-podium__button\n    min-height 205px'))
  assert.ok(styles.includes('  .leaderboard-podium__slot--2 .leaderboard-podium__button\n    min-height 177px'))
  assert.ok(styles.includes('  .leaderboard-podium__slot--3 .leaderboard-podium__button\n    min-height 150px'))
  assert.ok(styles.includes('.leaderboard-podium__you\n  display inline'))
})


test('players can rename their existing public profile without creating a new identity', () => {
  assert.ok(component.includes('@click="beginRename"'))
  assert.ok(component.includes('@submit.prevent="renameProfile"'))
  assert.ok(component.includes('renameLeaderboardPlayer'))
  assert.ok(client.includes("apiRequest('/api/v1/players/me'"))
  assert.ok(client.includes("method: 'PATCH'"))
  const php = read('leaderboard-api/php/index.php')
  assert.ok(php.includes('function rename_player(): never'))
  assert.ok(php.includes('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS'))
  assert.ok(php.includes("if ($path === '/api/v1/players/me' && $method === 'PATCH') rename_player();"))
  assert.ok(php.includes("$state['players'][$id]['nickname'] = $nickname"))
})

test('PHP stores and returns platform metadata independently of score ranking', () => {
  const php = read('leaderboard-api/php/index.php')
  assert.match(php, /'platform' => \$platform/)
  assert.match(php, /'platform' => \$best\['platform'\] \?\? null/)
  assert.match(php, /'platform' => \$row\['platform'\]/)
  assert.match(php, /\$id \. '\|' \. \$run\['mode'\]/)
})
