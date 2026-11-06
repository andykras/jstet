<template>
  <section class="touch-pad"
           aria-label="Touch game controls">
    <div class="touch-pad__directions"
         role="group"
         aria-label="Move and rotate">
      <button v-for="control in directions"
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
        {{ control.glyph }}
      </button>
    </div>
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
      directions: [
        { action: 'left', label: 'Move left', glyph: '←' },
        { action: 'rotate', label: 'Rotate', glyph: '↻' },
        { action: 'right', label: 'Move right', glyph: '→' },
        { action: 'down', label: 'Move down', glyph: '↓' }
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
