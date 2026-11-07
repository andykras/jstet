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
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { isActivePieceCell } from '@/utils/visualFx.js'

export default {
  name: 'TetcolorBoard',
  props: {
    visualFx: { type: Boolean, default: false }
  },
  computed: {
    ...mapGetters(['getWellValue', 'getDimensions'])
  },
  methods: {
    getThemeClass(x, y) {
      const val = this.getWellValue(x, y)
      const valL = this.getWellValue(x - 1, y)
      const valU = this.getWellValue(x, y + 1)
      const valR = this.getWellValue(x + 1, y)
      const valD = this.getWellValue(x, y - 1)

      return {
        ['N' + val]: val != -1,
        item: val != 0,
        left: (val != 0 && valL != 0) || valL == 0,
        bottom: (val != 0 && valD != 0) || valD == 0,
        empty: val == 0,
        right: val == 0 && valR != 0,
        top: val == 0 && valU != 0,
        'fx-active': this.visualFx && val > 0 && isActivePieceCell(x, y, this.$store.state.pieces, this.$store.state.item)
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
  display flex
  flex-direction column-reverse
  width max-content
  overflow hidden
  border 1px solid rgba(255, 195, 115, 0.7)
  background #0a1026
  box-shadow 0 0 0 3px rgba(244, 160, 56, 0.14), 0 12px 38px rgba(2, 3, 18, 0.55)

  &__row
    display flex
</style>
