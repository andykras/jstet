import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

const read = path => readFileSync(new URL('../../' + path, import.meta.url))
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

const inspectPng = path => {
  const bytes = read(path)
  assert.ok(bytes.subarray(0, 8).equals(pngSignature), path)
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR', path)
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  assert.equal(bytes[24], 8) // 8 bits per sample
  assert.equal(bytes[25], 6) // RGBA
  const parts = []
  let pos = 8
  while (pos < bytes.length) {
    const size = bytes.readUInt32BE(pos)
    const type = bytes.toString('ascii', pos + 4, pos + 8)
    if (type === 'IDAT') parts.push(bytes.subarray(pos + 8, pos + 8 + size))
    pos += size + 12
    if (type === 'IEND') break
  }
  assert.ok(parts.length > 0, path)
  const pixels = inflateSync(Buffer.concat(parts))
  assert.equal(pixels.length, height * (width * 4 + 1), path)
  return { width, height }
}

test('browser favicon uses branded SVG and ICO fallback rather than Vue', () => {
  const html = read('index.html').toString('utf8')
  const svg = read('public/favicon.svg').toString('utf8')
  assert.match(html, /rel="icon" type="image\/svg\+xml" href="\.\/favicon\.svg\?v=2"/)
  assert.match(html, /rel="alternate icon" type="image\/x-icon" href="\.\/favicon\.ico\?v=2"/)
  assert.match(svg, /<title>JSTET<\/title>/)
  assert.match(svg, /<rect x="25" y="11"/)
  assert.match(svg, /<rect x="43" y="29"/)
  assert.doesNotMatch(svg, /vue|Vue/)
})

test('ICO embeds usable PNG artwork at favicon sizes', () => {
  const bytes = read('public/favicon.ico')
  assert.equal(bytes.readUInt16LE(0), 0)
  assert.equal(bytes.readUInt16LE(2), 1)
  const count = bytes.readUInt16LE(4)
  assert.ok(count >= 2)
  for (let i = 0; i < count; i++) {
    const offset = 6 + i * 16
    const size = bytes.readUInt32LE(offset + 8)
    const start = bytes.readUInt32LE(offset + 12)
    assert.ok(bytes.subarray(start, start + 8).equals(pngSignature))
    assert.ok(start + size <= bytes.length)
  }
})

test('Android, favicon and Apple icons are actual raster assets in correct sizes', () => {
  for (const [path, expected] of [
    ['public/img/icons/favicon-16x16.png', 16],
    ['public/img/icons/favicon-32x32.png', 32],
    ['public/img/icons/android-chrome-192x192.png', 192],
    ['public/img/icons/android-chrome-512x512.png', 512],
    ['public/img/icons/apple-touch-icon-180x180.png', 180]
  ]) {
    assert.deepEqual(inspectPng(path), { width: expected, height: expected })
  }
})

test('PWA manifest and Apple touch icon point to branded files', () => {
  const manifest = JSON.parse(read('public/manifest.json').toString('utf8'))
  const html = read('index.html').toString('utf8')
  assert.ok(manifest.icons.some(icon => icon.src.includes('192x192.png')))
  assert.ok(manifest.icons.some(icon => icon.src.includes('512x512.png')))
  assert.match(html, /rel="apple-touch-icon" sizes="180x180"/)
  const safari = read('public/img/icons/safari-pinned-tab.svg').toString('utf8')
  assert.match(safari, /<title>JSTET<\/title>/)
})
