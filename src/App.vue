<template>
  <div id="app">
    <stakan />
    <!-- <input type="button"
           value="new"
           @click="createStakan">
    <simple /> -->
  </div>
</template>

<script>
import { mapMutations } from 'vuex'
import { straight, rowL, rowJ, square, domZ } from '@/utils/tetraminos.js'
import Stakan from '@/utils/stakan.js'

let randomNoise = false

export default {
  name: 'jstet',

  mounted() {
    console.log('mounted App')
  },
  created() {
    console.log('created App')

    this.createStakan()

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  },
  destroyed() {
    console.log('destroyed')

    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  },

  methods: {
    ...mapMutations(['setCells', 'setPieces', 'setCurrent', 'moveDown', 'moveLeft', 'moveRight', 'doRotate']),

    createStakan() {
      const z = 0
      const pieces = [straight(2, z), straight(4, z), rowL(4, z), rowJ(4, z), square(0, z), domZ(2, z), domZ(4, z)]
      this.setPieces(pieces)
      const extra = randomNoise ? [0.5, 0.38, pieces.length] : []
      const cells = new Stakan(20, 10, 4, ...extra)
      this.setCells(cells)
      randomNoise = !randomNoise
    },

    onKeyDown(e) {
      // console.log('DOWN', e)
      const actions = {
        ArrowDown: _ => this.moveDown(),
        ArrowUp: _ => this.doRotate(),
        ArrowLeft: _ => this.moveLeft(),
        ArrowRight: _ => this.moveRight()
      }
      actions[e.code] && actions[e.code]()
    },
    onKeyUp(e) {
      // console.log('UP', e)
      let p = parseInt(e.key)
      if (p >= 0 && p < 10) this.setCurrent(p)
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
