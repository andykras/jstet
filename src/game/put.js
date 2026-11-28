import store from '@/store'
// import { game } from '@/utils/game'

const put = ({ X, Y, R, T }) => {
  const $cells = store.state.cells
  const $pieces = store.state.pieces

  const S = $pieces[T].size
  let success = false
  for (let y = 0; y < S; y++) {
    if (Y + y > $cells.height - 1) return false
    for (let x = 0; x < S; x++) {
      const cell = $pieces[T].get(x, y, R)
      if (cell > 0 && $cells[Y + y]) {
        $cells[Y + y][X + x] = cell
        success = true
      }
    }
  }
  return success
}

export { put }
