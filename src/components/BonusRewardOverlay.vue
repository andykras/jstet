<template>
  <div class="bonus-reward-layer"
       aria-live="off"
       aria-hidden="true">
    <div v-for="reward in rewards"
         :key="reward.id"
         class="bonus-reward"
         :class="'bonus-reward--' + reward.kind"
         :style="rewardStyle(reward)">
      <span class="bonus-reward__kind">{{ reward.kind === 'combo' ? 'COMBO' : 'CHAIN' }}</span>
      <strong class="bonus-reward__streak">×{{ reward.multiplier }}</strong>
      <span class="bonus-reward__points">+{{ reward.amount.toLocaleString('en-US') }}</span>
    </div>
  </div>
</template>

<script>
import { gameBus } from '@/utils/gameBus.js'
import { getFxAnchor } from '@/utils/visualFx.js'

const REWARD_DURATION = 1250
const MAX_REWARDS = 3

// Rewards are gameplay feedback, independent of opt-in Visual FX.
export default {
  name: 'BonusRewardOverlay',
  data() {
    return {
      rewards: [],
      nextId: 0
    }
  },
  mounted() {
    this.timers = new Map()
    this.handlers = [
      ['fx:combo', payload => this.onReward('combo', payload)],
      ['fx:cascade', payload => this.onReward('cascade', payload)],
      ['start', () => this.clear()],
      ['status', status => { if (status !== 'running') this.clear() }]
    ]
    for (const [type, handler] of this.handlers) gameBus.on(type, handler)
    document.addEventListener('visibilitychange', this.onHidden)
  },
  beforeUnmount() {
    for (const [type, handler] of this.handlers) gameBus.off(type, handler)
    document.removeEventListener('visibilitychange', this.onHidden)
    this.clear()
  },
  methods: {
    rewardStyle(reward) {
      const { width } = this.$store.getters.getDimensions
      const playableColumns = Math.max(1, (width || 9) - 2)
      // Move the label above and toward the nearest side, away from cleared blocks.
      const side = reward.column < playableColumns / 2 ? -1 : 1
      return {
        '--reward-column': reward.column + 0.5 + side * 2.5,
        '--reward-row': reward.row - 3.1
      }
    },
    onReward(kind, payload) {
      if (document.hidden || !payload || !Number.isInteger(payload.amount) || payload.amount <= 0) return
      const multiplier = kind === 'combo' ? payload.streak : payload.depth + 1
      if (!Number.isInteger(multiplier) || multiplier < 2) return
      const anchor = getFxAnchor(payload.cells)
      if (!anchor) return

      if (this.rewards.length >= MAX_REWARDS) {
        const expired = this.rewards.shift()
        clearTimeout(this.timers.get(expired.id))
        this.timers.delete(expired.id)
      }
      const reward = { id: ++this.nextId, kind, amount: payload.amount, multiplier, ...anchor }
      this.rewards.push(reward)
      this.timers.set(reward.id, setTimeout(() => this.remove(reward.id), REWARD_DURATION))
    },
    remove(id) {
      this.timers.delete(id)
      this.rewards = this.rewards.filter(reward => reward.id !== id)
    },
    onHidden() {
      if (document.hidden) this.clear()
    },
    clear() {
      if (this.timers) {
        for (const timer of this.timers.values()) clearTimeout(timer)
        this.timers.clear()
      }
      this.rewards = []
    }
  }
}
</script>
