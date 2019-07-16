<template>
  <div id="app">
    <stakan v-if="naiveImplementation" />
    <div v-else>
      <input type="button"
             value="new"
             @click="createStakan">
      <simple />
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex'
import { straight, rowL, rowJ, square, domZ } from '@/utils/tetraminos.js'
import Stakan from '@/utils/stakan.js'
import { newGame, setEventHandler } from '@/utils/game.js'

let randomNoise = false

export default {
  name: 'jstet',

  computed: {
    naiveImplementation() {
      return false
      // return true
    }
  },

  mounted() {
    console.log('mounted App')
  },
  created() {
    console.log('created App')

    setEventHandler(this)

    this.createStakan()
    this.$on('update', state => this.setPieceState(state))

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  },
  destroyed() {
    console.log('destroyed')

    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  },

  methods: {
    ...mapMutations(['setCells', 'setPieces', 'setPieceState', 'setCurrent', 'moveDown', 'moveLeft', 'moveRight', 'doRotate']),

    createStakan() {
      const z = 0
      const pieces = [straight(2, z), straight(4, z), rowL(4, z), rowJ(4, z), square(0, z), domZ(2, z), domZ(4, z)]
      this.setPieces(pieces)
      const extra = randomNoise ? [0.3, 0.1, pieces.length] : []
      const cells = new Stakan(20, 20, 4, ...extra)
      this.setCells(cells)
      newGame(cells, pieces)
      randomNoise = !randomNoise
    },

    onKeyDown(e) {
      // console.log('DOWN', e.code, e.repeat)
      const actions = {
        ArrowDown: _ => this.$emit('down:start'),
        ArrowUp: _ => this.$emit('rotate:start'),
        ArrowLeft: _ => this.$emit('left:start'),
        ArrowRight: _ => this.$emit('right:start')
      }
      actions[e.code] && actions[e.code]()
    },
    onKeyUp(e) {
      // console.log('UP', e)

      const actions = {
        ArrowDown: _ => this.$emit('down:stop'),
        ArrowUp: _ => this.$emit('rotate:stop'),
        ArrowLeft: _ => this.$emit('left:stop'),
        ArrowRight: _ => this.$emit('right:stop')
      }
      actions[e.code] && actions[e.code]()

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
