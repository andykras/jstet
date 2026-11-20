import test from 'node:test'
import assert from 'node:assert/strict'
import { handleRequest } from '../../leaderboard-api/src/worker.js'

const json = response => response.json()
const env = { DB: {}, ALLOWED_ORIGINS: 'https://tetcolor.andykras.org,http://localhost:1337' }

test('public endpoint rejects unsupported ranking categories', async () => {
  const response = await handleRequest(
    new Request('https://api.example/api/v1/leaderboard?mode=legacy&period=week'), env
  )
  assert.equal(response.status, 400)
  assert.match((await json(response)).error, /Invalid ranking/)
})

test('browser CORS preflight permits only configured sites', async () => {
  const allowed = await handleRequest(new Request('https://api.example/api/v1/scores', {
    method: 'OPTIONS',
    headers: { Origin: 'http://localhost:1337', 'Access-Control-Request-Method': 'POST' }
  }), env)
  assert.equal(allowed.status, 204)
  assert.equal(allowed.headers.get('Access-Control-Allow-Origin'), 'http://localhost:1337')

  const blocked = await handleRequest(new Request('https://api.example/api/v1/scores', {
    method: 'OPTIONS',
    headers: { Origin: 'https://untrusted.example' }
  }), env)
  assert.equal(blocked.status, 403)
  assert.equal(blocked.headers.get('Access-Control-Allow-Origin'), null)
})

test('scores require a player session before touching storage', async () => {
  const response = await handleRequest(new Request('https://api.example/api/v1/scores', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score: 500 })
  }), env)
  assert.equal(response.status, 401)
})

test('signup refuses markup before issuing a token', async () => {
  const response = await handleRequest(new Request('https://api.example/api/v1/players', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: '<script>' })
  }), env)
  assert.equal(response.status, 400)
})
