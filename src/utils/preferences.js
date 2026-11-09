const KEY = 'jstet.preferences.v1'

export const DEFAULT_PREFERENCES = Object.freeze({
  theme: 'arcade',
  reducedMotion: false,
  showHelp: true,
  hardDrop: false,
  soundEnabled: true,
  visualFxEnabled: false,
  touchControlsMode: 'gestures',
  touchFxEnabled: true
})

export const normalizePreferences = value => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return {
    theme: ['arcade', 'prism'].includes(source.theme) ? source.theme : DEFAULT_PREFERENCES.theme,
    reducedMotion: typeof source.reducedMotion === 'boolean' ? source.reducedMotion : DEFAULT_PREFERENCES.reducedMotion,
    showHelp: typeof source.showHelp === 'boolean' ? source.showHelp : DEFAULT_PREFERENCES.showHelp,
    hardDrop: typeof source.hardDrop === 'boolean' ? source.hardDrop : DEFAULT_PREFERENCES.hardDrop,
    soundEnabled: typeof source.soundEnabled === 'boolean' ? source.soundEnabled : DEFAULT_PREFERENCES.soundEnabled,
    visualFxEnabled: typeof source.visualFxEnabled === 'boolean' ? source.visualFxEnabled : DEFAULT_PREFERENCES.visualFxEnabled,
    touchControlsMode: ['gestures', 'buttons'].includes(source.touchControlsMode) ? source.touchControlsMode : DEFAULT_PREFERENCES.touchControlsMode,
    touchFxEnabled: typeof source.touchFxEnabled === 'boolean' ? source.touchFxEnabled : DEFAULT_PREFERENCES.touchFxEnabled
  }
}

// Preferences are stored only on explicit changes, never during the game loop.
const availableStorage = () => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch (_) {
    return null
  }
}

export function loadPreferences(storage = availableStorage()) {
  if (!storage) return normalizePreferences(null)
  try {
    const raw = storage.getItem(KEY)
    const saved = JSON.parse(raw || 'null')
    return saved && saved.version === 1 ? normalizePreferences(saved.preferences) : normalizePreferences(null)
  } catch (_) {
    return normalizePreferences(null)
  }
}

export function savePreferences(preferences, storage = availableStorage()) {
  if (!storage) return false
  try {
    storage.setItem(KEY, JSON.stringify({ version: 1, preferences: normalizePreferences(preferences) }))
    return true
  } catch (_) {
    return false
  }
}
