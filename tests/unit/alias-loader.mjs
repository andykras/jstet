// Registered via `node --test --import` so every test file can import the
// engine despite its bundler-style '@/...' specifiers.
import { register } from 'node:module'

register('./alias-resolve.mjs', import.meta.url)
