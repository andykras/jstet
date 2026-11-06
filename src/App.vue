<template>
  <div class="jstet-app">
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
import { createTetColor3, createTetColor2, createTetColor1, createTetColorZ } from '@/utils/tetraminos.js'
import Stakan from '@/utils/stakan.js'
import { setup, game } from '@/utils/game.js'
import { gameBus } from '@/utils/gameBus.js'
import { shouldIgnoreGameInput } from '@/utils/keyboard.js'
import options, { resolveRunOptions } from '@/game/options.js'

export default {
  name: 'jstet',
  data() {
    return {
      naive: false,
      hard: false,
      modernDispose: null,
      modernHandlers: []
    }
  },

  computed: {
    naiveImplementation() {
      return this.naive
    }
  },

  watch: {
    naive(value) {
      if (value) this.stopModern()
      else this.startModern()
    }
  },

  created() {
    this.setOptions(resolveRunOptions(options))
    this.startModern()
  },
  unmounted() {
    this.stopModern()
  },

  methods: {
    ...mapMutations(['setCells', 'setPieces', 'setPieceState', 'setLines', 'setScore', 'setBonus', 'setLevel', 'setOptions', 'setStatus']),

    startModern() {
      if (this.modernDispose) return
      this.modernDispose = setup(gameBus)

      const on = (type, listener) => {
        gameBus.on(type, listener)
        this.modernHandlers.push([type, listener])
      }
      on('update', state => this.setPieceState(state))
      on('status', status => this.setStatus(status))
      on('lines', value => this.setLines(value))
      on('score', value => this.setScore(value))
      on('bonus', value => this.setBonus(value))
      on('level', value => this.setLevel(value))

      window.addEventListener('keydown', this.onKeyDown)
      window.addEventListener('keyup', this.onKeyUp)
      window.addEventListener('blur', this.onFocusLost)
      window.addEventListener('focusin', this.onFocusIn)
      this.createStakan()
    },

    stopModern() {
      if (!this.modernDispose) return
      window.removeEventListener('keydown', this.onKeyDown)
      window.removeEventListener('keyup', this.onKeyUp)
      window.removeEventListener('blur', this.onFocusLost)
      window.removeEventListener('focusin', this.onFocusIn)
      this.modernDispose()
      this.modernDispose = null
      for (const [type, listener] of this.modernHandlers) gameBus.off(type, listener)
      this.modernHandlers = []
    },

    createStakan() {
      if (!this.modernDispose) return
      const z = 0
      const pieces = [
        createTetColor3(4, z),
        createTetColor2(4, z),
        createTetColor1(4, z),
        createTetColorZ(4, z)
      ]
      this.setPieces(pieces)
      this.setCells(new Stakan(19, 9, 4))
      gameBus.emit('start', this.$store.state.options)
    },

    onFocusLost() {
      game.releaseControls()
    },
    onFocusIn(e) {
      if (shouldIgnoreGameInput(e.target)) this.onFocusLost()
    },

    onKeyDown(e) {
      if (!this.modernDispose || e.repeat || e.altKey || e.ctrlKey || e.metaKey || shouldIgnoreGameInput(e.target)) return
      const actions = {
        ArrowDown: () => gameBus.emit('down:start'),
        ArrowUp: () => gameBus.emit('rotate:start'),
        ArrowLeft: () => gameBus.emit('left:start'),
        ArrowRight: () => gameBus.emit('right:start'),
        KeyY: () => this.createStakan(),
        KeyP: () => gameBus.emit('pause'),
        KeyS: () => (this.hard = !this.hard),
        Space: () => gameBus.emit('drop', this.hard)
      }
      const action = actions[e.code]
      if (!action) return
      e.preventDefault()
      action()
    },

    onKeyUp(e) {
      if (!this.modernDispose) return
      const actions = {
        ArrowDown: 'down:stop',
        ArrowUp: 'rotate:stop',
        ArrowLeft: 'left:stop',
        ArrowRight: 'right:stop'
      }
      const type = actions[e.code]
      if (!type) return
      if (!shouldIgnoreGameInput(e.target)) e.preventDefault()
      gameBus.emit(type)
    }
  }
}
</script>
<style lang="stylus">
.jstet-app {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale
  margin-top: 60px
  // display: flex
  // flex-direction: column
  // align-items: center
}
</style>
