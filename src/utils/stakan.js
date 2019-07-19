export default function stakan(h, w, dim, part = 0, density = 0, pieces = 0) {
  const borderValue = -1
  const emptySpaceValue = 0
  const checkBorder = (x, y) => x == 0 || x == w - 1 || y == 0
  const randomCell = y => y < h * part && Math.random() < density
  const cellValue = _ => Math.floor(Math.random() * pieces)
  const emptySpace = y => (randomCell(y) ? cellValue() : emptySpaceValue)
  const cells = Array.from({ length: h + dim }, (_, y) =>
    Array.from({ length: w }, (_, x) =>
      // place border, empty space or some random piece here
      checkBorder(x, y) ? borderValue : emptySpace(y)
    )
  )
  cells.height = h
  cells.width = w
  return cells
}
