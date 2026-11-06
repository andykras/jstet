// Ignore player controls when browser/UI elements own keyboard focus.
export const shouldIgnoreGameInput = target => {
  if (!target) return false
  const name = String(target.tagName || '').toUpperCase()
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(name) ||
    target.isContentEditable === true ||
    Boolean(target.closest && target.closest('[role="dialog"], [aria-modal="true"]'))
}
