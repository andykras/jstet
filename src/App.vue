<template>
  <div class="jstet-app">
    <div class="arcade-console">
      <header class="arcade-header">
        <div class="arcade-brand"
             aria-label="JSTET">
          <span class="arcade-brand__mark"
                aria-hidden="true">
            <i></i><i></i><i></i><i></i>
          </span>
          <span class="arcade-brand__name">JSTET</span>
        </div>
        <div class="mode-indicator"
             aria-label="Current game mode">
          <span class="mode-indicator__dot"
                aria-hidden="true"></span>
          <span>{{ naiveImplementation ? 'Legacy Lab' : 'TetColor' }}</span>
        </div>
        <div v-if="!naiveImplementation"
             class="header-actions">
          <button type="button"
                  class="arcade-button arcade-button--primary"
                  @click="createStakan">
            New Game
          </button>
          <button type="button"
                  class="arcade-button"
                  :disabled="status !== 'running' && status !== 'paused'"
                  @click="togglePause">
            {{ status === 'paused' ? 'Resume' : 'Pause' }}
          </button>
        </div>
        <button v-else
                type="button"
                class="arcade-button"
                @click="naive = false">
          Back to game
        </button>
      </header>

      <main v-if="!naiveImplementation"
            class="game-layout"
            aria-label="TetColor game">
        <GameHud class="stats-column" />

        <section class="board-panel"
                 aria-label="Playing field">
          <div class="board-panel__top">
            <span class="panel-eyebrow">PLAYFIELD / 01</span>
            <span class="game-status"
                  :class="'game-status--' + status"
                  role="status"
                  aria-live="polite">{{ statusLabel }}</span>
          </div>
          <div class="board-panel__well">
            <tetcolor />
          </div>
          <div class="board-panel__bottom">
            <span>Color match</span>
            <span>{{ hard ? 'Hard drop' : 'Soft drop' }} <kbd>S</kbd></span>
          </div>
        </section>

        <NextPiece class="preview-column" />

        <aside class="arcade-panel guide-column"
               aria-label="How to play and keyboard controls">
          <h2 class="panel-heading">TetColor</h2>
          <p>Connect three or more matching blocks horizontally, vertically or diagonally.</p>
          <div class="guide-divider"></div>
          <h3>Controls</h3>
          <dl class="control-guide">
            <div><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Move</dd></div>
            <div><dt><kbd>↑</kbd></dt><dd>Rotate</dd></div>
            <div><dt><kbd>↓</kbd></dt><dd>Down</dd></div>
            <div><dt><kbd>Space</kbd></dt><dd>Drop</dd></div>
            <div><dt><kbd>P</kbd></dt><dd>Pause</dd></div>
          </dl>
        </aside>
      </main>

      <main v-else
            class="lab-layout"
            aria-label="Legacy game laboratory">
        <p class="lab-layout__notice">Legacy implementation — development view</p>
        <stakan />
      </main>

      <footer class="arcade-footer">
        <p v-if="!naiveImplementation"
           class="arcade-footer__help"><kbd>S</kbd> Drop mode · <kbd>Y</kbd> New Game · <kbd>P</kbd> Pause</p>
        <span v-else>Legacy game laboratory</span>
        <details class="lab-entry">
          <summary>Developer lab</summary>
          <label>
            <input type="checkbox"
                   v-model="naive">
            Legacy engine
          </label>
        </details>
      </footer>
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex'
import GameHud from '@/components/GameHud.vue'
import NextPiece from '@/components/NextPiece.vue'
import { createTetColor3, createTetColor2, createTetColor1, createTetColorZ } from '@/utils/tetraminos.js'
import Stakan from '@/utils/stakan.js'
import { setup, game } from '@/utils/game.js'
import { gameBus } from '@/utils/gameBus.js'
import { shouldIgnoreGameInput } from '@/utils/keyboard.js'
import options, { resolveRunOptions } from '@/game/options.js'

export default {
  name: 'JstetApp',
  components: { GameHud, NextPiece },
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
    },
    status() {
      return this.$store.state.status
    },
    statusLabel() {
      if (this.status === 'gameOver') return 'GAME OVER'
      if (this.status === 'paused') return 'PAUSED'
      return this.status === 'running' ? 'PLAYING' : 'READY'
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
    togglePause() {
      gameBus.emit('pause')
    },
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
@import './styles/arcade-shell.styl'
</style>
