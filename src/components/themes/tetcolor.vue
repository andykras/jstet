<template>
  <div class="tetcolor-board"
       role="img"
       aria-label="Playing field">
    <div v-for="y in getDimensions.height"
         :key="y"
         class="tetcolor-board__row">
      <template v-for="x in getDimensions.width">
        <div v-if="!isBorder(x, y)"
             :key="x"
             class="game-cell"
             :class="getThemeClass(x, y)">
        </div>
      </template>
    </div>
    <!-- Active piece is painted once, independently of the settled grid.
         Its vertical transform is driven by the gravity clock, not Vuex. -->
    <div v-if="activePiece"
         class="gravity-piece-layer"
         aria-hidden="true">
      <div ref="gravityPiece"
           class="gravity-piece">
        <div v-for="cell in activePiece.cells"
             :key="cell.key"
             class="game-cell gravity-piece__cell"
             :class="cell.classes"
             :style="{
               left: `calc(${cell.x} * var(--jstet-cell-size))`,
               bottom: `calc(${cell.y} * var(--jstet-cell-size))`
             }"></div>
      </div>
    </div>
    <VisualFxOverlay v-if="visualFx"
                     :reduced-motion="reducedMotion" />
    <BonusRewardOverlay />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { isActivePieceCell } from '@/utils/visualFx.js'
import { game } from '@/utils/game.js'
import VisualFxOverlay from '@/components/VisualFxOverlay.vue'
import BonusRewardOverlay from '@/components/BonusRewardOverlay.vue'

