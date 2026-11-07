// Engine coordinates are zero-based array indices: x=0 and x=width-1 are walls,
// y=0 is the floor. The displayed board runs from y=height-1 at top to y=1 at bottom.
// This mapping does not depend on the current viewport or CSS cell size.
export function toVisualFxCell(x, y, { width, height } = {}) {
  if (![x, y, width, height].every(Number.isInteger) || width < 3 || height < 2) return null
  if (x < 1 || x >= width - 1 || y < 1 || y >= height) return null
  return Object.freeze({ column: x - 1, row: height - 1 - y })
}

// The renderer's one-based template coordinates are the same coordinates used
// by getWellValue(). Check the actual falling piece, not a color or cell value:
// settled blocks can have exactly the same color as the active piece.
export function isActivePieceCell(x, y, pieces, item) {
  if (!item || !pieces) return false
  const piece = pieces[item.T]
  if (!piece) return false
  const px = x - item.X - 1
  const py = y - item.Y - 1
  if (px < 0 || py < 0 || px >= piece.size || py >= piece.size) return false
  return piece.get(px, py, item.R) > 0
}
