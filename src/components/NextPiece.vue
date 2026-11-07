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
import { getPreviewBounds, getPreviewRows } from '@/game/preview'

export default {
  name: 'NextPiece',
  computed: {
    ...mapGetters(['getNextValue', 'getSize']),
    previewSize() {
      return this.getSize || 3
    },
    // Crop only empty margins. Preserve occupied coordinates so the existing
    // cell colours and adjacency borders remain identical to the well.
    previewBounds() {
      return getPreviewBounds(this.previewSize, this.getNextValue)
    },
    previewColumns() {
      if (!this.previewBounds) return this.previewSize
      return this.previewBounds.right - this.previewBounds.left + 1
    },
    previewRows() {
      return getPreviewRows(this.previewBounds)
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
