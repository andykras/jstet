<template>
  <div class="leaderboard-backdrop"
       @click.self="$emit('close')">
    <section ref="dialog"
             class="leaderboard-dialog"
             role="dialog"
             aria-modal="true"
             aria-labelledby="leaderboard-heading"
             tabindex="-1"
             @keydown.esc.stop.prevent="$emit('close')"
             @keydown.tab="trapFocus">
      <header class="leaderboard-header">
        <div>
          <span class="leaderboard-kicker">ARCADE 2077</span>
          <h2 id="leaderboard-heading">LEADERBOARD</h2>
        </div>
        <button type="button"
                class="dialog-close"
                aria-label="Close leaderboard"
                @click="$emit('close')">×</button>
      </header>

      <div class="leaderboard-tabs"
           role="group"
           aria-label="Leaderboard game mode">
        <button v-for="choice in modes"
                :key="choice.value"
                type="button"
                :aria-pressed="mode === choice.value"
                @click="mode = choice.value">{{ choice.label }}</button>
      </div>
      <div class="leaderboard-tabs leaderboard-tabs--period"
           role="group"
           aria-label="Leaderboard period">
        <button type="button"
                :aria-pressed="period === 'week'"
                @click="period = 'week'">This week</button>
        <button type="button"
                :aria-pressed="period === 'all'"
                @click="period = 'all'">All time</button>
      </div>

      <p v-if="!configured"
         class="leaderboard-notice">
        Online rankings are not connected yet. You can keep playing normally.
      </p>
      <template v-else>
        <p class="leaderboard-period-note">
          {{ period === 'week' ? 'Weekly scores reset Monday at 00:00 UTC.' : 'Best scores since launch.' }}
          Only standard clearing rules qualify.
        </p>

        <p v-if="loading"
           class="leaderboard-notice"
           role="status">Loading rankings…</p>
        <div v-else-if="loadError"
             class="leaderboard-notice"
             role="alert">
          {{ loadError }}
          <button type="button"
                  class="arcade-button"
                  @click="refresh">Retry</button>
        </div>
        <ol v-else-if="entries.length"
            class="leaderboard-list"
            aria-label="Top 20 players">
          <li v-for="entry in entries"
              :key="entry.playerId"
              class="leaderboard-entry"
              :class="{ 'leaderboard-entry--mine': profile && entry.playerId === profile.id }">
            <span class="leaderboard-entry__rank">{{ String(entry.rank).padStart(2, '0') }}</span>
            <span class="leaderboard-entry__name">
              {{ entry.nickname }}<small v-if="profile && entry.playerId === profile.id">YOU</small>
            </span>
            <strong class="leaderboard-entry__score">{{ formatLeaderboardScore(entry.score) }}</strong>
          </li>
        </ol>
        <p v-else
           class="leaderboard-notice">No published records yet. Be the first!</p>

        <div v-if="profile"
             class="leaderboard-personal">
          <div>
            <span>Your best · {{ profile.nickname }}</span>
            <strong>{{ mine ? formatLeaderboardScore(mine.score) : '—' }}</strong>
          </div>
          <div>
            <span>Your rank</span>
            <strong>{{ mine ? '#' + mine.rank : '—' }}</strong>
          </div>
        </div>

        <section v-if="pendingRun && pendingRun.mode === mode"
                 class="leaderboard-publish"
                 aria-label="Publish completed game">
          <h3>LAST RUN · {{ formatLeaderboardScore(pendingRun.score) }}</h3>
          <p v-if="!canRankRun(pendingRun)">
            This run cannot enter the global ranking. Use one-at-a-time clearing to compete.
          </p>
          <p v-else-if="submission.status === 'sent'"
             role="status">Score published. Your position is shown above.</p>
          <p v-else-if="submission.status === 'sending' || publishing"
             role="status">Publishing score…</p>
          <template v-else>
            <form v-if="!profile"
                  @submit.prevent="registerAndPublish">
              <label for="leaderboard-nickname">Nickname</label>
              <input id="leaderboard-nickname"
                     v-model.trim="nickname"
                     type="text"
                     required
                     minlength="3"
                     maxlength="16"
                     autocomplete="nickname"
                     pattern="[^<>]{3,16}"
                     placeholder="Enter your nickname">
              <p>Publishing creates an anonymous profile and opts you in to automatically
                publishing later eligible runs on this browser. No account is required.</p>
              <button type="submit"
                      class="arcade-button arcade-button--primary"
                      :disabled="publishing">Join & publish score</button>
            </form>
            <button v-else
                    type="button"
                    class="arcade-button arcade-button--primary"
                    @click="publish">Publish this score</button>
            <p v-if="publishError || submission.error"
               class="leaderboard-error"
               role="alert">{{ publishError || submission.error }}</p>
          </template>
        </section>
        <p class="leaderboard-disclaimer">
          Scores are submitted by browsers and are not yet verified against replays.
        </p>
      </template>
    </section>
  </div>
