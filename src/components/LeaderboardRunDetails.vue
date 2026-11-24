<template>
  <dl class="leaderboard-run-details"
      aria-label="Completed run details">
    <div>
      <dt>{{ mode === 'classic' ? 'Lines' : 'Blocks' }}</dt>
      <dd>{{ entry.cleared ?? '—' }}</dd>
    </div>
    <div>
      <dt>Level</dt>
      <dd>{{ entry.level == null ? '—' : entry.level + 1 }}</dd>
    </div>
    <div>
      <dt>Time</dt>
      <dd>{{ entry.durationMs == null ? '—' : formatRunDuration(entry.durationMs) }}</dd>
    </div>
    <div>
      <dt>Drop</dt>
      <dd>{{ entry.hardDrop === true ? 'Hard' : entry.hardDrop === false ? 'Soft' : '—' }}</dd>
    </div>
    <div>
      <dt>Device</dt>
      <dd>{{ entry.platform === 'mobile' ? 'Phone / tablet' : entry.platform === 'desktop' ? 'Computer' : '—' }}</dd>
    </div>
    <div>
      <dt>Clearing</dt>
      <dd>{{ entry.singleBlock === true ? 'One by one' : entry.singleBlock === false ? 'All at once' : '—' }}</dd>
    </div>
  </dl>
</template>

<script>
import { formatRunDuration } from '@/utils/leaderboardRules.js'

export default {
  name: 'LeaderboardRunDetails',
  props: {
    entry: { type: Object, required: true },
    mode: { type: String, required: true }
  },
  methods: { formatRunDuration }
}
</script>
