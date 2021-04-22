import store from '@/store'

let $three = new Set()
$three.sorted = []

let $cells = store.state.cells
let h = null //$cells.height
let w = null //$cells.width

export const removeThreeBlockSorted = _ => {
  ;($cells = store.state.cells), (h = $cells.height)

  const xy = $three.sorted.pop()
  const x = Math.floor(xy / h)
  for (let y = xy - x * h; y < h; ++y) $cells[y][x] = $cells[y + 1][x]
}

export const removeThreeBlock = _ => {
  ;($cells = store.state.cells), (h = $cells.height), (w = $cells.width)
  for (let x = 1; x < w - 1; ++x) {
    for (let cur = 1, y = cur; y < h + 1; ++y) {
      if (!$three.has(x * h + y)) $cells[cur++][x] = $cells[y][x]
    }
  }
}

export const getThreeBlock = _ => {
  ;($cells = store.state.cells), (h = $cells.height), (w = $cells.width)

  const check = (x, y, ly = 0, lx = 0, ry = 0, rx = 0) => $cells[y + ly][x + lx] == $cells[y][x] && $cells[y][x] == $cells[y + ry][x + rx]

  for (let y = 1; y < h - 1; ++y) {
    for (let x = 1; x < w - 1; ++x) {
      if ($cells[y][x] <= 0) continue
      if (check(x, y,  0, -1, 0,  1)) $three.add(x * h + y).add((x - 1) * h + y).add((x + 1) * h + y) // prettier-ignore
      if (check(x, y, -1, -1, 1,  1)) $three.add(x * h + y).add((x - 1) * h + y - 1).add((x + 1) * h + y + 1) // prettier-ignore
      if (check(x, y, -1,  0, 1,  0)) $three.add(x * h + y).add(x * h + y - 1).add(x * h + y + 1) // prettier-ignore
      if (check(x, y, -1,  1, 1, -1)) $three.add(x * h + y).add((x - 1) * h + y + 1).add((x + 1) * h + y - 1) // prettier-ignore
    }
  }
  if ($three.size > 0) {
    let delta = -1
    $three.bonus = 0
    for (let x = 1; x < w - 1; ++x) {
      for (let y = 1; y < h - 1; ++y) {
        const xhy = x * h + y
        if ($three.has(xhy)) {
          const diff = xhy - delta
          delta = xhy
          if (diff != h && diff != w && diff > 1) $three.bonus++
          $cells[y][x] = -2
        }
      }
    }
  }
  $three.sorted = Array.from($three)
  $three.sorted.sort((a, b) => {
    const xA = Math.floor(a / h)
    const yA = a - xA * h
    const xB = Math.floor(b / h)
    const yB = b - xB * h
    return yA == yB ? xB - xA : yA - yB
  })
  return $three
}
