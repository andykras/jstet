// Ignore player controls when browser/UI elements own keyboard focus.
// Only truly modal dialogs (aria-modal="true") capture keys. The non-modal
// game-state overlay (role="dialog" with aria-modal="false") must not trap
// game keys: pausing sends focus to its Resume action, and P has to resume.
export const shouldIgnoreGameInput = target => {
  if (!target) return false
  const name = String(target.tagName || '').toUpperCase()
  const ignoredTypes = ['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image']
  const editableInput = name === 'INPUT' && !ignoredTypes.includes(String(target.type || 'text').toLowerCase())
  return editableInput ||
    name === 'TEXTAREA' ||
    name === 'SELECT' ||
    target.isContentEditable === true ||
    Boolean(target.closest && target.closest('[aria-modal="true"]'))
}