</template>

<script>
import { canRankRun, formatLeaderboardScore } from '@/utils/leaderboardRules.js'
import {
  leaderboardConfigured, readLeaderboardPlayer, fetchLeaderboard,
  registerLeaderboardPlayer, publishLeaderboardRun
} from '@/utils/leaderboardClient.js'

export default {
  name: 'Leaderboard',
  props: {
    defaultMode: { type: String, default: 'tetcolor' },
    pendingRun: { type: Object, default: null },
    submission: { type: Object, default: () => ({ status: 'idle' }) }
  },
  emits: ['close', 'published'],
  data() {
    return {
      modes: [{ label: 'TetColor', value: 'tetcolor' }, { label: 'Classic', value: 'classic' }],
      mode: this.defaultMode,
      period: 'week',
      configured: leaderboardConfigured,
      profile: readLeaderboardPlayer(),
      nickname: '',
      entries: [],
      mine: null,
      loading: false,
      loadError: '',
      publishing: false,
      publishError: '',
      sequence: 0
    }
  },
  watch: {
    mode() { this.refresh() },
    period() { this.refresh() },
    'submission.status'() { this.refresh() }
  },
  mounted() {
    this.$refs.dialog.focus()
    this.refresh()
  },
  beforeUnmount() {
    this.sequence++
  },
  methods: {
    canRankRun,
    formatLeaderboardScore,
    async refresh() {
      if (!this.configured) return
      const requestId = ++this.sequence
      this.loading = true
      this.loadError = ''
      try {
        const result = await fetchLeaderboard(this.mode, this.period, this.profile)
        if (requestId !== this.sequence) return
        this.entries = result.entries
        this.mine = result.mine
      } catch (error) {
        if (requestId !== this.sequence) return
        this.loadError = error.message
      } finally {
        if (requestId === this.sequence) this.loading = false
      }
    },
    async registerAndPublish() {
      if (this.publishing || !canRankRun(this.pendingRun)) return
      this.publishing = true
      this.publishError = ''
      try {
        // The button explicitly consents to saving a profile and publishing future runs.
        this.profile = await registerLeaderboardPlayer(this.nickname)
        await this.publishScore()
      } catch (error) {
        this.publishError = error.message
      } finally {
        this.publishing = false
      }
    },
    async publish() {
      if (this.publishing || !canRankRun(this.pendingRun)) return
      this.publishing = true
      this.publishError = ''
      try {
        await this.publishScore()
      } catch (error) {
        this.publishError = error.message
      } finally {
        this.publishing = false
      }
    },
    async publishScore() {
      await publishLeaderboardRun(this.pendingRun, this.profile)
      this.$emit('published', this.pendingRun.runId)
      await this.refresh()
    },
    trapFocus(event) {
      const focusable = Array.from(this.$refs.dialog.querySelectorAll('button:not(:disabled), input:not(:disabled)'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === this.$refs.dialog)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === this.$refs.dialog)) {
        event.preventDefault()
        first.focus()
      }
    }
  }
}
</script>
