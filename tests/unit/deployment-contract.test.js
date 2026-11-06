import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const path = file => fileURLToPath(new URL('../../' + file, import.meta.url))
const read = file => readFileSync(path(file), 'utf8')

for (const script of ['preflight-kraspeed.sh', 'deploy-kraspeed.sh', 'rollback-kraspeed.sh']) {
  test(`kraspeed ${script}: shell syntax is valid`, () => {
    const result = spawnSync('bash', ['-n', path('scripts/' + script)], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr || result.error?.message)
  })
}

test('deployment builds on Mac and uploads only the static dist', () => {
  const deploy = read('scripts/deploy-kraspeed.sh')
  assert.match(deploy, /npm install --no-audit --no-fund/)
  assert.match(deploy, /npm run test:unit/)
  assert.match(deploy, /npm run lint/)
  assert.match(deploy, /npm run build/)
  assert.match(deploy, /rsync -az --delete -- "\$ROOT\/dist\/"/)
  assert.match(deploy, /ALLOW_DEPLOY_NON_MASTER/)
  assert.match(deploy, /git status --porcelain/)
  const remote = deploy.split("<<'REMOTE'")[1]
  assert.ok(remote)
  assert.doesNotMatch(remote, /npm (ci|install|run|exec)/)
  assert.doesNotMatch(remote, /pacman /)
})

test('release/rollback use same lock, atomic symlinks, SHA markers and HTTPS SNI', () => {
  const deploy = read('scripts/deploy-kraspeed.sh')
  const rollback = read('scripts/rollback-kraspeed.sh')
  for (const body of [deploy, rollback]) {
    assert.match(body, /\/tmp\/tetcolor-release\.lock/)
    assert.match(body, /\/srv\/tetcolor\/current|CURRENT="\$BASE\/current"/)
    assert.match(body, /\.release/)
    assert.match(body, /mv -Tf/)
    assert.match(body, /--resolve "\$HOST:443:127\.0\.0\.1"/)
    assert.match(body, /https:\/\/\$HOST\//)
    assert.doesNotMatch(body, /curl[^\n]* -k\b/)
  }
  assert.match(deploy, /rollback_on_error/)
  assert.match(rollback, /trap restore EXIT/)
})

test('new lighttpd host is additive and never proxies to Mirra or PHP', () => {
  const config = read('deploy/lighttpd/96-tetcolor.conf.example')
  assert.match(config, /\$HTTP\["host"\] == "tetcolor\.andykras\.org"/)
  assert.match(config, /server\.document-root = "\/srv\/tetcolor\/dist"/)
  assert.match(config, /__TLS_FULLCHAIN_PEM__/)
  assert.match(config, /__TLS_PRIVATE_KEY_PEM__/)
  assert.ok(config.includes('acme-challenge'))
  assert.match(config, /restart lighttpd/)
  assert.doesNotMatch(config, /proxy\.server =/)
  assert.doesNotMatch(config, /server\.document-root = "\/srv\/mirra/)
  assert.doesNotMatch(config, /url\.rewrite-if-not-file/)
})

test('agent plan requires live inspection and explicit approval before provisioning', () => {
  const plan = read('docs/plans/tetcolor-kraspeed-deployment.md')
  const handoff = read('docs/plans/tetcolor-kraspeed-agent-handoff.md')
  for (const value of [plan, handoff]) {
    assert.match(value, /tetcolor\.andykras\.org/)
    assert.match(value, /acme\.sh/)
    assert.match(value, /Mirra/)
    assert.match(value, /DNS/)
  }
  assert.match(handoff, /Do not claim success/)
})
