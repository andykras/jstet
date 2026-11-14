// Maps the bundler-style '@/...' imports used across src/ to real files so the
// engine itself can run under node:test. Registered by alias-loader.mjs.
const SRC = new URL('../../src/', import.meta.url)

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    const mapped = new URL(specifier.slice(2), SRC)
    // src/ imports are written without extensions (bundler style).
    const href = /\.\w+$/.test(mapped.pathname) ? mapped.href : mapped.href + '.js'
    return next(href, context)
  }
  return next(specifier, context)
}
