import store from '@/store'

let $three = new Set()
$three.sorted = []

// Clearing state must not survive a new run or an engine switch.
export const resetThreeBlocks = () => {
  $three = new Set()
  $three.sorted = []
  store.commit('setPendingClears', $three)
  return $three
}

let $cells = store.state.cells
let h = null //$cells.height
let w = null //$cells.width

export const removeThreeBlockSorted = _ => {
  ;($cells = store.state.cells), (h = $cells.height)

  const xy = $three.sorted.pop()
  const x = Math.floor(xy / h)
  for (let y = xy - x * h; y < h - 1; ++y) $cells[y][x] = $cells[y + 1][x]
  $cells[h - 1][x] = 0
  $three.delete(xy)
  store.commit('setPendingClears', $three)
}

export const removeThreeBlock = _ => {
  ;($cells = store.state.cells), (h = $cells.height), (w = $cells.width)
  const total = $three.size
  for (let x = 1; x < w - 1; ++x) {
    let cur = 1
    for (let y = 1; y < h; ++y) {
      if (!$three.has(x * h + y)) $cells[cur++][x] = $cells[y][x]
    }
    for (let y = cur; y < h; ++y) $cells[y][x] = 0
  }
  $three.clear()
  store.commit('setPendingClears', $three)
  return total
}

export const getThreeBlock = _ => {
  ;($cells = store.state.cells), (h = $cells.height), (w = $cells.width)

  const check = (x, y, ly = 0, lx = 0, ry = 0, rx = 0) =>
    !$three.has((x + lx) * h + y + ly) &&
    !$three.has((x + rx) * h + y + ry) &&
    $cells[y + ly][x + lx] == $cells[y][x] &&
    $cells[y + ry][x + rx] == $cells[y][x]

  const previousSize = $three.size
  for (let y = 1; y < h - 1; ++y) {
    for (let x = 1; x < w - 1; ++x) {
      if ($cells[y][x] <= 0 || $three.has(x * h + y)) continue
      if (check(x, y,  0, -1, 0,  1)) $three.add(x * h + y).add((x - 1) * h + y).add((x + 1) * h + y) // prettier-ignore
      if (check(x, y, -1, -1, 1,  1)) $three.add(x * h + y).add((x - 1) * h + y - 1).add((x + 1) * h + y + 1) // prettier-ignore
      if (check(x, y, -1,  0, 1,  0)) $three.add(x * h + y).add(x * h + y - 1).add(x * h + y + 1) // prettier-ignore
      if (check(x, y, -1,  1, 1, -1)) $three.add(x * h + y).add((x - 1) * h + y + 1).add((x + 1) * h + y - 1) // prettier-ignore
    }
  }
  if ($three.size > previousSize) {
    let delta = -1
    $three.bonus = 0
    for (let x = 1; x < w - 1; ++x) {
      for (let y = 1; y < h; ++y) {
        const xhy = x * h + y
        if ($three.has(xhy)) {
          const diff = xhy - delta
          delta = xhy
          if (diff != h && diff != w && diff > 1) $three.bonus++
        }
      }
    }
    store.commit('setPendingClears', $three)
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
