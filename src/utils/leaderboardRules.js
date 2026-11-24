// Leaderboards are separated by game mode only; visual and clearing settings never affect eligibility.
export const LEADERBOARD_RULESET = 'arcade-v1'
export const LEADERBOARD_MODES = Object.freeze(['tetcolor', 'classic'])
export const LEADERBOARD_PERIODS = Object.freeze(['week', 'all'])

export const canRankRun = run => Boolean(
  run &&
  LEADERBOARD_MODES.includes(run.mode) &&
  Number.isInteger(run.score) && run.score > 0 &&
  Number.isInteger(run.durationMs) && run.durationMs >= 1000
)

export const completedRun = ({ runId, mode, score, lines, level, durationMs, hardDrop, singleBlock, completedAtMs }) => ({
  runId,
  mode,
  score,
  cleared: lines,
  level,
  durationMs,
  completedAtMs,
  ruleset: LEADERBOARD_RULESET,
  // Display options only: every finished game ranks in its mode regardless.
  hardDrop: hardDrop === true,
  singleBlock: singleBlock !== false
})

export const formatLeaderboardScore = value => Number(value || 0).toLocaleString('en-US')

export const formatRunDuration = ms => {
  const totalSeconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  return minutes + ':' + String(totalSeconds % 60).padStart(2, '0')
}

export const normalizeLeaderboardNickname = value => {
  if (typeof value !== 'string') return null
  const nickname = value.trim().normalize('NFC')
  return /^[\p{L}\p{N}_-]{3,16}$/u.test(nickname) ? nickname : null
}
