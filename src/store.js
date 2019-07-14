import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    pieces: null,
    rotates: null,
    cells: null,
    rotate: 0,
    current: 0,
    currX: 3,
    currY: 15
  },
  mutations: {
    setCells(store, cells) {
      store.cells = cells
    },
    setPieces(store, { pieces, rotates }) {
      store.pieces = pieces
      store.rotates = rotates
    },
    setPieceState(store, { currX, currY, rotate }) {
      store.currX = currX
      store.currY = currY
      store.rotate = rotate
    },
    setCurrent(store, current) {
      if (current >= 0 && current < store.pieces.length) store.current = current
    }
  },
  getters: {
    getDimensions(state) {
      return {
        height: state.cells.length,
        width: state.cells[0].length
      }
    },
    getSize: state => T => {
      return state.pieces[T].length
    },

    getPiece: (state, getters) => (T, x, y, R) => {
      const N = getters.getSize(T)
      // R = R % 4
      R = R % state.rotates[T]
      switch (R) {
        case 1:
          ;[x, y] = [N - y - 1, x]
          break
        case 2:
          ;[x, y] = [N - x - 1, N - y - 1]
          break
        case 3:
          ;[x, y] = [y, N - x - 1]
          break
      }
      return state.pieces[T][y] && state.pieces[T][y][x]
    },
    getValue: (state, getters) => (x, y) => {
      const R = state.rotate
      const T = state.current
      return (
        getters.getPiece(T, x - state.currX - 1, y - state.currY - 1, R) ||
        //
        state.cells[y - 1][x - 1]
      )
    }
  },
  actions: {}
})
