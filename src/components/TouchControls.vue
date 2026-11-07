<template>
  <section class="touch-pad"
           aria-label="Touch game controls">
    <div class="touch-pad__left"
         role="group"
         aria-label="Move left and right">
      <button v-for="control in moveControls"
              :key="control.action"
              type="button"
              class="touch-pad__key"
              :class="'touch-pad__key--' + control.action"
              :disabled="!enabled"
              :aria-label="control.label"
              @pointerdown="onPointerDown($event, control.action)"
              @pointerup="onPointerUp"
              @pointercancel="onPointerCancel"
              @lostpointercapture="onPointerCancel"
              @click="onClick($event, control.action)">
        <svg class="touch-pad__arrow"
             viewBox="0 0 32 32"
             fill="none"
             stroke="currentColor"
             stroke-width="3.4"
             stroke-linecap="round"
             stroke-linejoin="round"
             aria-hidden="true">
          <path :d="control.path" />
        </svg>
      </button>
    </div>
    <div class="touch-pad__right"
         role="group"
         aria-label="Drop and rotate">
      <button type="button"
              class="touch-pad__drop"
              :disabled="!enabled"
              :aria-label="hard ? 'Hard drop' : 'Soft drop'"
              @pointerdown="onPointerDown($event, 'drop')"
              @pointerup="onPointerUp"
              @pointercancel="onPointerCancel"
              @lostpointercapture="onPointerCancel"
              @click="onClick($event, 'drop')">
        <span class="touch-pad__drop-icon"
              aria-hidden="true">⇣</span>
        <span>DROP</span>
      </button>
      <button type="button"
              class="touch-pad__key touch-pad__key--rotate"
              :disabled="!enabled"
              aria-label="Rotate"
              @pointerdown="onPointerDown($event, 'rotate')"
              @pointerup="onPointerUp"
              @pointercancel="onPointerCancel"
              @lostpointercapture="onPointerCancel"
              @click="onClick($event, 'rotate')">
        ↻
      </button>
    </div>
  </section>
</template>

<script>
import { gameBus } from '@/utils/gameBus.js'
import { createTouchInput } from '@/utils/touchInput.js'

export default {
  name: 'TouchControls',
  props: {
    status: { type: String, required: true },
    hard: { type: Boolean, default: false }
  },
  data() {
    return {
      moveControls: [
        { action: 'left', label: 'Move left', path: 'M27 16H5 M13 8l-8 8 8 8' },
        { action: 'right', label: 'Move right', path: 'M5 16h22 M19 8l8 8-8 8' }
      ],
      activePointers: new Set()
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
    }
  },
  created() {
    this.input = createTouchInput(command => gameBus.emit(command))
  },
  mounted() {
    window.addEventListener('blur', this.releaseAll)
    document.addEventListener('visibilitychange', this.onVisibilityChange)
  },
  beforeUnmount() {
    window.removeEventListener('blur', this.releaseAll)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.releaseAll()
  },
  methods: {
    onPointerDown(event, action) {
      if (!this.enabled || (event.pointerType === 'mouse' && event.button !== 0)) return
      event.preventDefault()
      if (action === 'drop') {
        if (this.activePointers.has(event.pointerId)) return
        this.activePointers.add(event.pointerId)
        gameBus.emit('drop', this.hard)
      } else {
        if (!this.input.press(event.pointerId, action)) return
        this.activePointers.add(event.pointerId)
      }

      if (event.currentTarget.setPointerCapture) {
        event.currentTarget.setPointerCapture(event.pointerId)
      }
    },
    onPointerUp(event) {
      if (!this.activePointers.has(event.pointerId)) return
      event.preventDefault()
      this.activePointers.delete(event.pointerId)
      this.input.release(event.pointerId)
    },
    onPointerCancel(event) {
      if (!this.activePointers.has(event.pointerId)) return
      this.activePointers.delete(event.pointerId)
      this.input.release(event.pointerId, true)
    },
    onClick(event, action) {
      // Native keyboard activation has detail=0; pointerdown already handled clicks from touch/mouse.
      if (!this.enabled || event.detail !== 0) return
      if (action === 'drop') gameBus.emit('drop', this.hard)
      else this.input.tap(action)
    },
    onVisibilityChange() {
      if (document.hidden) this.releaseAll()
    },
    releaseAll() {
      this.activePointers.clear()
      this.input.cancelAll()
    }
  }
}
</script>
