<template>
  <section class="mobile-touch-surface"
           :class="{ 'mobile-touch-surface--inactive': !enabled }"
           aria-label="Touch controls: swipe left or right to move, tap at the sides to move, tap the board to rotate, swipe down anywhere to drop"
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
        <span>SWIPE</span>
      </span>
      <span v-if="showHint('right')"
            key="right"
            class="mobile-touch-surface__hint mobile-touch-surface__hint--right">
        <span>SWIPE</span>
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
const SIDE_SWIPE_DISTANCE = 30
const TAP_TOLERANCE = 18
const HOLD_DELAY_MS = 230
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
    clearHoldTimer(pointer) {
      if (pointer.holdTimer !== null) clearTimeout(pointer.holdTimer)
      pointer.holdTimer = null
    },
    // Do not emit a side-zone move on pointerdown: it might become a Drop
    // swipe. Only a completed tap, recognized horizontal swipe, or a steady
    // long press is allowed to move the piece.
    onPointerDown(event) {
      if (!this.enabled || (event.pointerType === 'mouse' && event.button !== 0)) return
      if (this.pointers.has(event.pointerId)) return

      const board = event.currentTarget.parentElement.querySelector('.tetcolor-board')
      if (!board) return
      const bounds = board.getBoundingClientRect()
      if (!bounds.width) return

      const zone = pickZone(bounds, event.clientX)
      if (!zone) return

      event.preventDefault()
      const pointer = {
        zone,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        target: event.currentTarget,
        gesture: null,
        holdTimer: null
      }
      this.pointers.set(event.pointerId, pointer)

      if (zone !== 'rotate') {
        pointer.holdTimer = setTimeout(() => {
          pointer.holdTimer = null
          if (!this.enabled || this.pointers.get(event.pointerId) !== pointer || pointer.gesture) return
          if (!isTap(pointer.x, pointer.y, pointer.lastX, pointer.lastY, 9)) return
          if (!this.input.press(event.pointerId, zone)) return
          pointer.gesture = 'hold'
          this.learn(zone)
          this.showWarp({ clientX: pointer.x, clientY: pointer.y, currentTarget: pointer.target })
        }, HOLD_DELAY_MS)
      }
      if (event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId)
    },
    // Classify the complete displacement from pointerdown. Whichever swipe
    // wins gets exclusive ownership of this pointer: no false side-zone tap.
    recognizeGesture(pointer, event) {
      if (pointer.gesture === 'drop' || pointer.gesture === 'horizontal') return
      pointer.lastX = event.clientX
      pointer.lastY = event.clientY
      const dx = event.clientX - pointer.x
      const dy = event.clientY - pointer.y
      if (Math.hypot(dx, dy) > TAP_TOLERANCE) this.clearHoldTimer(pointer)

      if (isSwipeDrop(pointer.x, pointer.y, event.clientX, event.clientY, SWIPE_DISTANCE)) {
        if (pointer.gesture === 'hold') this.input.release(event.pointerId, true)
        pointer.gesture = 'drop'
        gameBus.emit('drop', this.hard)
        this.learn('drop')
        this.showWarp(event, 'swipe')
        return
      }

      if (pointer.gesture === 'hold') return
      if (Math.abs(dx) < SIDE_SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.35) return
      const direction = dx < 0 ? 'left' : 'right'
      if (!this.input.press(event.pointerId, direction)) return
      pointer.gesture = 'horizontal'
      this.learn(direction)
      this.showWarp(event)
    },
    onPointerMove(event) {
      const pointer = this.pointers.get(event.pointerId)
      if (pointer) this.recognizeGesture(pointer, event)
    },
    onPointerUp(event) {
      const pointer = this.pointers.get(event.pointerId)
      if (!pointer) return
      event.preventDefault()
      // Fast flicks are recognized on release even without a pointermove.
      this.recognizeGesture(pointer, event)
      this.clearHoldTimer(pointer)
      this.pointers.delete(event.pointerId)

      if (pointer.gesture === 'drop') return
      if (pointer.gesture === 'hold' || pointer.gesture === 'horizontal') {
        this.input.release(event.pointerId)
        return
      }
      if (!isTap(pointer.x, pointer.y, event.clientX, event.clientY, TAP_TOLERANCE)) return

      if (pointer.zone === 'rotate') {
        this.input.tap('rotate')
        this.learn('rotate')
      } else {
        this.input.tap(pointer.zone)
        this.learn(pointer.zone)
      }
      this.showWarp(event)
    },
    onPointerCancel(event) {
      const pointer = this.pointers.get(event.pointerId)
      if (!pointer) return
      this.clearHoldTimer(pointer)
      this.pointers.delete(event.pointerId)
      if (pointer.gesture === 'hold' || pointer.gesture === 'horizontal') {
        this.input.release(event.pointerId, true)
      }
    },
    onVisibilityChange() {
      if (document.hidden) this.releaseAll()
    },
    releaseAll() {
      for (const pointer of this.pointers.values()) this.clearHoldTimer(pointer)
      this.pointers.clear()
      this.input.cancelAll()
    }
  }
}
</script>
