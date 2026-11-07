<template>
  <div class="jstet-app"
       :class="[
         'theme-' + preferences.theme,
         {
           'reduce-motion': preferences.reducedMotion,
           'is-paused': status === 'paused',
           'is-lab': naiveImplementation
         }
       ]">
    <div class="arcade-console">
      <header class="arcade-header">
        <div class="arcade-brand"
             aria-label="JSTET">
          <span class="arcade-brand__mark"
                aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <span class="arcade-brand__name">JSTET</span>
        </div>

        <div class="mode-switch"
             role="group"
             aria-label="Game mode">
          <button ref="modeTetcolor"
                  type="button"
                  class="mode-switch__button"
                  :aria-pressed="!naiveImplementation && mode === 'tetcolor'"
                  @click="requestMode('tetcolor')">
            TetColor
          </button>
          <button ref="modeClassic"
                  type="button"
                  class="mode-switch__button"
                  :aria-pressed="!naiveImplementation && mode === 'classic'"
                  @click="requestMode('classic')">
            Classic
          </button>
          <button ref="modeLegacy"
                  type="button"
                  class="mode-switch__button"
                  :aria-pressed="naiveImplementation"
                  @click="requestMode('legacy')">
            Legacy
          </button>
        </div>

        <div v-if="!naiveImplementation"
             class="header-actions">
          <button type="button"
                  class="arcade-button arcade-button--primary"
                  aria-label="New game"
                  title="New Game (N)"
                  @click="createStakan">
            <span class="header-action__label">New Game (N)</span>
            <svg class="header-action__icon"
                 viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2.2"
                 stroke-linecap="round"
                 stroke-linejoin="round"
                 aria-hidden="true">
              <path d="M3 11a9 9 0 1 1 2.7 6.4" />
              <path d="M3 4v7h7" />
            </svg>
          </button>
          <button type="button"
                  class="arcade-button"
                  :disabled="status !== 'running' && status !== 'paused'"
                  :aria-label="status === 'paused' ? 'Resume game' : 'Pause game'"
                  :title="status === 'paused' ? 'Resume (P)' : 'Pause (P)'"
                  @click="togglePause">
            <span class="header-action__label">{{ status === 'paused' ? 'Resume (P)' : 'Pause (P)' }}</span>
            <svg class="header-action__icon"
                 viewBox="0 0 24 24"
                 fill="currentColor"
                 aria-hidden="true">
              <path v-if="status === 'paused'"
                    d="M7 4.5v15l12-7.5z" />
              <path v-else
                    d="M6 4h4v16H6zm8 0h4v16h-4z" />
            </svg>
          </button>
          <button ref="settingsTrigger"
                  type="button"
                  class="arcade-button"
                  aria-label="Settings"
                  title="Settings (S)"
                  @click="openSettings">
            <span class="header-action__label">Settings (S)</span>
            <svg class="header-action__icon"
                 viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2"
                 stroke-linecap="round"
                 stroke-linejoin="round"
                 aria-hidden="true">
              <path
                d="M12 2.5l1.8 2.3 2.9-.1.9 2.8 2.6 1.3-.7 2.8 1.3 2.5-2.2 1.9-.5 2.9-2.9.4-2 2.1-2.5-1.4
                   -2.8.7-1.3-2.6-2.8-.9.1-2.9L2.5 12l2.3-1.8-.1-2.9 2.8-.9 1.3-2.6 2.8.7z" />
              <circle cx="12"
                      cy="12"
                      r="3.2" />
            </svg>
          </button>
        </div>
      </header>

      <main v-if="!naiveImplementation"
            class="game-layout"
            :aria-label="modeTitle + ' game'"
            :style="boardGeometry">
        <aside class="dashboard-column"
               aria-label="Level and next piece">
          <CityscapeArt class="cityscape-column"
                        aria-hidden="true" />
          <GameHud class="stats-column stats-column--left"
                   :mode="mode"
                   section="left" />
          <NextPiece class="preview-column" />
        </aside>

        <section class="board-panel"
                 :class="'board-panel--' + mode"
                 aria-label="Playing field">
          <div ref="wellContainer"
               class="board-panel__well">
            <tetcolor />
          </div>
          <Transition name="state-overlay">
            <div v-if="(status === 'paused' || status === 'gameOver') && !settingsOpen"
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
                    {{ status === 'paused' ? 'Resume (P)' : 'New Game (N)' }}
                  </button>
                  <button v-if="status === 'paused'"
                          type="button"
                          class="arcade-button"
                          @click="createStakan">New Game (N)</button>
                </div>
              </div>
            </div>
          </Transition>
        </section>

        <TouchControls :status="status"
                       :hard="hard" />
        <aside class="right-column"
               aria-label="Score and bonus">
          <GameHud class="stats-column stats-column--right"
                   :mode="mode"
                   section="right" />
        </aside>

      </main>

      <main v-else
            class="lab-layout"
            aria-label="Legacy game laboratory">
        <stakan />
      </main>

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
        </fieldset>

        <fieldset class="settings-group">
          <legend>Audio</legend>
          <label class="settings-check">
            <input type="checkbox"
                   v-model="preferences.soundEnabled"
                   @change="persistPreferences">
            Enable sounds
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
import { attachSounds } from '@/utils/sounds.js'
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
      modernDispose: null,
      modernHandlers: [],
      sounds: null,
      previewCellSize: null
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
        '--board-rows': Math.max(1, (height || 19) - 1),
        '--jstet-preview-cell-size': this.previewCellSize ? this.previewCellSize + 'px' : '30px'
      }
    },
    status() {
      return this.$store.state.status
    },
    modeTitle() {
      return this.mode === 'classic' ? 'Classic' : 'TetColor'
    },
    activeSingleBlock() {
      return this.$store.state.options ? this.$store.state.options.singleBlock : options.singleBlock
    }
  },

  watch: {
    naive(value) {
      if (value) this.stopModern()
      else this.startModern()
      // v-if replaces the well element when leaving Legacy. Observe the new
      // element rather than keeping a stale reference to the detached board.
      this.$nextTick(() => this.observeWell())
    },
    status(value) {
      if (value !== 'paused' && value !== 'gameOver') return
      this.$nextTick(() => {
        if (!this.settingsOpen && !this.naive && this.$refs.statePrimary) {
          this.$refs.statePrimary.focus()
        }
      })
    }
  },

  created() {
    this.setOptions(resolveRunOptions(options))
    this.startModern()
  },
  mounted() {
    if (typeof ResizeObserver !== 'undefined') {
      this.wellResizeObserver = new ResizeObserver(() => this.syncPreviewCellSize())
    }
    this.$nextTick(() => this.observeWell())
    window.addEventListener('resize', this.syncPreviewCellSize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.syncPreviewCellSize)
    if (this.wellResizeObserver) this.wellResizeObserver.disconnect()
  },
  unmounted() {
    this.stopModern()
  },

  methods: {
    ...mapMutations(['setCells', 'setPieces', 'setPieceState', 'setLines', 'setScore', 'setBonus', 'setLevel', 'setOptions', 'setStatus']),

    observeWell() {
      if (this.wellResizeObserver) {
        this.wellResizeObserver.disconnect()
        if (this.$refs.wellContainer) this.wellResizeObserver.observe(this.$refs.wellContainer)
      }
      this.syncPreviewCellSize()
    },

    syncPreviewCellSize() {
      const cell = this.$refs.wellContainer?.querySelector('.tetcolor-board .game-cell')
      if (!cell) return
      const size = cell.getBoundingClientRect().width
      if (size > 0 && Math.abs(size - (this.previewCellSize || 0)) > 0.25) {
        this.previewCellSize = size
      }
    },

    togglePause() {
      gameBus.emit('pause')
    },

    persistPreferences() {
      this.preferences = normalizePreferences({ ...this.preferences, hardDrop: this.hard })
      savePreferences(this.preferences)
      if (this.sounds) this.sounds.setEnabled(this.preferences.soundEnabled)
    },

    pauseForDialog() {
      if (this.status === 'running') this.togglePause()
      game.releaseControls()
    },

    focusDialog() {
      this.$nextTick(() => {
        if (this.$refs.dialog) this.$refs.dialog.focus()
      })
    },

    openSettings() {
      if (this.naiveImplementation || this.settingsOpen) return
      this.pauseForDialog()
      this.settingsOpen = true
      this.focusDialog()
    },

    closeSettings() {
      if (!this.settingsOpen) return
      this.settingsOpen = false
      // Closing settings leaves an active session paused until the player resumes.
      this.$nextTick(() => {
        const target = this.$refs.statePrimary || this.$refs.settingsTrigger
        if (target) target.focus()
      })
    },

    requestMode(mode) {
      if (this.settingsOpen || (mode === 'legacy' && this.naiveImplementation)) return
      if (mode === 'legacy') {
        this.naive = true
        return
      }
      if (!this.naiveImplementation && this.mode === mode) return
      this.mode = mode
      if (this.naiveImplementation) {
        // The watcher mounts a fresh modern session with this selected mode.
        this.naive = false
      } else {
        this.createStakan()
      }
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
      this.sounds = attachSounds(gameBus, { enabled: this.preferences.soundEnabled })
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
      this.sounds.dispose()
      this.sounds = null
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
      this.$nextTick(() => this.syncPreviewCellSize())
    },

    onFocusLost() {
      game.releaseControls()
    },
    onFocusIn(e) {
      if (shouldIgnoreGameInput(e.target)) this.onFocusLost()
    },

    onKeyDown(e) {
      if (this.settingsOpen) {
        if (e.code === 'Escape') {
          e.preventDefault()
          this.closeSettings()
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
        KeyN: () => this.createStakan(),
        KeyP: () => gameBus.emit('pause'),
        KeyS: () => this.openSettings(),
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
@import './styles/arcade-mobile.styl'
@import './styles/arcade-rails.styl'
</style>
