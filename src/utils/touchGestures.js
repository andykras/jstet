// Pure gesture recognition for the mobile touch surface.
// The board rect comes from the rendered well, never from hardcoded columns.

// Zones: strictly outside the board edges moves, inside rotates.
export function pickZone(bounds, x) {
  if (!bounds || !Number.isFinite(bounds.left) || !Number.isFinite(bounds.right)) return null
  if (bounds.width <= 0) return null
  if (x < bounds.left) return 'left'
  if (x > bounds.right) return 'right'
  return 'rotate'
}

// A drop swipe must travel at least `distance` px downward and stay
// predominantly vertical, including a fast flick that only reports
// its final position at pointerup.
export function isSwipeDrop(startX, startY, x, y, distance = 36) {
  const dx = x - startX
  const dy = y - startY
  return dy >= distance && dy >= Math.abs(dx) * 1.25
}

// A tap keeps the pointer within `tolerance` px of its start.
export function isTap(startX, startY, x, y, tolerance = 18) {
  return Math.hypot(x - startX, y - startY) <= tolerance
}
