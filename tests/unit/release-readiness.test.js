import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('JSTET release metadata matches the static subdirectory PWA contract', () => {
  const manifest = JSON.parse(read('public/manifest.json'))
  const html = read('index.html')
  const vite = read('vite.config.mjs')
  const registration = read('src/registerServiceWorker.js')

  assert.equal(manifest.name, 'JSTET — Arcade 2077')
  assert.equal(manifest.short_name, 'JSTET')
  assert.equal(manifest.start_url, './index.html')
  assert.equal(manifest.display, 'standalone')
  assert.equal(manifest.background_color, '#08071B')
  assert.equal(manifest.theme_color, '#08071B')
  assert.deepEqual(manifest.icons.map(icon => icon.sizes), ['192x192', '512x512'])
  for (const icon of manifest.icons) assert.ok(icon.src.startsWith('./'))

  assert.ok(html.includes('<title>JSTET — Arcade 2077</title>'))
  assert.ok(html.includes('<meta name="theme-color" content="#08071B" />'))
  assert.ok(html.includes('href="./manifest.json"'))
  assert.ok(vite.includes("base: './'"))
  assert.ok(vite.includes("manifest: false"))
  assert.ok(vite.includes("filename: 'service-worker.js'"))
  assert.ok(registration.includes("import.meta.env.BASE_URL + 'service-worker.js'"))
})
