import test from 'node:test'
import assert from 'node:assert/strict'
import {
  LEADERBOARD_RULESET,
  canRankRun,
  completedRun,
  formatLeaderboardScore
} from '../../src/utils/leaderboardRules.js'
import { readLeaderboardPlayer } from '../../src/utils/leaderboardClient.js'

const run = {
  runId: '8bfdd69b-98dc-4a72-ac3e-d72c2c635483',
  mode: 'tetcolor',
  singleBlock: true,
  score: 12000,
  lines: 45,
  level: 3,
  durationMs: 123000
}

test('the competitive run preserves the engine score and declares the scoring contract', () => {
  assert.deepEqual(completedRun(run), {
    runId: run.runId, mode: 'tetcolor', singleBlock: true, score: 12000,
    cleared: 45, level: 3, durationMs: 123000, ruleset: LEADERBOARD_RULESET
  })
  assert.equal(canRankRun(run), true)
  assert.equal(canRankRun({ ...run, mode: 'classic' }), true)
})

test('nonstandard clears, empty games and too-short games are not ranked', () => {
  assert.equal(canRankRun({ ...run, singleBlock: false }), false)
  assert.equal(canRankRun({ ...run, score: 0 }), false)
  assert.equal(canRankRun({ ...run, mode: 'legacy' }), false)
  assert.equal(canRankRun({ ...run, durationMs: 0 }), false)
  assert.equal(formatLeaderboardScore(12345), '12,345')
})

test('anonymous player credentials are only loaded from a valid stored record', () => {
  const get = value => ({ getItem: () => JSON.stringify(value) })
  assert.equal(readLeaderboardPlayer(get({ nickname: 'A', token: 'not-a-token' })), null)
  assert.deepEqual(readLeaderboardPlayer(get({ id: 'uuid', nickname: 'Arcade', token: 'a'.repeat(64) })), {
    id: 'uuid', nickname: 'Arcade', token: 'a'.repeat(64)
  })
  assert.equal(readLeaderboardPlayer({ getItem: () => '{broken' }), null)
})
