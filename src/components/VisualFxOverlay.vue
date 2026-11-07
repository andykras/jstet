<template>
  <div class="tetcolor-fx-layer"
       aria-hidden="true">
    <div v-for="effect in effects"
         :key="effect.id"
         class="tetcolor-fx-cell"
         :class="'tetcolor-fx-cell--' + effect.type"
         :style="effectStyle(effect)"></div>
  </div>
</template>

<script>
import { gameBus } from '@/utils/gameBus.js'

const MAX_EFFECTS = 24
const DURATION = Object.freeze({ move: 155, drop: 270, lock: 210, 'hard-lock': 250 })

export default {
  name: 'VisualFxOverlay',
  props: {
    reducedMotion: { type: Boolean, default: false }
  },
  data() {
    return {
      effects: [],
      nextId: 0,
      osReducedMotion: false
    }
  },
  computed: {
    running() {
      return this.$store.state.status === 'running'
    }
  },
  watch: {
    reducedMotion(value) {
      if (value) this.clear()
    },
    running(value) {
      if (!value) this.clear()
    }
  },
  mounted() {
    this.timers = new Map()
    this.handlers = [
      ['fx:move', payload => this.onMove(payload)],
      ['fx:hard-drop', payload => this.onDrop(payload)],
      ['fx:lock', payload => this.onLock(payload)],
      ['start', () => this.clear()],
      ['status', status => { if (status !== 'running') this.clear() }]
    ]
    for (const [type, handler] of this.handlers) gameBus.on(type, handler)
    document.addEventListener('visibilitychange', this.onHidden)
    window.addEventListener('blur', this.clear)
    window.addEventListener('resize', this.clear)
    if (typeof window.matchMedia === 'function') {
      this.motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
      this.osReducedMotion = this.motionMedia.matches
      if (this.motionMedia.addEventListener) this.motionMedia.addEventListener('change', this.onMotionChange)
      else this.motionMedia.addListener(this.onMotionChange)
    }
  },
  beforeUnmount() {
    for (const [type, handler] of this.handlers) gameBus.off(type, handler)
    document.removeEventListener('visibilitychange', this.onHidden)
    window.removeEventListener('blur', this.clear)
    window.removeEventListener('resize', this.clear)
    if (this.motionMedia) {
      if (this.motionMedia.removeEventListener) this.motionMedia.removeEventListener('change', this.onMotionChange)
      else this.motionMedia.removeListener(this.onMotionChange)
    }
    this.clear()
  },
  methods: {
    effectStyle(effect) {
      return {
        '--fx-column': effect.column,
        '--fx-row': effect.row,
        '--fx-color': `var(--cell-${effect.color}, #ffffff)`,
        '--fx-dx': effect.dx,
        '--fx-dy': effect.dy,
        '--fx-distance': effect.distance
      }
    },
    onMove(payload) {
      if (!payload || !payload.from || !payload.to) return
      this.add('move', payload.cells, {
        dx: payload.to.X - payload.from.X,
        dy: payload.from.Y - payload.to.Y
      })
    },
    onDrop(payload) {
      if (!payload || payload.distance <= 0) return
      this.add('drop', payload.cells, { distance: payload.distance })
    },
    onLock(payload) {
      if (!payload) return
      this.add(payload.hard ? 'hard-lock' : 'lock', payload.cells)
    },
    add(type, cells, values = {}) {
      if (!this.running || this.reducedMotion || this.osReducedMotion || document.hidden || !Array.isArray(cells)) return
      const duration = DURATION[type]
      for (const cell of cells) {
        if (this.effects.length >= MAX_EFFECTS) {
          const expired = this.effects.shift()
          clearTimeout(this.timers.get(expired.id))
          this.timers.delete(expired.id)
        }
        const effect = {
          id: ++this.nextId,
          type,
          column: cell.column,
          row: cell.row,
          color: cell.color,
          dx: values.dx || 0,
          dy: values.dy || 0,
          distance: values.distance || 0
        }
        this.effects.push(effect)
        this.timers.set(effect.id, setTimeout(() => this.remove(effect.id), duration))
      }
    },
    remove(id) {
      this.timers.delete(id)
      this.effects = this.effects.filter(effect => effect.id !== id)
    },
    clear() {
      if (this.timers) {
        for (const timer of this.timers.values()) clearTimeout(timer)
        this.timers.clear()
      }
      this.effects = []
    },
    onHidden() {
      if (document.hidden) this.clear()
    },
    onMotionChange(event) {
      this.osReducedMotion = event.matches
      if (event.matches) this.clear()
    }
  }
}
</script>
