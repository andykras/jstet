<template>
  <section class="arcade-panel next-panel"
           aria-label="Next piece">
    <h2 class="panel-heading">Next</h2>
    <div class="next-piece"
         role="img"
         aria-label="Next falling blocks">
      <div v-for="y in 3"
           :key="y"
           class="next-piece__row">
        <div v-for="x in 3"
             :key="x"
             class="game-cell"
             :class="getNextClass(x, y)">
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
    ...mapGetters(['getNextValue'])
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
