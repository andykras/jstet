<template>
  <div class="jstet-app"
       :class="['theme-' + preferences.theme, { 'reduce-motion': preferences.reducedMotion, 'is-paused': status === 'paused', 'is-lab': naiveImplementation }]">
    <div class="arcade-console">
      <header class="arcade-header">
        <div class="arcade-brand"
             aria-label="JSTET">
          <span class="arcade-brand__mark"
                aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <span class="arcade-brand__name">JSTET</span>
        </div>

        <div v-if="!naiveImplementation"
             class="mode-switch"
             role="group"
             aria-label="Game mode">
          <button ref="modeTetcolor"
                  type="button"
                  class="mode-switch__button"
                  :aria-pressed="mode === 'tetcolor'"
                  @click="requestMode('tetcolor')">
            TetColor
          </button>
          <button ref="modeClassic"
                  type="button"
                  class="mode-switch__button"
                  :aria-pressed="mode === 'classic'"
                  @click="requestMode('classic')">
            Classic
          </button>
        </div>
        <div v-else
             class="mode-indicator"
             aria-label="Current mode">
          <span class="mode-indicator__dot"
                aria-hidden="true"></span>Legacy Lab
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
          <button ref="settingsTrigger"
                  type="button"
                  class="arcade-button"
                  @click="openSettings">
            Settings
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
            :aria-label="modeTitle + ' game'"
            :style="boardGeometry">
        <CityscapeArt class="cityscape-column"
                      aria-hidden="true" />
        <GameHud class="stats-column"
                 :mode="mode" />

        <section class="board-panel"
                 :class="'board-panel--' + mode"
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
            <span>{{ mode === 'classic' ? 'Clear full lines' : 'Color match' }}</span>
            <span>{{ hard ? 'Hard drop' : 'Soft drop' }} <kbd>S</kbd></span>
          </div>
          <Transition name="state-overlay">
            <div v-if="(status === 'paused' || status === 'gameOver') && !settingsOpen && !pendingMode"
                 class="game-state-overlay"
                 role="dialog"
                 aria-modal="false"
                 aria-labelledby="game-state-heading">
              <div class="game-state-overlay__body">
                <p class="game-state-overlay__eyebrow">{{ status === 'paused' ? 'SESSION ON HOLD' : 'RUN COMPLETE' }}</p>
                <h2 id="game-state-heading">{{ status === 'paused' ? 'PAUSED' : 'GAME OVER' }}</h2>
                <p v-if="status === 'gameOver'"
                   class="game-state-overlay__summary">Final score <strong>{{ $store.state.score.toLocaleString('en-US') }}</strong></p>
                <p v-else
                   class="game-state-overlay__summary">Your board is ready whenever you are.</p>
                <div class="game-state-overlay__actions">
                  <button ref="statePrimary"
                          type="button"
                          class="arcade-button arcade-button--primary"
                          @click="status === 'paused' ? togglePause() : createStakan()">
                    {{ status === 'paused' ? 'Resume' : 'New Game' }}
                  </button>
                  <button v-if="status === 'paused'"
                          type="button"
                          class="arcade-button"
                          @click="createStakan">New Game</button>
                </div>
              </div>
            </div>
          </Transition>
        </section>

        <TouchControls :status="status"
                       :hard="hard" />
        <NextPiece class="preview-column" />

        <aside v-if="preferences.showHelp"
               class="arcade-panel guide-column"
               aria-label="How to play and keyboard controls">
          <h2 class="panel-heading">{{ modeTitle }}</h2>
          <div class="guide-example"
               aria-hidden="true">
            <span v-for="cell in (mode === 'classic' ? 6 : 3)"
                  :key="cell"
                  class="guide-example__block"
                  :class="{ 'guide-example__block--classic': mode === 'classic' }"></span>
          </div>
          <span class="guide-example__caption">{{ mode === 'classic' ? 'FILL A LINE' : 'CONNECT THREE' }}</span>
          <p>{{ modeDescription }}</p>
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
        <p v-if="!naiveImplementation && preferences.showHelp"
           class="arcade-footer__help"><kbd>S</kbd> Drop mode · <kbd>Y</kbd> New Game · <kbd>P</kbd> Pause</p>
        <span v-else>{{ naiveImplementation ? 'Legacy game laboratory' : modeTitle }}</span>
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

    <div v-if="settingsOpen"
         class="settings-backdrop"
         @click.self="closeSettings">
      <section ref="dialog"
               class="arcade-dialog"
               role="dialog"
               aria-modal="true"
               aria-labelledby="settings-heading"
               tabindex="-1">
        <div class="dialog-header">
          <h2 id="settings-heading">Settings</h2>
          <button type="button"
                  class="dialog-close"
                  aria-label="Close settings"
                  @click="closeSettings">×</button>
        </div>
        <fieldset class="settings-group">
          <legend>Appearance</legend>
          <label class="settings-field">
            <span>Theme</span>
            <select v-model="preferences.theme"
                    @change="persistPreferences">
              <option value="arcade">Arcade</option>
              <option value="prism">Prism</option>
            </select>
          </label>
          <label class="settings-check">
            <input type="checkbox"
                   v-model="preferences.reducedMotion"
                   @change="persistPreferences">
            Reduced motion
          </label>
          <label class="settings-check">
            <input type="checkbox"
                   v-model="preferences.showHelp"
                   @change="persistPreferences">
            Show keyboard help
          </label>
        </fieldset>

        <fieldset class="settings-group">
          <legend>Controls</legend>
          <label class="settings-check">
            <input type="checkbox"
                   v-model="hard"
                   @change="persistPreferences">
            Hard drop on Space
          </label>
          <p class="settings-hint">Applies immediately. Press S to toggle during a game.</p>
        </fieldset>

        <fieldset class="settings-group">
          <legend>Next game</legend>
          <label class="settings-field">
            <span>{{ mode === 'classic' ? 'Clear lines' : 'Clear matches' }}</span>
            <select v-model="pendingSingleBlock">
              <option :value="true">One at a time</option>
              <option :value="false">All at once</option>
            </select>
          </label>
          <p class="settings-hint">Changes the clearing sequence and takes effect on your next game.</p>
          <p v-if="pendingSingleBlock !== activeSingleBlock"
             class="settings-note">This rule change is queued for the next game.</p>
        </fieldset>

        <div class="dialog-actions">
          <button type="button"
                  class="arcade-button arcade-button--primary"
                  @click="closeSettings">Done</button>
        </div>
      </section>
    </div>

    <div v-if="pendingMode"
         class="settings-backdrop"
         @click.self="cancelMode">
      <section ref="dialog"
               class="arcade-dialog"
               role="dialog"
               aria-modal="true"
               aria-labelledby="mode-confirm-heading"
               tabindex="-1">
        <h2 id="mode-confirm-heading">Start {{ pendingModeTitle }}?</h2>
        <p>Your current game will be discarded. A new {{ pendingModeTitle }} game will start immediately.</p>
        <div class="dialog-actions">
          <button type="button"
                  class="arcade-button"
                  @click="cancelMode">Keep playing</button>
          <button type="button"
                  class="arcade-button arcade-button--primary"
                  @click="confirmMode">Start {{ pendingModeTitle }}</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex'
