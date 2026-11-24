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
    <div v-if="section !== 'left'"
         class="hud-footer">
      <Transition name="bonus-hud">
        <div v-if="mode === 'tetcolor' && displayBonus > 0"
             class="hud-stat hud-stat--bonus">
          <span class="hud-stat__label">Bonus</span>
          <output class="hud-stat__number"
                  aria-live="polite">+{{ displayBonus.toLocaleString('en-US') }}</output>
        </div>
      </Transition>
      <div class="hud-meta"
           aria-label="Active run rules">
        <span class="hud-meta__item"
              :class="hard ? 'hud-meta__item--hard' : 'hud-meta__item--soft'"
              :title="hard ? 'Space and swipe lock the piece instantly' : 'Space and swipe move the piece down softly'">
          ● {{ hard ? 'HARD DROP' : 'SOFT DROP' }}</span>
        <span class="hud-meta__item"
              :title="singleBlock ? 'Matches clear one at a time' : 'Matches clear all at once'">
          ● {{ singleBlock ? 'STEP CLEAR' : 'ALL CLEAR' }}</span>
      </div>
    </div>
  </section>
</template>

<script>
import { mapState } from 'vuex'
import { gameBus } from '@/utils/gameBus.js'

export default {
  name: 'GameHud',
  props: {
    mode: { type: String, default: 'tetcolor' },
    section: { type: String, default: 'all' },
    hard: { type: Boolean, default: false },
    singleBlock: { type: Boolean, default: true }
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
// The cabinet's original bonus-reveal animation used fill-mode: both and
// pinned opacity at 1, overriding Vue's leave transition.
.game-hud .hud-stat--bonus
  animation none

.bonus-hud-enter-active
  transition opacity 320ms ease-out, transform 320ms ease-out

.bonus-hud-leave-active
  transition opacity 1550ms cubic-bezier(.28, .03, .65, 1), transform 1550ms ease-out

.bonus-hud-enter-from,
.bonus-hud-leave-to
  opacity 0
  transform translateY(10px)

// Keep the bonus and the run rules as one bottom-anchored unit.
// Without a bonus, the rules occupy the exact same bottom edge.
@media (min-width: 921px)
  .right-column .game-hud .hud-footer
    display flex
    flex 0 0 auto
    flex-direction column
    gap clamp(9px, 1.5vh, 16px)
    margin-top auto

  .right-column .game-hud .hud-footer .hud-stat--bonus
    margin-top 0

  .right-column .game-hud .hud-footer .hud-meta
    margin-top 0

// Active run rules: subtle text below the optional bonus card.
.game-hud .hud-meta
  display flex
  flex-wrap wrap
  gap 4px 10px
  margin-top 6px
  font-size 9px
  line-height 1.4
  letter-spacing .06em

.hud-meta__item
  color rgba(255, 255, 255, .42)
  white-space nowrap

.hud-meta__item--hard
  color #ffd479

// On phones both HUD rails are absolute corner overlays; keep the meta in
// the free strip between the Level and Score cards instead of the flow.
@media (max-width: 920px)
  .right-column .game-hud .hud-meta
    position absolute
    top 14px
    left 50%
    transform translateX(-50%)
    margin 0
    max-width 44vw
    justify-content center
    text-align center

@media (prefers-reduced-motion: reduce)
  .bonus-hud-enter-active,
  .bonus-hud-leave-active
    transition none
</style>
