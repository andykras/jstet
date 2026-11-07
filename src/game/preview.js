// Return only the occupied bounds; the preview has no reason to allocate
// blank padding cells for every possible piece size.
export const getPreviewBounds = (size, getValue) => {
  let left = size + 1
  let right = 0
  let bottom = size + 1
  let top = 0

  for (let y = 1; y <= size; y++) {
    for (let x = 1; x <= size; x++) {
      if (getValue(x, y) > 0) {
        left = Math.min(left, x)
        right = Math.max(right, x)
        bottom = Math.min(bottom, y)
        top = Math.max(top, y)
      }
    }
  }

  return right ? { left, right, bottom, top } : null
}

export const getPreviewRows = bounds => {
  if (!bounds) return []
  return Array.from({ length: bounds.top - bounds.bottom + 1 }, (_, index) => ({
    y: bounds.bottom + index,
    columns: Array.from({ length: bounds.right - bounds.left + 1 }, (_, offset) => bounds.left + offset)
  }))
}
