// Engine coordinates are zero-based array indices: x=0 and x=width-1 are walls,
// y=0 is the floor. The displayed board runs from y=height-1 at top to y=1 at bottom.
// This mapping does not depend on the current viewport or CSS cell size.
export function toVisualFxCell(x, y, { width, height } = {}) {
  if (![x, y, width, height].every(Number.isInteger) || width < 3 || height < 2) return null
  if (x < 1 || x >= width - 1 || y < 1 || y >= height) return null
  return Object.freeze({ column: x - 1, row: height - 1 - y })
}
