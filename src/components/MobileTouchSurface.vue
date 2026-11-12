<template>
  <section class="mobile-touch-surface"
           :class="{ 'mobile-touch-surface--inactive': !enabled }"
           aria-label="Touch controls: drag to position the piece, tap the sides to step, tap the board to rotate, swipe down to drop"
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
        <span>DRAG</span>
      </span>
      <span v-if="showHint('right')"
            key="right"
            class="mobile-touch-surface__hint mobile-touch-surface__hint--right">
        <span>DRAG</span>
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
const DRAG_THRESHOLD_RATIO = 0.45
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
    this.dragOwner = null
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
    // Touch remains undecided until enough movement reveals the intended
    // gesture. This prevents an accidental left/right tap before a Drop.
    onPointerDown(event) {
      if (!this.enabled || (event.pointerType === 'mouse' && event.button !== 0)) return
      if (this.pointers.has(event.pointerId)) return
      const board = event.currentTarget.parentElement.querySelector('.tetcolor-board')
      const pieceX = this.$store.state.item?.X
      if (!board || !Number.isInteger(pieceX)) return
      const bounds = board.getBoundingClientRect()
      if (!bounds.width) return

      const zone = pickZone(bounds, event.clientX)
      if (!zone) return
      const cell = board.querySelector('.game-cell')
      const columns = Math.max(1, (this.$store.getters.getDimensions.width || 9) - 2)
      const cellWidth = cell?.getBoundingClientRect().width || bounds.width / columns
      if (!(cellWidth > 0)) return

      event.preventDefault()
      this.pointers.set(event.pointerId, {
        zone,
        x: event.clientX,
        y: event.clientY,
        pieceX,
        cellWidth,
        dragCells: 0,
        dropAnchorX: event.clientX,
        dropAnchorY: event.clientY,
        gesture: null
      })
      if (event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId)
    },
    // Move to a target column relative to the finger's start, not its
    // absolute screen coordinate. The engine checks collisions cell by cell.
    // Reversing the finger naturally moves the piece back toward the anchor.
    recognizeGesture(pointer, event) {
      if (pointer.gesture === 'drop') return
      const dx = event.clientX - pointer.x
      const dy = event.clientY - pointer.y
      const dropX = pointer.gesture === 'drag' ? pointer.dropAnchorX : pointer.x
      const dropY = pointer.gesture === 'drag' ? pointer.dropAnchorY : pointer.y

      if (isSwipeDrop(dropX, dropY, event.clientX, event.clientY, SWIPE_DISTANCE)) {
        pointer.gesture = 'drop'
        if (this.dragOwner === event.pointerId) this.dragOwner = null
        gameBus.emit('drop', this.hard)
        this.learn('drop')
        this.showWarp(event, 'swipe')
        return
      }

      if (pointer.gesture === null) {
        const threshold = Math.max(8, pointer.cellWidth * DRAG_THRESHOLD_RATIO)
        if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.35) return
        if (this.dragOwner !== null && this.dragOwner !== event.pointerId) return
        this.dragOwner = event.pointerId
        pointer.gesture = 'drag'
        this.showWarp(event)
      }

      if (pointer.gesture !== 'drag') return
      const cells = Math.sign(dx) * Math.round(Math.abs(dx) / pointer.cellWidth)
      if (cells === pointer.dragCells) return
      const direction = cells > pointer.dragCells ? 'right' : 'left'
      pointer.dragCells = cells
      pointer.dropAnchorX = event.clientX
      pointer.dropAnchorY = event.clientY
      gameBus.emit('drag:move', pointer.pieceX + cells)
      this.learn(direction)
    },
    onPointerMove(event) {
      const pointer = this.pointers.get(event.pointerId)
      if (pointer) this.recognizeGesture(pointer, event)
    },
    onPointerUp(event) {
      const pointer = this.pointers.get(event.pointerId)
      if (!pointer) return
      event.preventDefault()
      // Fast flicks can arrive only as pointerup without a final move.
      this.recognizeGesture(pointer, event)
      this.pointers.delete(event.pointerId)
      if (this.dragOwner === event.pointerId) this.dragOwner = null
      if (pointer.gesture) return
      if (!isTap(pointer.x, pointer.y, event.clientX, event.clientY, TAP_TOLERANCE)) return

      // Side taps remain precisely one step; stationary long presses do not
      // generate repeated key events and cannot interfere with Drag.
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
      if (!this.pointers.has(event.pointerId)) return
      this.pointers.delete(event.pointerId)
      if (this.dragOwner === event.pointerId) this.dragOwner = null
    },
    onVisibilityChange() {
      if (document.hidden) this.releaseAll()
    },
    releaseAll() {
      this.pointers.clear()
      this.dragOwner = null
      this.input.cancelAll()
    }
  }
}
</script>
