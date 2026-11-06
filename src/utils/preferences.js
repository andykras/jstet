const KEY = 'jstet.preferences.v1'

export const DEFAULT_PREFERENCES = Object.freeze({
  theme: 'arcade',
  reducedMotion: false,
  showHelp: true,
  hardDrop: false
})

export const normalizePreferences = value => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return {
    theme: ['arcade', 'prism'].includes(source.theme) ? source.theme : DEFAULT_PREFERENCES.theme,
    reducedMotion: typeof source.reducedMotion === 'boolean' ? source.reducedMotion : DEFAULT_PREFERENCES.reducedMotion,
    showHelp: typeof source.showHelp === 'boolean' ? source.showHelp : DEFAULT_PREFERENCES.showHelp,
    hardDrop: typeof source.hardDrop === 'boolean' ? source.hardDrop : DEFAULT_PREFERENCES.hardDrop
  }
}

// Preferences are stored only on explicit changes, never during the game loop.
export function loadPreferences(storage = typeof localStorage === 'undefined' ? null : localStorage) {
  if (!storage) return normalizePreferences(null)
  try {
    const raw = storage.getItem(KEY)
    const saved = JSON.parse(raw || 'null')
    return saved && saved.version === 1 ? normalizePreferences(saved.preferences) : normalizePreferences(null)
  } catch (_) {
    return normalizePreferences(null)
  }
}

export function savePreferences(preferences, storage = typeof localStorage === 'undefined' ? null : localStorage) {
  if (!storage) return false
  try {
    storage.setItem(KEY, JSON.stringify({ version: 1, preferences: normalizePreferences(preferences) }))
    return true
  } catch (_) {
    return false
  }
}