export default {
  name: 'TetcolorBoard',
  components: { VisualFxOverlay, BonusRewardOverlay },
  props: {
    visualFx: { type: Boolean, default: false },
    reducedMotion: { type: Boolean, default: false }
  },
  data() {
    return { cellSize: 0, osReducedMotion: false }
  },
  computed: {
    ...mapGetters(['getWellValue', 'getDimensions']),
    activePiece() {
      const { item, pieces, cells } = this.$store.state
      if (!item || !pieces || !cells) return null
      const shape = pieces[item.T]
      if (!shape) return null

      const blocks = []
      for (let y = 0; y < shape.size; y++) {
        for (let x = 0; x < shape.size; x++) {
          if (shape.get(x, y, item.R) <= 0) continue
          // The board excludes wall/floor rows; the layer clips spawn cells
          // outside the playable window in the same way as the regular grid.
          const boardX = item.X + x + 1
          const boardY = item.Y + y + 1
          if (boardX <= 1 || boardX >= cells.width || boardY <= 1 || boardY > cells.height) continue
          blocks.push({
            key: x + ':' + y,
            x,
            y,
            classes: this.getThemeClass(boardX, boardY, true)
          })
        }
      }
      return { X: item.X, Y: item.Y, cells: blocks }
    }
  },
  mounted() {
    this.measureCell()
    this.gravityFrame = requestAnimationFrame(this.paintGravity)
    this.onWindowResize = () => this.measureCell()
    window.addEventListener('resize', this.onWindowResize)
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    if (typeof ResizeObserver !== 'undefined') {
      this.cellObserver = new ResizeObserver(this.measureCell)
      this.cellObserver.observe(this.$el)
    }
    if (typeof window.matchMedia === 'function') {
      this.motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
      this.osReducedMotion = this.motionMedia.matches
      this.motionChanged = event => { this.osReducedMotion = event.matches }
      if (this.motionMedia.addEventListener) this.motionMedia.addEventListener('change', this.motionChanged)
      else this.motionMedia.addListener(this.motionChanged)
    }
  },
  updated() {
    if (!this.cellSize) this.measureCell()
  },
  beforeUnmount() {
    cancelAnimationFrame(this.gravityFrame)
    window.removeEventListener('resize', this.onWindowResize)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.cellObserver?.disconnect()
    if (this.motionMedia) {
      if (this.motionMedia.removeEventListener) this.motionMedia.removeEventListener('change', this.motionChanged)
      else this.motionMedia.removeListener(this.motionChanged)
    }
  },
  methods: {
    measureCell() {
      const cell = this.$el.querySelector('.tetcolor-board__row .game-cell')
      this.cellSize = cell ? cell.getBoundingClientRect().height : 0
    },
    onVisibilityChange() {
      if (document.hidden && this.$refs.gravityPiece) {
        const item = this.$store.state.item
        if (item) this.$refs.gravityPiece.style.transform = `translate3d(${(item.X - 1) * this.cellSize}px, ${(1 - item.Y) * this.cellSize}px, 0)`
      }
    },
    paintGravity() {
      const element = this.$refs.gravityPiece
      const item = this.$store.state.item
      if (element && item && this.cellSize) {
        const motionDisabled = this.reducedMotion || this.osReducedMotion || document.hidden
        const progress = motionDisabled ? 0 : game.visualGravityProgress(performance.now())
        const x = (item.X - 1) * this.cellSize
        const y = (1 - item.Y + progress) * this.cellSize
        // Move the entire piece in one compositor transform; never animate
        // the logical cell coordinates or relayout the settled board.
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`
      }
      this.gravityFrame = requestAnimationFrame(this.paintGravity)
    },
    getSettledValue(x, y) {
      // Clearing updates the existing board in place. Keep line count as a
      // reactive dependency, just like the original getWellValue getter.
      void this.$store.state.lines
      return this.$store.state.cells?.[y - 1]?.[x - 1] ?? 0
    },
    getThemeClass(x, y, overlay = false) {
      // The base grid must show the *settled* field, including normal empty
      // cell backgrounds beneath the falling piece. Hiding active cells with
      // visibility:hidden exposed the board's dark backing during descent.
      const valueAt = overlay ? this.getWellValue : this.getSettledValue
      const val = valueAt(x, y)
      const valL = valueAt(x - 1, y)
      const valU = valueAt(x, y + 1)
      const valR = valueAt(x + 1, y)
      const valD = valueAt(x, y - 1)
      const active = overlay && val > 0 && isActivePieceCell(x, y, this.$store.state.pieces, this.$store.state.item)
      // In the original grid, an adjacent *empty* cell draws the exposed
      // left/bottom border, so the filled cell suppresses that edge. The
      // floating piece has no neighboring empty cells to draw those edges:
      // suppress only borders shared by two cells of the active tetromino.
      const pieceLeft = overlay && isActivePieceCell(x - 1, y, this.$store.state.pieces, this.$store.state.item)
      const pieceBelow = overlay && isActivePieceCell(x, y - 1, this.$store.state.pieces, this.$store.state.item)

      return {
        ['N' + val]: val != -1,
        item: val != 0,
        left: overlay ? pieceLeft : (val != 0 && valL != 0) || valL == 0,
        bottom: overlay ? pieceBelow : (val != 0 && valD != 0) || valD == 0,
        empty: val == 0,
        right: val == 0 && valR != 0,
        top: val == 0 && valU != 0,
        'fx-active': this.visualFx && active
      }
    },
    isBorder(x, y) {
      const w = this.getDimensions.width
      return y == 1 || x == 1 || x == w
    }
  }
}
</script>

<style lang="stylus" scoped>
.tetcolor-board
  position relative
  display flex
  flex-direction column-reverse
  width max-content
  // Allow reward typography to float beyond the well without clipping.
  overflow visible
  border 1px solid rgba(255, 195, 115, 0.7)
  background #0a1026
  box-shadow 0 0 0 3px rgba(244, 160, 56, 0.14), 0 12px 38px rgba(2, 3, 18, 0.55)

  &__row
    display flex

.gravity-piece-layer
  position absolute
  inset 0
  z-index 1
  pointer-events none
  overflow hidden

.gravity-piece
  position absolute
  left 0
  bottom 0
  width 0
  height 0
  transform translate3d(0, 0, 0)
  will-change transform
  pointer-events none

  &__cell
    position absolute
    pointer-events none
</style>
