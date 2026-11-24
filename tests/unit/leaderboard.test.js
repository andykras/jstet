import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  LEADERBOARD_RULESET,
  canRankRun,
  completedRun,
  formatLeaderboardScore,
  formatRunDuration
} from '../../src/utils/leaderboardRules.js'
import { readLeaderboardPlayer } from '../../src/utils/leaderboardClient.js'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

const run = {
  runId: '8bfdd69b-98dc-4a72-ac3e-d72c2c635483',
  mode: 'tetcolor',
  singleBlock: true,
  score: 12000,
  lines: 45,
  level: 3,
  durationMs: 123000
}

test('the leaderboard dialog keeps a compact width on desktop', () => {
  const styles = read('src/styles/leaderboard.styl')
  // Stylus evaluates its own min(), so the CSS function must be quoted through.
  assert.match(styles, /width unquote\('min\(100%, 560px\)'\)/)
  assert.match(styles, /max-height unquote\('min\(94dvh, 900px\)'\)/)
  assert.doesNotMatch(styles, /width min\(100%/)
})

test('the competitive run preserves the engine score and declares the scoring contract', () => {
  assert.deepEqual(completedRun(run), {
    runId: run.runId, mode: 'tetcolor', score: 12000,
    cleared: 45, level: 3, durationMs: 123000, ruleset: LEADERBOARD_RULESET,
    hardDrop: false, singleBlock: true
  })
  assert.deepEqual(completedRun({ ...run, hardDrop: true, singleBlock: false }), {
    runId: run.runId, mode: 'tetcolor', score: 12000,
    cleared: 45, level: 3, durationMs: 123000, ruleset: LEADERBOARD_RULESET,
    hardDrop: true, singleBlock: false
  })
  assert.equal(completedRun({ ...run, platform: 'mobile' }).platform, 'mobile')
  assert.equal(completedRun({ ...run, platform: 'desktop' }).platform, 'desktop')
  assert.equal(canRankRun(run), true)
  assert.equal(canRankRun({ ...run, mode: 'classic' }), true)
})

test('both clearing settings are ranked; empty or invalid games are not', () => {
  assert.equal(canRankRun({ ...run, singleBlock: false }), true)
  assert.equal(canRankRun({ ...run, score: 0 }), false)
  assert.equal(canRankRun({ ...run, mode: 'legacy' }), false)
  assert.equal(canRankRun({ ...run, durationMs: 0 }), false)
  assert.equal(formatLeaderboardScore(12345), '12,345')
})

test('run durations render as compact minutes and seconds', () => {
  assert.equal(formatRunDuration(5000), '0:05')
  assert.equal(formatRunDuration(65000), '1:05')
  assert.equal(formatRunDuration(3600000), '60:00')
  assert.equal(formatRunDuration(-100), '0:00')
})

test('anonymous player credentials are only loaded from a valid stored record', () => {
  const get = value => ({ getItem: () => JSON.stringify(value) })
  assert.equal(readLeaderboardPlayer(get({ nickname: 'A', token: 'not-a-token' })), null)
  assert.deepEqual(readLeaderboardPlayer(get({ id: 'uuid', nickname: 'Arcade', token: 'a'.repeat(64) })), {
    id: 'uuid', nickname: 'Arcade', token: 'a'.repeat(64)
  })
  assert.equal(readLeaderboardPlayer({ getItem: () => '{broken' }), null)
})
