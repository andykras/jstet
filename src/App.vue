<template>
  <div id="app">
    <input type="checkbox"
           v-model="naive">naive implementation: {{naiveImplementation}}

    <stakan v-if="naiveImplementation" />
    <div v-else>
      <div>{{hard ? 'hard' : 'soft'}} drop (S)</div>
      <!-- <div>Total lines: {{$store.state.lines}}</div> -->
      <input type="button"
             value="new game"
             @click="createStakan">
      <!-- <simple /> -->
      <tetcolor />
      <div class="options"> {{ $store.state.options }} </div>
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex'
import {
  createStraight,
  createLShape,
  createJShape,
  createSquare,
  createZShape,
  createSShape,
  createTetColor3,
  createTetColor2,
  createTetColor1,
  createTetColorZ
} from '@/utils/tetraminos.js'
import Stakan from '@/utils/stakan.js'
import { setup, game } from '@/utils/game.js'
import { gameBus } from '@/utils/gameBus.js'
import options from '@/game/options.js'

let randomNoise = false

export default {
  name: 'jstet',
  data() {
    return {
      naive: false,
      hard: false
    }
  },

  computed: {
    naiveImplementation() {
      // return false
      // return true
      return this.naive
    }
  },

  mounted() {
    console.log('mounted App')
  },
  created() {
    console.log('created App')
    if (this.naiveImplementation) return

    this.setOptions(options)

    setup(gameBus)

    this.createStakan()
    gameBus.on('update', state => this.setPieceState(state))
    gameBus.on('done', _ => console.log('done'))
    gameBus.on('lines', state => this.setLines(state))
    gameBus.on('score', state => this.setScore(state))
    gameBus.on('bonus', state => this.setBonus(state))
    gameBus.on('level', state => this.setLevel(state))

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  },
  unmounted() {
    game.started = false
    cancelAnimationFrame(game.id)
    gameBus.all.clear()
    console.log('unmounted')

    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  },

  methods: {
    ...mapMutations(['setCells', 'setPieces', 'setPieceState', 'setLines', 'setScore', 'setBonus', 'setLevel', 'setOptions']),

    createStakan() {
      const z = 0
      const pieces = [
        createTetColor3(4, z),
        createTetColor2(4, z),
        createTetColor1(4, z),
        createTetColorZ(4, z)
        // createStraight(2, z),
        // createStraight(4, z),
        // createLShape(4, z),
        // createJShape(4, z),
        // createSquare(0, z),
        // createZShape(2, z),
        // createZShape(4, z),
        // createSShape(2, z),
        // createSShape(4, z)
      ]
      this.setPieces(pieces)
      const extra = randomNoise ? [0.3, 0.1, pieces.length] : []
      const cells = new Stakan(19, 9, 4, ...extra)
      this.setCells(cells)
      this.setLines(0)
      gameBus.emit('start')

      randomNoise = !randomNoise
    },

    onKeyDown(e) {
      // console.log('DOWN', e.code, e.repeat)
      const actions = {
        ArrowDown: _ => gameBus.emit('down:start'),
        ArrowUp: _ => gameBus.emit('rotate:start'),
        ArrowLeft: _ => gameBus.emit('left:start'),
        ArrowRight: _ => gameBus.emit('right:start'),
        KeyY: _ => this.createStakan(),
        KeyP: _ => gameBus.emit('pause'),
        KeyS: _ => (this.hard = !this.hard),
        Space: _ => gameBus.emit('drop', this.hard),
        KeyN: _ => gameBus.emit('next'),
        KeyF: _ => gameBus.emit('fill')
      }
      actions[e.code] && actions[e.code]()
    },
    onKeyUp(e) {
      // console.log('UP', e)

      const actions = {
        ArrowDown: _ => gameBus.emit('down:stop'),
        ArrowUp: _ => gameBus.emit('rotate:stop'),
        ArrowLeft: _ => gameBus.emit('left:stop'),
        ArrowRight: _ => gameBus.emit('right:stop')
      }
      actions[e.code] && actions[e.code]()

      // let p = parseInt(e.key)
      // if (p >= 0 && p < 10) this.setCurrent(p)
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
