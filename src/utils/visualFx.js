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

// Snapshot just the occupied cells of one piece for transient visuals.
// Never hand the FX layer a mutable reference to live piece/board arrays.
export function getPieceFxCells(item, pieces, dimensions) {
  if (!item || !pieces || !dimensions) return Object.freeze([])
  const piece = pieces[item.T]
  if (!piece) return Object.freeze([])

  const cells = []
  for (let y = 0; y < piece.size; y++) {
    for (let x = 0; x < piece.size; x++) {
      const color = piece.get(x, y, item.R)
      if (!Number.isInteger(color) || color <= 0) continue
      const position = toVisualFxCell(item.X + x, item.Y + y, dimensions)
      if (position) cells.push(Object.freeze({ ...position, color }))
    }
  }
  return Object.freeze(cells)
}

// Capture only positive playable values before the engine marks matches as -2.
// Called at discrete detection boundaries, never on every animation frame.
export function captureClearCandidates(cells) {
  if (!cells) return []
  const candidates = []
  for (let y = 1; y < cells.height; y++) {
    for (let x = 1; x < cells.width - 1; x++) {
      const color = cells[y][x]
      if (color > 0) candidates.push({ x, y, color })
    }
  }
  return candidates
}

// Keep the original color and position only if the engine actually marked the
// cell for removal. This supports arbitrary TetColor matches and Classic rows.
export function markedClearFxCells(candidates, cells) {
  if (!cells || !candidates?.length) return Object.freeze([])
  const marked = []
  for (const { x, y, color } of candidates) {
    if (cells[y][x] !== -2) continue
    const position = toVisualFxCell(x, y, cells)
    if (position) marked.push(Object.freeze({ ...position, color }))
  }
  return Object.freeze(marked)
}

// Single-step clearing removes exactly one TetColor cell or one Classic row.
// The row/column filter is based on the original detection snapshot, even if
// the underlying board cells have since shifted under gravity.
export function clearStepFxCells(cells, mode, x, y, dimensions) {
  const position = toVisualFxCell(x, y, dimensions)
  if (!position || !cells?.length) return Object.freeze([])
  return Object.freeze(cells.filter(cell =>
    cell.row === position.row && (mode === 'classic' || cell.column === position.column)))
}
