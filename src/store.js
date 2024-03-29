import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    cells: null,
    pieces: null,
    item: null,
    lines: 0,
    score: 0,
    bonus: 0,
    level: 0,
    options: null
  },
  mutations: {
    setCells(state, cells) {
      state.cells = Object.freeze(cells)
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
    getWellValue: ({ cells, pieces, item, lines }) => (x, y) => {
      if (!item) return cells[y - 1][x - 1] + lines
      const { T, X, Y, R } = item
      return pieces[T].get(x - X - 1, y - Y - 1, R) || cells[y - 1][x - 1]
    },
    getNextValue: ({ pieces, item, lines }) => (x, y) => {
      if (!item) return lines
      const { N } = item
      return pieces[N].get(x - 1, y - 1, 0) || 0
    }
  }
})
