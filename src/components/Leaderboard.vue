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
        <div class="leaderboard-header__copy">
          <p class="leaderboard-kicker"><span aria-hidden="true">✦</span> ARCADE 2077 · HIGH SCORES</p>
          <h2 id="leaderboard-heading">LEADERBOARD<span aria-hidden="true">.</span></h2>
          <p class="leaderboard-subtitle">One game. One shot at glory.</p>
        </div>
        <button type="button"
                class="dialog-close"
                aria-label="Close leaderboard"
                @click="$emit('close')">×</button>
      </header>

      <section v-if="configured && !preview && pendingRun && pendingRun.mode === mode"
               class="leaderboard-publish"
               aria-label="Publish completed game">
        <div class="leaderboard-publish__heading">
          <span>{{ profile ? 'YOUR LAST RUN' : 'PUT YOUR NAME ON THE BOARD' }}</span>
          <strong>{{ formatLeaderboardScore(pendingRun.score) }}</strong>
        </div>
        <p v-if="!canRankRun(pendingRun)">
          Only completed games with a positive score can be published.
        </p>
        <p v-else-if="submission.status === 'sent'"
           class="leaderboard-publish__success"
           role="status">Score published. You're on the board!</p>
        <p v-else-if="submission.status === 'queued'"
           class="leaderboard-publish__success"
           role="status">
          Saved on this device. It will be published when the server is reachable.
          <button v-if="online"
                  type="button"
                  class="leaderboard-text-action"
                  @click="$emit('sync')">Try now</button>
          <span v-if="submission.error"
                class="leaderboard-sync-detail">{{ submission.error }}</span>
        </p>
        <p v-else-if="submission.status === 'sending' || publishing"
           role="status">Saving score…</p>
        <template v-else>
          <form v-if="!profile"
                @submit.prevent="registerAndPublish">
            <label for="leaderboard-nickname">Choose a nickname</label>
            <div class="leaderboard-publish__form-row">
              <input id="leaderboard-nickname"
                     ref="nicknameInput"
                     v-model.trim="nickname"
                     type="text"
                     required
                     minlength="3"
                     maxlength="16"
                     autocomplete="nickname"
                     placeholder="Your arcade name">
              <button type="submit"
                      class="arcade-button arcade-button--primary"
                      :disabled="publishing || !online">Save score</button>
            </div>
            <p v-if="!online">Offline: your personal best is saved. Join when you're connected to publish scores.</p>
            <p v-else>No account needed. Joining also enables automatic publishing of future scores on this device.</p>
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

      <div v-if="configured && pendingCount"
           class="leaderboard-sync-notice"
           role="status">
        <span>{{ pendingCount }} {{ pendingCount === 1 ? 'score' : 'scores' }} saved on this device · {{ online ? 'awaiting sync' : 'offline' }}</span>
        <button v-if="online"
                type="button"
                class="leaderboard-text-action"
                @click="$emit('sync')">Sync now</button>
      </div>

      <div class="leaderboard-controls">
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
      </div>

      <p v-if="!configured && !preview"
         class="leaderboard-notice"
         role="status">Online rankings aren't connected yet. Your local best is still saved.</p>

      <template v-else>
        <p v-if="preview"
           class="leaderboard-demo-notice"
           role="status">SAMPLE SCORES · VISUAL PREVIEW · NOT LIVE</p>
        <p v-if="cachedAtMs"
           class="leaderboard-cache-notice"
           role="status">
          <span aria-hidden="true">◌</span>
          Offline snapshot · last updated {{ new Date(cachedAtMs).toLocaleString() }}
        </p>
        <div class="leaderboard-section-heading leaderboard-section-heading--top">
          <span>{{ period === 'week' ? 'THIS WEEK’S CHAMPIONS' : 'ALL-TIME LEGENDS' }}</span>
          <small>{{ period === 'week' ? 'Resets Monday · 00:00 UTC' : 'Best scores ever' }}</small>
        </div>

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
        <div v-else-if="entries.length"
             class="leaderboard-results">
          <div class="leaderboard-podium"
               role="group"
               aria-label="Top three players">
            <div v-for="entry in podiumEntries"
                 :key="entry.playerId"
                 class="leaderboard-podium__slot"
                 :class="['leaderboard-podium__slot--' + entry.rank, {
                   'leaderboard-podium__slot--mine': profile && entry.playerId === profile.id,
                   'leaderboard-podium__slot--open': expandedId === entry.playerId
                 }]">
              <button type="button"
                      class="leaderboard-podium__button"
                      :aria-expanded="expandedId === entry.playerId"
                      :aria-label="entry.nickname + ', rank ' + entry.rank + ', ' + formatLeaderboardScore(entry.score) + '. ' + (expandedId === entry.playerId ? 'Hide' : 'Show') + ' run details.'"
                      @click="toggleEntry(entry.playerId)">
                <span class="leaderboard-podium__medal"
                      aria-hidden="true">{{ entry.rank === 1 ? '★' : '◆' }}</span>
                <span class="leaderboard-podium__place">#{{ entry.rank }}</span>
                <span class="leaderboard-podium__name">
                  {{ entry.nickname }}
                  <small v-if="profile && entry.playerId === profile.id"
                         class="leaderboard-podium__you">YOU</small>
                </span>
                <strong class="leaderboard-podium__score">{{ formatLeaderboardScore(entry.score) }}</strong>
                <span class="leaderboard-podium__tags">
                  <span v-if="entry.hardDrop === true"
                        class="leaderboard-badge leaderboard-badge--hard"
                        title="Hard drop">HD</span>
                  <span v-if="entry.singleBlock === true"
                        class="leaderboard-badge"
                        title="One-at-a-time clearing">1×1</span>
                  <span v-else-if="entry.singleBlock === false"
                        class="leaderboard-badge"
                        title="All-at-once clearing">ALL</span>
                  <span v-if="entry.hardDrop == null && entry.singleBlock == null"
                        class="leaderboard-badge leaderboard-badge--legacy"
                        title="Run settings were not recorded for this older score">OLD SCORE</span>
                </span>
                <span class="leaderboard-podium__hint"
                      aria-hidden="true">{{ expandedId === entry.playerId ? '−' : '+' }} details</span>
              </button>
            </div>
          </div>

          <div v-if="activePodiumEntry"
               class="leaderboard-podium-details">
            <p>RUN DETAILS · {{ activePodiumEntry.nickname }}</p>
            <LeaderboardRunDetails :entry="activePodiumEntry"
                                   :mode="mode" />
          </div>

          <div v-if="profile && !preview"
               class="leaderboard-personal"
               aria-label="Your position">
            <div class="leaderboard-personal__identity">
              <span class="leaderboard-personal__eyebrow">YOUR STANDING</span>
              <strong>{{ profile.nickname }}</strong>
              <span class="leaderboard-personal__best">Best · {{ !loading && !loadError && mine ? formatLeaderboardScore(mine.score) : '—' }}</span>
              <span v-if="!loading && !loadError && mine"
                    class="leaderboard-personal__badges"
                    aria-label="Options for your best published run">
                <span v-if="mine.hardDrop === true"
                      class="leaderboard-badge leaderboard-badge--hard"
                      title="Hard drop">HD</span>
                <span v-if="mine.singleBlock === true"
                      class="leaderboard-badge"
                      title="One-at-a-time clearing">1×1</span>
                <span v-else-if="mine.singleBlock === false"
                      class="leaderboard-badge"
                      title="All-at-once clearing">ALL</span>
                <span v-if="mine.hardDrop == null && mine.singleBlock == null"
                      class="leaderboard-badge leaderboard-badge--legacy"
                      title="Run settings were not recorded for this older score">OLD SCORE</span>
              </span>
            </div>
            <div class="leaderboard-personal__position">
              <span>RANK</span>
              <strong>{{ !loading && !loadError && mine ? '#' + mine.rank : '—' }}</strong>
            </div>
          </div>

          <div v-if="remainingEntries.length"
               class="leaderboard-section-heading leaderboard-section-heading--list">
            <span>THE CHALLENGERS</span>
            <small>RANK 04—20</small>
          </div>
          <ol v-if="remainingEntries.length"
              class="leaderboard-list"
              start="4"
              aria-label="Other ranked players">
            <li v-for="entry in remainingEntries"
                :key="entry.playerId"
                class="leaderboard-entry"
                :class="{ 'leaderboard-entry--mine': profile && entry.playerId === profile.id,
                          'leaderboard-entry--open': expandedId === entry.playerId }">
              <button type="button"
                      class="leaderboard-entry__main"
                      :aria-expanded="expandedId === entry.playerId"
                      :aria-label="entry.nickname + ', rank ' + entry.rank + ', ' + formatLeaderboardScore(entry.score) + '. ' + (expandedId === entry.playerId ? 'Hide' : 'Show') + ' run details.'"
                      @click="toggleEntry(entry.playerId)">
                <span class="leaderboard-entry__rank">{{ String(entry.rank).padStart(2, '0') }}</span>
                <span class="leaderboard-entry__player">
                  <span class="leaderboard-entry__name">
                    {{ entry.nickname }}<small v-if="profile && entry.playerId === profile.id">YOU</small>
                  </span>
                  <span class="leaderboard-entry__tags">
                    <span v-if="entry.hardDrop === true"
                          class="leaderboard-badge leaderboard-badge--hard"
                          title="Hard drop">HD</span>
                    <span v-if="entry.singleBlock === true"
                          class="leaderboard-badge"
                          title="One-at-a-time clearing">1×1</span>
                    <span v-else-if="entry.singleBlock === false"
                          class="leaderboard-badge"
                          title="All-at-once clearing">ALL</span>
                    <span v-if="entry.hardDrop == null && entry.singleBlock == null"
                          class="leaderboard-badge leaderboard-badge--legacy"
                          title="Run settings were not recorded for this older score">OLD SCORE</span>
                  </span>
                </span>
                <strong class="leaderboard-entry__score">{{ formatLeaderboardScore(entry.score) }}</strong>
                <svg class="leaderboard-entry__chevron"
                     width="14"
                     height="14"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     stroke-width="2"
                     stroke-linecap="round"
                     stroke-linejoin="round"
                     aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              <div v-if="expandedId === entry.playerId"
                   class="leaderboard-entry__details">
                <LeaderboardRunDetails :entry="entry"
                                       :mode="mode" />
              </div>
            </li>
          </ol>
        </div>
        <div v-else
             class="leaderboard-empty">
          <div class="leaderboard-empty__emblem"
               aria-hidden="true">★</div>
          <h3>The podium is waiting.</h3>
          <p>Finish a game. Claim the first spot.</p>
        </div>

        <div v-if="profile && !preview && !entries.length && !loading && !loadError"
             class="leaderboard-personal"
             aria-label="Your position">
          <div class="leaderboard-personal__identity">
            <span class="leaderboard-personal__eyebrow">YOUR STANDING</span>
            <strong>{{ profile.nickname }}</strong>
            <span class="leaderboard-personal__best">No published scores in this period yet</span>
          </div>
          <div class="leaderboard-personal__position">
            <span>RANK</span>
            <strong>—</strong>
          </div>
        </div>
      </template>

      <div class="leaderboard-local"
           aria-label="Personal record on this device">
        <span>PERSONAL BEST ON THIS DEVICE</span>
        <strong>{{ personalBest ? formatLeaderboardScore(personalBest) : '—' }}</strong>
      </div>

      <div v-if="configured && profile && !preview"
           class="leaderboard-preferences">
        <label>
          <input type="checkbox"
                 :checked="autoPublish"
                 @change="onAutoPublishChange($event.target.checked)">
          Automatically publish future scores
        </label>
        <button type="button"
                class="leaderboard-text-action"
                @click="forgetProfile">Forget this profile on this device</button>
        <p v-if="profileError"
           class="leaderboard-error"
           role="alert">{{ profileError }}</p>
      </div>
      <p v-if="configured || preview"
         class="leaderboard-disclaimer">
        {{ preview
          ? 'Sample scores for layout preview only. Nothing is submitted.'
          : 'Scores are browser-submitted and not yet independently verified.' }}
      </p>
    </section>
  </div>
