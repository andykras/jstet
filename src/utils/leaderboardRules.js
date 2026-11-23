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

export const completedRun = ({ runId, mode, score, lines, level, durationMs }) => ({
  runId,
  mode,
  score,
  cleared: lines,
  level,
  durationMs,
  ruleset: LEADERBOARD_RULESET
})

export const formatLeaderboardScore = value => Number(value || 0).toLocaleString('en-US')

export const normalizeLeaderboardNickname = value => {
  if (typeof value !== 'string') return null
  const nickname = value.trim().normalize('NFC')
  return /^[\p{L}\p{N}_-]{3,16}$/u.test(nickname) ? nickname : null
}
