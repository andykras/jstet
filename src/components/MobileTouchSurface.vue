<template>
  <section class="mobile-touch-surface"
           :class="{ 'mobile-touch-surface--inactive': !enabled }"
           aria-label="Touch controls: tap left or right of the board to move, tap the board to rotate, swipe down anywhere to drop"
           @pointerdown="onPointerDown"
           @pointermove="onPointerMove"
           @pointerup="onPointerUp"
           @pointercancel="onPointerCancel"
           @lostpointercapture="onPointerCancel"
           @contextmenu.prevent>
    <TransitionGroup name="touch-hint-fade"
                     tag="div"
                     class="mobile-touch-surface__hints"
                     aria-hidden="true">
      <span v-if="showHint('left')"
            key="left"
            class="mobile-touch-surface__hint mobile-touch-surface__hint--left">
        <svg class="mobile-touch-surface__hint-icon"
             viewBox="0 0 32 32"
             fill="none"
             stroke="currentColor"
             stroke-width="3.8"
             stroke-linecap="round"
             stroke-linejoin="round"
             aria-hidden="true"><path d="M27 16H5 M14 7l-9 9 9 9" /></svg>
        <span>MOVE</span>
      </span>
      <span v-if="showHint('right')"
            key="right"
            class="mobile-touch-surface__hint mobile-touch-surface__hint--right">
        <span>MOVE</span>
        <svg class="mobile-touch-surface__hint-icon"
             viewBox="0 0 32 32"
             fill="none"
             stroke="currentColor"
             stroke-width="3.8"
             stroke-linecap="round"
             stroke-linejoin="round"
             aria-hidden="true"><path d="M5 16h22 M18 7l9 9-9 9" /></svg>
      </span>
      <span v-if="showHint('rotate')"
            key="rotate"
            class="mobile-touch-surface__hint mobile-touch-surface__hint--rotate">
        <svg class="mobile-touch-surface__hint-icon"
             viewBox="0 0 32 32"
             fill="none"
             stroke="currentColor"
             stroke-width="3.4"
             stroke-linecap="round"
             stroke-linejoin="round"
             aria-hidden="true"><path d="M26 13A11 11 0 1 0 27 19 M26 5v8h-8" /></svg>
        <span>TAP</span>
      </span>
      <span v-if="showHint('drop')"
            key="drop"
            class="mobile-touch-surface__hint mobile-touch-surface__hint--drop">
        <svg class="mobile-touch-surface__hint-icon mobile-touch-surface__hint-icon--drop"
             viewBox="0 0 32 32"
             fill="none"
             stroke="currentColor"
             stroke-width="3.8"
             stroke-linecap="round"
             stroke-linejoin="round"
             aria-hidden="true"><path d="M16 4v23 M7 19l9 9 9-9" /></svg>
        <span>SWIPE · DROP</span>
      </span>
    </TransitionGroup>
    <span v-for="warp in warps"
          :key="warp.id"
          class="mobile-touch-surface__warp"
          :class="'mobile-touch-surface__warp--' + warp.kind"
          :style="{ left: warp.x + 'px', top: warp.y + 'px' }"
          aria-hidden="true"></span>
  </section>
</template>

<script>
import { gameBus } from '@/utils/gameBus.js'
import { createTouchInput } from '@/utils/touchInput.js'
import { isSwipeDrop, isTap, pickZone } from '@/utils/touchGestures.js'

const SWIPE_DISTANCE = 36
const TAP_TOLERANCE = 18
const WARP_DURATION = Object.freeze({ tap: 280, swipe: 300 })

