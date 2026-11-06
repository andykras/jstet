<template>
  <section class="arcade-panel game-hud"
           aria-label="Game statistics">
    <div class="hud-stat hud-stat--score">
      <h2 class="panel-heading">Score</h2>
      <output class="hud-stat__number hud-stat__number--score">{{ formattedScore }}</output>
    </div>
    <div class="hud-stat">
      <span class="hud-stat__label">Level</span>
      <output class="hud-stat__number">{{ level + 1 }}</output>
    </div>
    <div class="hud-stat">
      <span class="hud-stat__label">Blocks</span>
      <output class="hud-stat__number">{{ blocks }}</output>
    </div>
    <div v-if="bonus > 0"
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
  computed: {
    ...mapState({
      score: state => state.score,
      level: state => state.level,
      blocks: state => state.lines,
      bonus: state => state.bonus
    }),
    formattedScore() {
      return this.score.toLocaleString('en-US')
    }
  }
}
</script>
