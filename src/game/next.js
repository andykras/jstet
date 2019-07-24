import store from '@/store'
import { game } from '@/utils/game'

const rand = L => Math.floor(Math.random() * L)

const next = N => {
  const $cells = store.state.cells
  const $pieces = store.state.pieces
  N = Number.isInteger(N) ? N : rand($pieces.length)

  const item = {
    T: N,
    N: N,
    X: Math.round(($cells.width - $pieces[N].size) / 2),
    Y: $cells.height - (game.tetcolor ? 2 : 1),
    R: 0
  }

  while (item.T == item.N) item.N = rand($pieces.length)

  if (game.tetcolor) {
    const maxColors = 6
    $pieces[item.N].forEach(row =>
      row.forEach((col, i) => {
        if (col > 0) row[i] = 1 + Math.floor(Math.random() * maxColors)
      })
    )
  }
  game.drop = Math.max(0, game.drop - 1)
  return item
}

export { next }
