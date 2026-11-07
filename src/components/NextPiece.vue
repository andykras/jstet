<template>
  <section class="arcade-panel next-panel"
           aria-label="Next piece"
           :style="{ '--preview-columns': previewColumns }">
    <h2 class="panel-heading">Next</h2>
    <div class="next-piece"
         role="img"
         aria-label="Next falling blocks">
      <div v-for="row in previewRows"
           :key="row.y"
           class="next-piece__row">
        <div v-for="x in row.columns"
             :key="x"
             class="game-cell"
             :class="getNextClass(x, row.y)">
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'NextPiece',
  computed: {
    ...mapGetters(['getNextValue', 'getSize']),
    previewSize() {
      return this.getSize || 3
    },
    // Trim empty preview rows/columns so a single square or short piece can
    // use the same visual scale as the playable cells instead of shrinking
    // into the full 3x3 / 4x4 bounding box.
    previewBounds() {
      let left = this.previewSize + 1
      let right = 0
      let bottom = this.previewSize + 1
      let top = 0
      for (let y = 1; y <= this.previewSize; y++) {
        for (let x = 1; x <= this.previewSize; x++) {
          if (this.getNextValue(x, y) > 0) {
            left = Math.min(left, x)
            right = Math.max(right, x)
            bottom = Math.min(bottom, y)
            top = Math.max(top, y)
          }
        }
      }
      return right ? { left, right, bottom, top } : null
    },
    previewColumns() {
      if (!this.previewBounds) return this.previewSize
      return this.previewBounds.right - this.previewBounds.left + 1
    },
    previewRows() {
      const bounds = this.previewBounds
      if (!bounds) return []
      return Array.from({ length: bounds.top - bounds.bottom + 1 }, (_, index) => ({
        y: bounds.bottom + index,
        columns: Array.from({ length: this.previewColumns }, (_, offset) => bounds.left + offset)
      }))
    }
  },
  methods: {
    getNextClass(x, y) {
      const val = this.getNextValue(x, y)
      const valL = this.getNextValue(x - 1, y)
      const valD = this.getNextValue(x, y - 1)
      return {
        ['N' + val]: val >= 0,
        item: val != 0,
        left: val != 0 && valL != 0,
        bottom: val != 0 && valD != 0
      }
    }
  }
}
</script>
