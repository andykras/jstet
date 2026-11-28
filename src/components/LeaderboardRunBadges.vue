<template>
  <span class="leaderboard-run-badges">
    <span v-if="entry.hardDrop === true"
          class="leaderboard-run-badge leaderboard-run-badge--drop"
          role="img"
          aria-label="Hard Drop"
          title="Hard Drop">
      <!-- Font Awesome Free 5, fist-raised (CC BY 4.0): https://fontawesome.com/license/free -->
      <svg class="leaderboard-run-badge__punch"
           viewBox="0 0 384 512"
           aria-hidden="true">
        <path fill="currentColor"
              stroke="none"
              d="M255.98 160V16c0-8.84-7.16-16-16-16h-32c-8.84 0-16 7.16-16 16v146.93c5.02-1.78 10.34-2.93 15.97-2.93zm128 95.99c-.01-35.34-28.66-63.99-63.99-63.99H207.85c-8.78 0-15.9 7.07-15.9 15.85v.56c0 26.27 21.3 47.59 47.57 47.59h35.26c9.68 0 13.2 3.58 13.2 8v16.2c0 4.29-3.59 7.78-7.88 8c-44.52 2.28-64.16 24.71-96.05 72.55l-6.31 9.47a7.994 7.994 0 0 1-11.09 2.22l-13.31-8.88a7.994 7.994 0 0 1-2.22-11.09l6.31-9.47c15.73-23.6 30.2-43.26 47.31-58.08c-17.27-5.51-31.4-18.12-38.87-34.45c-6.59 3.41-13.96 5.52-21.87 5.52h-32c-12.34 0-23.49-4.81-32-12.48C71.48 251.19 60.33 256 48 256H16c-5.64 0-10.97-1.15-16-2.95v77.93c0 33.95 13.48 66.5 37.49 90.51L63.99 448v64h255.98v-63.96l35.91-35.92A96.04 96.04 0 0 0 384 344.21zm-32.01-90.09V48c0-8.84-7.16-16-16-16h-32c-8.84 0-16 7.16-16 16v112h32c11.28 0 21.94 2.31 32 5.9M16 224h32c8.84 0 16-7.16 16-16V80c0-8.84-7.16-16-16-16H16C7.16 64 0 71.16 0 80v128c0 8.84 7.16 16 16 16m95.99 0h32c8.84 0 16-7.16 16-16V48c0-8.84-7.16-16-16-16h-32c-8.84 0-16 7.16-16 16v160c0 8.84 7.16 16 16 16" />
      </svg>
    </span>
    <span v-if="entry.platform === 'mobile'"
          class="leaderboard-run-badge leaderboard-run-badge--mobile"
          role="img"
          aria-label="Phone or tablet"
          title="Played on a phone or tablet">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true">
        <rect
          x="7"
          y="2.5"
          width="10"
          height="19"
          rx="2.2" />
        <path
          d="M10 5h4" />
        <circle
          cx="12"
          cy="18.6"
          r=".7"
          fill="currentColor"
          stroke="none" />
      </svg>
    </span>
    <span v-else-if="entry.platform === 'desktop'"
          class="leaderboard-run-badge leaderboard-run-badge--desktop"
          role="img"
          aria-label="Computer"
          title="Played on a computer">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true">
        <rect
          x="3"
          y="4"
          width="18"
          height="13"
          rx="1.8" />
        <path
          d="M12 17v3M8 20h8" />
      </svg>
    </span>
    <span v-else
          class="leaderboard-run-badge leaderboard-run-badge--unknown"
          role="img"
          aria-label="Device unknown"
          title="Device type was not recorded for this result">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true">
        <rect
          x="3"
          y="4"
          width="18"
          height="13"
          rx="1.8" />
        <path
          d="M12 17v3M8 20h8M10 8a2.1 2.1 0 0 1 4 1c0 1.4-2 1.3-2 2.8M12 14h.01" />
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
