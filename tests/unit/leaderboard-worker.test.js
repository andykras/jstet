import test from 'node:test'
import assert from 'node:assert/strict'
import { weekStartUtc, normalizedNickname, validateRun } from '../../leaderboard-api/src/worker.js'

const valid = {
  runId: '8bfdd69b-98dc-4a72-ac3e-d72c2c635483',
  mode: 'tetcolor', ruleset: 'arcade-v1', singleBlock: true,
  score: 1000, cleared: 10, level: 2, durationMs: 60000
}

test('weekly rankings reset at Monday 00:00 UTC, including year boundaries', () => {
  assert.equal(new Date(weekStartUtc(Date.parse('2026-11-22T23:59:59Z'))).toISOString(), '2026-11-16T00:00:00.000Z')
  assert.equal(new Date(weekStartUtc(Date.parse('2026-11-23T00:00:00Z'))).toISOString(), '2026-11-23T00:00:00.000Z')
  assert.equal(new Date(weekStartUtc(Date.parse('2027-01-01T15:00:00Z'))).toISOString(), '2026-12-28T00:00:00.000Z')
})

test('nicknames accept Cyrillic and refuse markup or oversized identifiers', () => {
  assert.equal(normalizedNickname(' Андрей_77 '), 'Андрей_77')
  assert.equal(normalizedNickname('A&B'), null)
  assert.equal(normalizedNickname('<script>'), null)
  assert.equal(normalizedNickname('xx'), null)
})

test('the API accepts only bounded competitive result records', () => {
  assert.equal(validateRun(valid), null)
  assert.equal(validateRun({ ...valid, mode: 'classic' }), null)
  assert.equal(validateRun({ ...valid, singleBlock: false }), null)
  assert.equal(validateRun({ ...valid, hardDrop: true, singleBlock: false }), null)
  assert.match(validateRun({ ...valid, hardDrop: 'yes' }), /Invalid run options/)
  assert.match(validateRun({ ...valid, score: 9999999999 }), /Invalid score/)
  assert.match(validateRun({ ...valid, durationMs: 10 }), /Invalid run duration/)
  assert.match(validateRun({ ...valid, runId: 'foo' }), /Invalid run identifier/)
})
