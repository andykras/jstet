<template>
  <span class="leaderboard-run-badges">
    <span v-if="entry.hardDrop === true"
          class="leaderboard-run-badge leaderboard-run-badge--drop"
          role="img"
          aria-label="Hard Drop"
          title="Hard Drop">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2v12m-5-5 5 5 5-5" />
        <path d="M5 18h14M7 21h10" />
      </svg>
    </span>
    <span v-if="entry.platform === 'mobile'"
          class="leaderboard-run-badge leaderboard-run-badge--mobile"
          role="img"
          aria-label="Phone or tablet"
          title="Played on a phone or tablet">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
        <path d="M10 5h4" />
        <circle cx="12" cy="18.6" r=".7" fill="currentColor" stroke="none" />
      </svg>
    </span>
    <span v-else-if="entry.platform === 'desktop'"
          class="leaderboard-run-badge leaderboard-run-badge--desktop"
          role="img"
          aria-label="Computer"
          title="Played on a computer">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="13" rx="1.8" />
        <path d="M12 17v3M8 20h8" />
      </svg>
    </span>
    <span v-else
          class="leaderboard-run-badge leaderboard-run-badge--unknown"
          role="img"
          aria-label="Device unknown"
          title="Device type was not recorded for this result">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="13" rx="1.8" />
        <path d="M12 17v3M8 20h8M10 8a2.1 2.1 0 0 1 4 1c0 1.4-2 1.3-2 2.8M12 14h.01" />
      </svg>
    </span>
  </span>
</template>

<script>
export default {
  name: 'LeaderboardRunBadges',
  props: {
    entry: { type: Object, required: true }
  }
}
</script>
