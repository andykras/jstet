import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    cells: null,
    pieces: null,
    rotate: 0,
    current: -1,
    next: -1,
    currX: 1000,
    currY: 1000
  },
  mutations: {
    setCells(store, cells) {
      store.cells = cells
    },
    setPieces(store, pieces) {
      store.pieces = pieces
    },
    setPieceState(store, { currX, currY, rotate, current, next }) {
      // ;[store.currX, store.currY, store.rotate, store.current, store.next] = [currX, currY, rotate, current, next]
      store.currX = currX
      store.currY = currY
      store.rotate = rotate
      store.current = current
      store.next = next
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
        height: state.cells && state.cells.height,
        width: state.cells && state.cells.width
      }
    },
    getValue: state => (x, y) => {
      const R = state.rotate
      const T = Math.max(0, state.current)
      return state.pieces[T].get(x - state.currX - 1, y - state.currY - 1, R) || state.cells[y - 1][x - 1]
    }
  }
})