</template>

<script>
import { canRankRun, formatLeaderboardScore, normalizeLeaderboardNickname } from '@/utils/leaderboardRules.js'
import LeaderboardRunDetails from '@/components/LeaderboardRunDetails.vue'
import { queueLeaderboardRun, clearQueuedLeaderboardRuns } from '@/utils/leaderboardOutbox.js'
import { readPersonalBest } from '@/utils/personalBest.js'
import { leaderboardPreviewEnabled, leaderboardPreviewEntries } from '@/utils/leaderboardPreview.js'
import {
  leaderboardConfigured, readLeaderboardPlayer, fetchLeaderboard, cachedLeaderboard,
  registerLeaderboardPlayer, isLeaderboardAutoPublishEnabled,
  setLeaderboardAutoPublish, forgetLeaderboardPlayer
} from '@/utils/leaderboardClient.js'

export default {
  name: 'LeaderboardPanel',
  components: { LeaderboardRunDetails },
  props: {
    defaultMode: { type: String, default: 'tetcolor' },
    pendingRun: { type: Object, default: null },
    submission: { type: Object, default: () => ({ status: 'idle' }) },
    pendingCount: { type: Number, default: 0 },
    online: { type: Boolean, default: true }
  },
  emits: ['close', 'queued', 'sync', 'profile-forgotten'],
  data() {
    return {
      modes: [{ label: 'TetColor', value: 'tetcolor' }, { label: 'Classic', value: 'classic' }],
      mode: this.defaultMode,
      period: 'week',
      configured: leaderboardConfigured,
      preview: leaderboardPreviewEnabled && !leaderboardConfigured,
      profile: readLeaderboardPlayer(),
      nickname: '',
      entries: [],
      mine: null,
      loading: false,
      loadError: '',
      cachedAtMs: null,
      publishing: false,
      publishError: '',
      profileError: '',
      expandedId: null,
      sequence: 0
    }
  },
  computed: {
    personalBest() { return readPersonalBest(this.mode) },
    autoPublish() { return isLeaderboardAutoPublishEnabled(this.profile) },
    podiumEntries() { return this.entries.slice(0, 3) },
    remainingEntries() { return this.entries.slice(3) },
    activePodiumEntry() {
      return this.entries.slice(0, 3).find(entry => entry.playerId === this.expandedId) || null
    }
  },
  watch: {
    mode() { this.refresh() },
    period() { this.refresh() },
    'submission.status'(status) { if (status === 'sent') this.refresh() },
    online() { this.refresh() }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.$refs.nicknameInput) this.$refs.nicknameInput.focus()
      else this.$refs.dialog?.focus()
    })
    this.refresh()
  },
  beforeUnmount() {
    this.sequence++
  },
  methods: {
    canRankRun,
    formatLeaderboardScore,
    toggleEntry(playerId) {
      this.expandedId = this.expandedId === playerId ? null : playerId
    },
    useCachedRanking(fallbackMessage) {
      const snapshot = cachedLeaderboard(this.mode, this.period, this.profile)
      this.entries = snapshot?.entries || []
      this.mine = snapshot?.mine || null
      this.cachedAtMs = snapshot?.cachedAtMs || null
      this.loadError = snapshot ? '' : fallbackMessage
    },
    async refresh() {
      if (this.preview) {
        this.sequence++
        this.loading = false
        this.loadError = ''
        this.cachedAtMs = null
        this.mine = null
        this.expandedId = null
        this.entries = leaderboardPreviewEntries(this.mode, this.period)
        return
      }
      if (!this.configured) return
      if (!this.online) {
        this.sequence++
        this.loading = false
        this.expandedId = null
        this.useCachedRanking('Offline: live rankings are unavailable. Your local best is still saved.')
        return
      }
      const requestId = ++this.sequence
      this.loading = true
      this.loadError = ''
      this.cachedAtMs = null
      this.entries = []
      this.mine = null
      this.expandedId = null
      try {
        const result = await fetchLeaderboard(this.mode, this.period, this.profile)
        if (requestId !== this.sequence) return
        this.entries = result.entries
        this.mine = result.mine
      } catch (error) {
        if (requestId !== this.sequence) return
        this.useCachedRanking(error.message)
      } finally {
        if (requestId === this.sequence) this.loading = false
      }
    },
    async registerAndPublish() {
      if (this.publishing || !this.online || !canRankRun(this.pendingRun)) return
      const validNickname = normalizeLeaderboardNickname(this.nickname)
      if (!validNickname) {
        this.publishError = 'Use 3–16 letters, digits, underscores or hyphens.'
        return
      }
      this.publishing = true
      this.publishError = ''
      try {
        // The button explicitly consents to saving a profile and publishing future runs.
        this.profile = await registerLeaderboardPlayer(validNickname)
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
    publishScore() {
      queueLeaderboardRun(this.pendingRun, this.profile)
      this.$emit('queued', this.pendingRun.runId)
    },
    onAutoPublishChange(enabled) {
      this.profileError = ''
      try {
        this.profile = setLeaderboardAutoPublish(enabled)
      } catch (error) {
        this.profileError = error.message
      }
    },
    forgetProfile() {
      if (!window.confirm('Forget this profile and unsent scores on this device? Published scores will remain public.')) return
      try {
        clearQueuedLeaderboardRuns(this.profile)
      } catch (error) {
        this.profileError = error.message
        return
      }
      if (!forgetLeaderboardPlayer()) {
        this.profileError = 'Unable to clear browser storage.'
        return
      }
      this.profile = null
      this.$emit('profile-forgotten')
      this.profileError = ''
      this.publishError = ''
      this.refresh()
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
