import store from '@/store'

const $lines = []

const border = -2
const empty = 0

let $cells = store.state.cells
let h = null //$cells.height
let w = null //$cells.width

export const clearOneLine = _ => {
  $cells = store.state.cells, h = $cells.height, w = $cells.width
  for (let y = $lines.pop(); y < h - 1; y++) {
    for (let x = 1; x < w - 1; ++x) {
      $cells[y][x] = $cells[y + 1][x]
    }
  }
  return 1
}

export const clearAllLines = _ => {
  $cells = store.state.cells, h = $cells.height, w = $cells.width
  const total = $lines.length
  let cur = $lines.pop()
  for (let y = cur + 1; y < h; y++) {
    const len = $lines.length
    if (len && y == $lines[len - 1]) {
      $lines.pop()
      continue
    }
    for (let x = 1; x < w - 1; ++x) {
      $cells[cur][x] = $cells[y][x]
    }
    cur++
  }
  for (let y = cur; y < h; y++) {
    for (let x = 1; x < w - 1; ++x) {
      $cells[y][x] = empty
    }
  }
  return total
}

export const getSolidLines = ({ asc, item }) => {
  $cells = store.state.cells, h = $cells.height, w = $cells.width
  const dim = store.state.pieces[item.T].size
  for (let y = asc ? 0 : dim - 1; asc ? y < dim : y >= 0; asc ? ++y : --y) {
    if (item.Y + y <= 0 || item.Y + y > h - 1) continue
    let line = true
    for (let x = 1; x < w - 1 && line; ++x) line = $cells[item.Y + y][x] != 0
    if (line) {
      $lines.push(item.Y + y)
      for (let x = 1; x < w - 1; ++x) $cells[item.Y + y][x] = border
    }
  }
  return $lines
}
