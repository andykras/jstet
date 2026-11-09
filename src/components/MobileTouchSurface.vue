<template>
  <section class="mobile-touch-surface"
           :class="{ 'mobile-touch-surface--inactive': !enabled }"
           aria-label="Touch controls: tap left or right of the board to move, tap the board to rotate, swipe down on the board to drop"
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
            class="mobile-touch-surface__hint mobile-touch-surface__hint--left">← MOVE</span>
      <span v-if="showHint('right')"
            key="right"
            class="mobile-touch-surface__hint mobile-touch-surface__hint--right">MOVE →</span>
      <span v-if="showHint('rotate')"
            key="rotate"
            class="mobile-touch-surface__hint mobile-touch-surface__hint--rotate">↻ TAP</span>
      <span v-if="showHint('drop')"
            key="drop"
            class="mobile-touch-surface__hint mobile-touch-surface__hint--drop">↓ SWIPE · DROP</span>
    </TransitionGroup>
    <span v-for="warp in warps"
          :key="warp.id"
          class="mobile-touch-surface__warp"
          :style="{ left: warp.x + 'px', top: warp.y + 'px' }"
          aria-hidden="true"></span>
  </section>
</template>

<script>
import { gameBus } from '@/utils/gameBus.js'
import { createTouchInput } from '@/utils/touchInput.js'

const HINTS_KEY = 'jstet.touchHints.v1'
const SWIPE_DISTANCE = 36
const TAP_TOLERANCE = 18
const WARP_DURATION = 320

const hintsCompleted = () => {
  try {
    return localStorage.getItem(HINTS_KEY) === 'done'
  } catch (_) {
    return false
  }
}

const persistHintStatus = complete => {
  try {
    if (complete) localStorage.setItem(HINTS_KEY, 'done')
    else localStorage.removeItem(HINTS_KEY)
  } catch (_) {
    // Storage is optional (private mode / restricted browsers).
  }
}

export default {
  name: 'MobileTouchSurface',
  props: {
    status: { type: String, required: true },
    hard: { type: Boolean, default: false },
    touchFxEnabled: { type: Boolean, default: true },
    reducedMotion: { type: Boolean, default: false }
  },
  data() {
    return {
      hintsDismissed: hintsCompleted(),
      hintActions: [],
      hintInteractions: 0,
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
  },
  beforeUnmount() {
    window.removeEventListener('blur', this.releaseAll)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.releaseAll()
    this.clearWarps()
  },
  methods: {
    showHint(action) {
      return !this.hintsDismissed && !this.hintActions.includes(action)
    },
    learn(action) {
      if (this.hintsDismissed) return
      if (!this.hintActions.includes(action)) this.hintActions.push(action)
      this.hintInteractions++
      if (this.hintInteractions >= 3) {
        this.hintsDismissed = true
        persistHintStatus(true)
      }
    },
    replayHints() {
      this.hintsDismissed = false
      this.hintActions = []
      this.hintInteractions = 0
      persistHintStatus(false)
    },
    showWarp(event, rect) {
      if (!this.touchFxEnabled || this.reducedMotion) return
      const id = ++this.nextWarpId
      this.warps.push({ id, x: event.clientX - rect.left, y: event.clientY - rect.top })
      const timer = setTimeout(() => {
        this.warps = this.warps.filter(warp => warp.id !== id)
        this.warpTimers.delete(id)
      }, WARP_DURATION)
      this.warpTimers.set(id, timer)
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

      const action = event.clientX < bounds.left ? 'left' : event.clientX > bounds.right ? 'right' : 'rotate'
      if (action !== 'rotate' && !this.input.press(event.pointerId, action)) return

      event.preventDefault()
      this.pointers.set(event.pointerId, {
        action,
        x: event.clientX,
        y: event.clientY,
        dropped: false
      })
      if (action !== 'rotate') this.learn(action)
      this.showWarp(event, event.currentTarget.getBoundingClientRect())
      if (event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId)
    },
    onPointerMove(event) {
      const pointer = this.pointers.get(event.pointerId)
      if (!pointer || pointer.action !== 'rotate' || pointer.dropped) return
      const dx = event.clientX - pointer.x
      const dy = event.clientY - pointer.y
      if (dy < SWIPE_DISTANCE || dy < Math.abs(dx) * 1.25) return
      pointer.dropped = true
      gameBus.emit('drop', this.hard)
      this.learn('drop')
    },
    onPointerUp(event) {
      const pointer = this.pointers.get(event.pointerId)
      if (!pointer) return
      event.preventDefault()
      this.pointers.delete(event.pointerId)

      if (pointer.action !== 'rotate') {
        this.input.release(event.pointerId)
        return
      }
      const dx = event.clientX - pointer.x
      const dy = event.clientY - pointer.y
      if (!pointer.dropped && Math.hypot(dx, dy) <= TAP_TOLERANCE) {
        this.input.tap('rotate')
        this.learn('rotate')
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
