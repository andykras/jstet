import { createStore } from 'vuex'

export default createStore({
  state: {
    cells: null,
    pendingClears: Object.freeze(new Set()),
    pieces: null,
    item: null,
    lines: 0,
    score: 0,
    bonus: 0,
    level: 0,
    status: 'idle',
    options: null
  },
  mutations: {
    setCells(state, cells) {
      state.cells = Object.freeze(cells)
    },
    setPendingClears(state, cells) {
      state.pendingClears = Object.freeze(new Set(cells))
    },
    setPieces(state, pieces) {
      state.pieces = Object.freeze(pieces)
    },
    setPieceState(state, item) {
      state.item = Object.freeze(item)
      // state.item = item
    },
    setLines(state, lines) {
      state.lines = lines
    },
    setScore(state, score) {
      state.score = score
    },
    setBonus(state, bonus) {
      state.bonus = bonus
    },
    setLevel(state, level) {
      state.level = level
    },
    setOptions(state, options) {
      state.options = options
    },
    setStatus(state, status) {
      state.status = status
    }
  },
  getters: {
    getDimensions({ cells }) {
      return {
        height: cells && cells.height,
        width: cells && cells.width
      }
    },
    getSize({ pieces, item }) {
      return pieces && item && pieces[item.N].size
    },
    getWellValue: ({ cells, pendingClears, pieces, item, lines }) => (x, y) => {
      const value = pendingClears.has((x - 1) * cells.height + y - 1) ? -2 : cells[y - 1][x - 1]
      if (!item) return value + lines
      const { T, X, Y, R } = item
      return pieces[T].get(x - X - 1, y - Y - 1, R) || value
    },
    getNextValue: ({ pieces, item, lines }) => (x, y) => {
      if (!item) return lines
      const { N } = item
      return pieces[N].get(x - 1, y - 1, 0) || 0
    }
  }
})
