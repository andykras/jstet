// Ignore player controls when browser/UI elements own keyboard focus.
export const shouldIgnoreGameInput = target => {
  if (!target) return false
  const name = String(target.tagName || '').toUpperCase()
  const ignoredTypes = ['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image']
  const editableInput = name === 'INPUT' && !ignoredTypes.includes(String(target.type || 'text').toLowerCase())
  return editableInput ||
    name === 'TEXTAREA' ||
    name === 'SELECT' ||
    target.isContentEditable === true ||
    Boolean(target.closest && target.closest('[role="dialog"], [aria-modal="true"]'))
}
