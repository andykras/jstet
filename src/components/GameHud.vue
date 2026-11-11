<template>
  <section class="arcade-panel game-hud"
           aria-label="Game statistics">
    <div v-if="section !== 'left'"
         class="hud-stat hud-stat--score">
      <h2 class="panel-heading">Score</h2>
      <output :key="score"
              class="hud-stat__number hud-stat__number--score">{{ formattedScore }}</output>
    </div>
    <div v-if="section !== 'right'"
         class="hud-stat hud-stat--level">
      <span class="hud-stat__label">Level</span>
      <output class="hud-stat__number">{{ level + 1 }}</output>
      <div class="level-meter"
           aria-hidden="true">
        <span v-for="value in maxLevel"
              :key="value"
              :class="{ 'is-active': value <= level + 1 }"></span>
      </div>
    </div>
    <div v-if="section !== 'left'"
         class="hud-stat hud-stat--progress">
      <span class="hud-stat__label">{{ progressLabel }}</span>
      <output class="hud-stat__number">{{ blocks }}</output>
    </div>
    <Transition name="bonus-hud">
      <div v-if="section !== 'left' && mode === 'tetcolor' && displayBonus > 0"
           class="hud-stat hud-stat--bonus">
        <span class="hud-stat__label">Bonus</span>
        <output class="hud-stat__number"
                aria-live="polite">+{{ displayBonus.toLocaleString('en-US') }}</output>
      </div>
    </Transition>
  </section>
</template>

<script>
import { mapState } from 'vuex'
import { gameBus } from '@/utils/gameBus.js'

export default {
  name: 'GameHud',
  props: {
    mode: { type: String, default: 'tetcolor' },
    section: { type: String, default: 'all' }
  },
  data() {
    return { displayBonus: 0 }
  },
  mounted() {
    if (this.section === 'left') return
    this.bonusTimer = null
    this.bonusHandler = value => this.onBonus(value)
    this.gameStartHandler = () => this.clearBonus()
    gameBus.on('bonus', this.bonusHandler)
    gameBus.on('start', this.gameStartHandler)
  },
  beforeUnmount() {
    if (this.bonusHandler) gameBus.off('bonus', this.bonusHandler)
    if (this.gameStartHandler) gameBus.off('start', this.gameStartHandler)
    clearTimeout(this.bonusTimer)
  },
  methods: {
    onBonus(value) {
      clearTimeout(this.bonusTimer)
      if (!Number.isFinite(value) || value <= 0) {
        this.displayBonus = 0
        return
      }
      this.displayBonus = value
      // Each award restarts the dwell, even when successive amounts are equal.
      this.bonusTimer = setTimeout(() => { this.displayBonus = 0 }, 2600)
    },
    clearBonus() {
      clearTimeout(this.bonusTimer)
      this.displayBonus = 0
    }
  },
  computed: {
    ...mapState({
      score: state => state.score,
      level: state => state.level,
      blocks: state => state.lines
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

<style lang="stylus">
.bonus-hud-enter-active
  transition opacity 260ms ease, transform 260ms ease

.bonus-hud-leave-active
  transition opacity 750ms ease, transform 750ms ease

.bonus-hud-enter-from,
.bonus-hud-leave-to
  opacity 0
  transform translateY(8px)

@media (prefers-reduced-motion: reduce)
  .bonus-hud-enter-active,
  .bonus-hud-leave-active
    transition none
</style>