import GameHud from '@/components/GameHud.vue'
import CityscapeArt from '@/components/CityscapeArt.vue'
import NextPiece from '@/components/NextPiece.vue'
import TouchControls from '@/components/TouchControls.vue'
import { createGameBoard, createGamePieces } from '@/game/modes.js'
import { loadPreferences, normalizePreferences, savePreferences } from '@/utils/preferences.js'
import { setup, game } from '@/utils/game.js'
import { gameBus } from '@/utils/gameBus.js'
import { shouldIgnoreGameInput } from '@/utils/keyboard.js'
import options, { resolveRunOptions } from '@/game/options.js'

export default {
  name: 'JstetApp',
  components: { GameHud, NextPiece, CityscapeArt, TouchControls },
  data() {
    const preferences = loadPreferences()
    return {
      naive: false,
      mode: 'tetcolor',
      hard: preferences.hardDrop,
      preferences,
      pendingSingleBlock: options.singleBlock,
      settingsOpen: false,
      pendingMode: null,
      modalWasRunning: false,
      modernDispose: null,
      modernHandlers: []
    }
  },

  computed: {
    naiveImplementation() {
      return this.naive
    },
    boardGeometry() {
      const { width, height } = this.$store.getters.getDimensions
      return {
        '--board-columns': Math.max(1, (width || 9) - 2),
        '--board-rows': Math.max(1, (height || 19) - 1)
      }
    },
    status() {
      return this.$store.state.status
    },
    statusLabel() {
      if (this.status === 'gameOver') return 'GAME OVER'
      if (this.status === 'paused') return 'PAUSED'
      return this.status === 'running' ? 'PLAYING' : 'READY'
    },
    modeTitle() {
      return this.mode === 'classic' ? 'Classic' : 'TetColor'
    },
    pendingModeTitle() {
      return this.pendingMode === 'classic' ? 'Classic' : 'TetColor'
    },
    modeDescription() {
      return this.mode === 'classic'
        ? 'Stack falling tetrominoes and clear complete horizontal lines.'
        : 'Connect three or more matching blocks horizontally, vertically or diagonally.'
    },
    activeSingleBlock() {
      return this.$store.state.options ? this.$store.state.options.singleBlock : options.singleBlock
    }
  },

  watch: {
    naive(value) {
      if (value) this.stopModern()
      else this.startModern()
    },
    status(value) {
      if (value !== 'paused' && value !== 'gameOver') return
      this.$nextTick(() => {
        if (!this.settingsOpen && !this.pendingMode && !this.naive && this.$refs.statePrimary) {
          this.$refs.statePrimary.focus()
        }
      })
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

    togglePause() {
      gameBus.emit('pause')
    },

    persistPreferences() {
      this.preferences = normalizePreferences({ ...this.preferences, hardDrop: this.hard })
      savePreferences(this.preferences)
    },

    pauseForDialog() {
      this.modalWasRunning = this.status === 'running'
      if (this.modalWasRunning) this.togglePause()
      game.releaseControls()
    },

    focusDialog() {
      this.$nextTick(() => {
        if (this.$refs.dialog) this.$refs.dialog.focus()
      })
    },

    openSettings() {
      if (this.naiveImplementation || this.settingsOpen || this.pendingMode) return
      this.pauseForDialog()
      this.settingsOpen = true
      this.focusDialog()
    },

    closeSettings() {
      if (!this.settingsOpen) return
      this.settingsOpen = false
      if (this.modalWasRunning && this.status === 'paused') this.togglePause()
      this.modalWasRunning = false
      this.$nextTick(() => {
        if (this.$refs.settingsTrigger) this.$refs.settingsTrigger.focus()
      })
    },

    requestMode(mode) {
      if (mode === this.mode || this.naiveImplementation || this.pendingMode || this.settingsOpen) return
      if (this.status !== 'running' && this.status !== 'paused') {
        this.mode = mode
        this.createStakan()
        return
      }
      this.pauseForDialog()
      this.pendingMode = mode
      this.focusDialog()
    },

    cancelMode() {
      if (!this.pendingMode) return
      const origin = this.pendingMode
      this.pendingMode = null
      if (this.modalWasRunning && this.status === 'paused') this.togglePause()
      this.modalWasRunning = false
      this.$nextTick(() => {
        const ref = origin === 'classic' ? this.$refs.modeClassic : this.$refs.modeTetcolor
        if (ref) ref.focus()
      })
    },

    confirmMode() {
      if (!this.pendingMode) return
      const selected = this.pendingMode
      this.pendingMode = null
      this.modalWasRunning = false
      this.mode = selected
      this.createStakan()
      this.$nextTick(() => {
        const ref = selected === 'classic' ? this.$refs.modeClassic : this.$refs.modeTetcolor
        if (ref) ref.focus()
      })
    },

    trapDialogFocus(e) {
      const dialog = this.$refs.dialog
      if (!dialog) return
      const focusable = Array.from(dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled)'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        e.preventDefault()
        first.focus()
      }
    },

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
      const rules = resolveRunOptions({
        ...this.$store.state.options,
        tetcolor: this.mode === 'tetcolor',
        singleBlock: this.pendingSingleBlock
      })
      this.setOptions(rules)
      this.setPieces(createGamePieces(this.mode))
      this.setCells(createGameBoard(this.mode))
      gameBus.emit('start', rules)
    },

    onFocusLost() {
      game.releaseControls()
    },
    onFocusIn(e) {
      if (shouldIgnoreGameInput(e.target)) this.onFocusLost()
    },

    onKeyDown(e) {
      if (this.settingsOpen || this.pendingMode) {
        if (e.code === 'Escape') {
          e.preventDefault()
          if (this.settingsOpen) this.closeSettings()
          else this.cancelMode()
        } else if (e.code === 'Tab') {
          this.trapDialogFocus(e)
        }
        return
      }
      // Space/Enter on a focused touch button should activate that button, not also drop a piece.
      if (e.target && e.target.closest && e.target.closest('.touch-pad') &&
        (e.code === 'Space' || e.code === 'Enter')) return
      if (!this.modernDispose || e.repeat || e.altKey || e.ctrlKey || e.metaKey || shouldIgnoreGameInput(e.target)) return
      const actions = {
        ArrowDown: () => gameBus.emit('down:start'),
        ArrowUp: () => gameBus.emit('rotate:start'),
        ArrowLeft: () => gameBus.emit('left:start'),
        ArrowRight: () => gameBus.emit('right:start'),
        KeyY: () => this.createStakan(),
        KeyP: () => gameBus.emit('pause'),
        KeyS: () => {
          this.hard = !this.hard
          this.persistPreferences()
        },
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
@import './styles/arcade-stage4.styl'
@import './styles/arcade-stage5.styl'
@import './styles/arcade-responsive.styl'
</style>
