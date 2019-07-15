import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    cells: null,
    pieces: null,
    rotate: 0,
    current: 0,
    currX: 3,
    currY: 15
  },
  mutations: {
    setCells(store, cells) {
      store.cells = cells
    },
    setPieces(store, pieces) {
      store.pieces = pieces
    },
    setPieceState(store, { X, Y, R }) {
      store.currX = X
      store.currY = Y
      store.rotate = R
    },
    moveDown(store) {
      store.currY--
    },
    moveLeft(store) {
      store.currX--
    },
    moveRight(store) {
      store.currX++
    },
    doRotate(store) {
      store.rotate++
    },
    setCurrent(store, current) {
      console.assert(current >= 0 && current < store.pieces.length, 'No Piece by this number', { N: current })
      if (current >= 0 && current < store.pieces.length) store.current = current
    }
  },
  getters: {
    getDimensions(state) {
      return {
        height: state.cells && state.cells.length,
        width: state.cells && state.cells[0].length
      }
    },
    getValue: state => (x, y) => {
      const R = state.rotate
      const T = state.current
      return state.pieces[T].get(x - state.currX - 1, y - state.currY - 1, R) || state.cells[y - 1][x - 1]
    }
  }
})
