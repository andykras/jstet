<template>
  <section class="arcade-panel game-hud"
           aria-label="Game statistics">
    <div class="hud-stat hud-stat--score">
      <h2 class="panel-heading">Score</h2>
      <output :key="score"
              class="hud-stat__number hud-stat__number--score">{{ formattedScore }}</output>
    </div>
    <div class="hud-stat hud-stat--level">
      <span class="hud-stat__label">Level</span>
      <output class="hud-stat__number">{{ level + 1 }}</output>
      <div class="level-meter"
           aria-hidden="true">
        <span v-for="value in maxLevel"
              :key="value"
              :class="{ 'is-active': value <= level + 1 }"></span>
      </div>
    </div>
    <div class="hud-stat hud-stat--progress">
      <span class="hud-stat__label">{{ progressLabel }}</span>
      <output class="hud-stat__number">{{ blocks }}</output>
    </div>
    <div v-if="mode === 'tetcolor' && bonus > 0"
         :key="bonus"
         class="hud-stat hud-stat--bonus">
      <span class="hud-stat__label">Bonus</span>
      <output class="hud-stat__number">+{{ bonus }}</output>
    </div>
  </section>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'GameHud',
  props: {
    mode: { type: String, default: 'tetcolor' }
  },
  computed: {
    ...mapState({
      score: state => state.score,
      level: state => state.level,
      blocks: state => state.lines,
      bonus: state => state.bonus
    }),
    progressLabel() {
      return this.mode === 'classic' ? 'Lines' : 'Blocks'
    },
    maxLevel() {
      return this.$store.state.options ? this.$store.state.options.maxLevel : 9
    },
    formattedScore() {
      return this.score.toLocaleString('en-US')
    }
  }
}
</script>
