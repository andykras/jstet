import test from 'node:test'
import assert from 'node:assert/strict'
import { detectRunPlatform } from '../../src/utils/runPlatform.js'
import { completedRun } from '../../src/utils/leaderboardRules.js'

test('a phone reports mobile even with a desktop-sized display', () => {
  assert.equal(detectRunPlatform({
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36'
  }), 'mobile')
})

test('an iPad with a desktop-style user agent is recognized as a touch device', () => {
  assert.equal(detectRunPlatform({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 5 }), 'mobile')
})

test('desktop devices report desktop, including touch-enabled Windows PCs', () => {
  assert.equal(detectRunPlatform({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', maxTouchPoints: 10 }), 'desktop')
  assert.equal(detectRunPlatform({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 0 }), 'desktop')
})

test('no recognizable device does not turn into an invented PC label', () => {
  assert.equal(detectRunPlatform({ userAgent: '' }), null)
  assert.equal(detectRunPlatform(null), null)
})

test('platform is display-only and optionally travels with completed runs', () => {
  const payload = {
    runId: '8bfdd69b-98dc-4a72-ac3e-d72c2c635483',
    mode: 'tetcolor',
    score: 18000,
    lines: 40,
    level: 4,
    durationMs: 70000
  }
  assert.equal(completedRun({ ...payload, platform: 'mobile' }).platform, 'mobile')
  assert.equal(completedRun({ ...payload, platform: 'desktop' }).platform, 'desktop')
  assert.equal('platform' in completedRun(payload), false)
  assert.equal('platform' in completedRun({ ...payload, platform: 'unknown' }), false)
})