export default {
  name: 'MobileTouchSurface',
  props: {
    status: { type: String, required: true },
    hard: { type: Boolean, default: false },
    touchFxEnabled: { type: Boolean, default: true },
    reducedMotion: { type: Boolean, default: false },
    showHints: { type: Boolean, default: true },
    hintGamesSeen: { type: Number, default: 0 }
  },
  data() {
    return {
      hintsActive: false,
      hintActions: [],
      warps: [],
      nextWarpId: 0
    }
  },
  computed: {
    enabled() {
      return this.status === 'running'
    }
  },
  watch: {
    enabled(value) {
      if (!value) this.releaseAll()
    },
    showHints(value) {
      if (!value) this.hintsActive = false
    },
    touchFxEnabled(value) {
      if (!value) this.clearWarps()
    },
    reducedMotion(value) {
      if (value) this.clearWarps()
    }
  },
  created() {
    this.input = createTouchInput(command => gameBus.emit(command))
    this.pointers = new Map()
    this.warpTimers = new Map()
  },
  mounted() {
    window.addEventListener('blur', this.releaseAll)
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    gameBus.on('start', this.reviveHints)
    this.mobileMedia = typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 920px)')
      : null
    if (this.mobileMedia) {
      if (this.mobileMedia.addEventListener) this.mobileMedia.addEventListener('change', this.onViewportChange)
      else this.mobileMedia.addListener(this.onViewportChange)
    }
    // Initial App-created game starts before this child is mounted.
    if (this.enabled && this.isMobileLayout()) this.reviveHints()
  },
  beforeUnmount() {
    window.removeEventListener('blur', this.releaseAll)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    gameBus.off('start', this.reviveHints)
    if (this.mobileMedia) {
      if (this.mobileMedia.removeEventListener) this.mobileMedia.removeEventListener('change', this.onViewportChange)
      else this.mobileMedia.removeListener(this.onViewportChange)
    }
    this.releaseAll()
    this.clearWarps()
  },
  methods: {
    showHint(action) {
      return this.showHints && this.hintsActive && !this.hintActions.includes(action)
    },
    isMobileLayout() {
      return !this.mobileMedia || this.mobileMedia.matches
    },
    onViewportChange(event) {
      if (!event.matches) {
        this.hintsActive = false
        this.releaseAll()
      } else if (this.enabled) this.reviveHints()
    },
    // Count actual mobile games, not desktop sessions or unpauses.
    reviveHints() {
      this.hintActions = []
      this.hintsActive = this.showHints && this.isMobileLayout() && this.hintGamesSeen < 3
      if (this.hintsActive) this.$emit('hint-game-start')
    },
    learn(action) {
      if (!this.hintsActive || this.hintActions.includes(action)) return
      this.hintActions.push(action)
      if (this.hintActions.length === 4) this.hintsActive = false
    },
    replayHints() {
      if (!this.showHints) return
      this.hintsActive = true
      this.hintActions = []
    },
    showWarp(event, kind = 'tap') {
      if (!this.touchFxEnabled || this.reducedMotion) return
      const rect = event.currentTarget.getBoundingClientRect()
      const id = ++this.nextWarpId
      this.warps.push({ id, kind, x: event.clientX - rect.left, y: event.clientY - rect.top })
      const timer = setTimeout(() => {
        this.warps = this.warps.filter(warp => warp.id !== id)
        this.warpTimers.delete(id)
      }, WARP_DURATION[kind])
      this.warpTimers.set(id, timer)
      return id
    },
    removeWarp(id) {
      if (!id) return
      clearTimeout(this.warpTimers.get(id))
      this.warpTimers.delete(id)
      this.warps = this.warps.filter(warp => warp.id !== id)
    },
    clearWarps() {
      for (const timer of this.warpTimers.values()) clearTimeout(timer)
      this.warpTimers.clear()
      this.warps = []
    },
    onPointerDown(event) {
      if (!this.enabled || (event.pointerType === 'mouse' && event.button !== 0)) return
      if (this.pointers.has(event.pointerId)) return

      const board = event.currentTarget.parentElement.querySelector('.tetcolor-board')
      if (!board) return
      const bounds = board.getBoundingClientRect()
      if (!bounds.width) return

      const action = pickZone(bounds, event.clientX)
      if (!action) return
      if (action !== 'rotate' && !this.input.press(event.pointerId, action)) return

      event.preventDefault()
      this.pointers.set(event.pointerId, {
        action,
        x: event.clientX,
        y: event.clientY,
        dropped: false,
        warpId: action !== 'rotate' ? this.showWarp(event) : null
      })
      if (event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId)
    },
    maybeDrop(pointer, event) {
      if (pointer.dropped) return
      if (!isSwipeDrop(pointer.x, pointer.y, event.clientX, event.clientY, SWIPE_DISTANCE)) return
      pointer.dropped = true
      // Swipe takes precedence over a side-zone hold, even when initiated there.
      if (pointer.action !== 'rotate') this.input.release(event.pointerId, true)
      this.removeWarp(pointer.warpId)
      gameBus.emit('drop', this.hard)
      this.learn('drop')
      this.showWarp(event, 'swipe')
    },
    onPointerMove(event) {
      const pointer = this.pointers.get(event.pointerId)
      if (pointer) this.maybeDrop(pointer, event)
    },
    onPointerUp(event) {
      const pointer = this.pointers.get(event.pointerId)
      if (!pointer) return
      event.preventDefault()
      // A fast swipe may deliver pointerup without a final pointermove.
      this.maybeDrop(pointer, event)
      this.pointers.delete(event.pointerId)

      if (pointer.action !== 'rotate') {
        if (!pointer.dropped) {
          this.input.release(event.pointerId)
          this.learn(pointer.action)
        }
        return
      }
      if (!pointer.dropped && isTap(pointer.x, pointer.y, event.clientX, event.clientY, TAP_TOLERANCE)) {
        this.input.tap('rotate')
        this.learn('rotate')
        this.showWarp(event)
      }
    },
    onPointerCancel(event) {
      const pointer = this.pointers.get(event.pointerId)
      if (!pointer) return
      this.pointers.delete(event.pointerId)
      if (pointer.action !== 'rotate') this.input.release(event.pointerId, true)
    },
    onVisibilityChange() {
      if (document.hidden) this.releaseAll()
    },
    releaseAll() {
      this.pointers.clear()
      this.input.cancelAll()
    }
  }
}
</script>
