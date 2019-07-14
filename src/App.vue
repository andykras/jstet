<template>
  <div id="app">
    <stakan />
    <!-- <piece /> -->
    <!-- <simple v-if="cells" /> -->
  </div>
</template>

<script>
import { mapState, mapMutations, mapActions, mapGetters } from 'vuex'

export default {
  name: 'app',

  data: _ => ({
    cells: null, // stakan,
    h: 20,
    w: 10,
    dim: 4 // figure size
  }),

  mounted() {
    console.log('mounted App')
  },
  created() {
    console.log('created App')
    const z = -2
    const pieces = []
    pieces.push([[z, 1], [z, 1], [z, 1], [z, 1]])
    pieces.push([[z, z, 1], [z, z, 1], [z, z, 1], [z, z, 1]])
    pieces.push([[z, 6], [z, 6], [z, 6, 6]])
    pieces.push([[4, 4], [4, 4]])
    pieces.push([[z, 7], [z, 7], [7, 7]])
    const rotates = [2, 4, 4, 0, 4]
    this.setPieces({ pieces, rotates })

    // this.cells = this.createStakan(this.h, this.w, this.dim, 0.5, 0.38, pieces.length)
    this.cells = this.createStakan(this.h, this.w, this.dim)
    this.setCells(this.cells)

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  },
  destroyed() {
    console.log('destroyed')

    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  },

  computed: {
    ...mapState(['currX', 'currY', 'rotate']),
    ...mapGetters(['getValue']),
    getCells() {
      return this.cells
    }
  },
  methods: {
    ...mapMutations(['setCells', 'setPieces', 'setPieceState', 'setCurrent']),

    onKeyDown(e) {
      // console.log('DOWN', e)

      if (e.code == 'ArrowDown') {
        this.setPieceState({ currX: this.currX, currY: this.currY - 1, rotate: this.rotate })
      } else if (e.code == 'ArrowUp') {
        this.setPieceState({ currX: this.currX, currY: this.currY, rotate: this.rotate + 1 })
      } else if (e.code == 'ArrowLeft') {
        this.setPieceState({ currX: this.currX - 1, currY: this.currY, rotate: this.rotate })
      } else if (e.code == 'ArrowRight') {
        this.setPieceState({ currX: this.currX + 1, currY: this.currY, rotate: this.rotate })
      }
    },
    onKeyUp(e) {
      // console.log('UP', e)
      let p = parseInt(e.key)
      if (p > 0 && p < 10) {
        this.setCurrent(p - 1)
      }
    },
    createStakan(h, w, dim, part = 0, density = 0, pieces = 0) {
      const borderValue = -1
      const emptySpaceValue = 0
      const checkBorder = (x, y) => x == 0 || x == w - 1 || y == 0
      const emptySpace = y => (randomCell(y) ? cellValue() : emptySpaceValue)
      const randomCell = y => y < h * part && Math.random() < density
      const cellValue = _ => 1 + Math.floor(Math.random() * pieces)
      return Array.from({ length: h + dim }, (_, y) =>
        Array.from({ length: w }, (_, x) =>
          // place border, empty space or some random piece here
          checkBorder(x, y) ? borderValue : emptySpace(y)
        )
      )
    }
  }
}
</script>
<style lang="stylus">
#app {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale
  margin-top: 60px
  // display: flex
  // flex-direction: column
  // align-items: center
}
</style>
