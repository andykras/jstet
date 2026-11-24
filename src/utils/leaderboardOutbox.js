// An opt-in, local-first outbox. Game logic never awaits a network request.
import { canRankRun } from '@/utils/leaderboardRules.js'
import { readLeaderboardPlayer } from '@/utils/leaderboardClient.js'

const KEY = 'jstet.leaderboard.outbox.v1'
const MAX_PENDING = 200

const storage = () => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch (_) {
    return null
  }
}

const read = target => {
  if (!target) return []
  try {
    const entries = JSON.parse(target.getItem(KEY) || '[]')
    return Array.isArray(entries)
      ? entries.filter(item => item && typeof item.playerId === 'string' && canRankRun(item.run) &&
        typeof item.run.runId === 'string')
      : []
  } catch (_) {
    return []
  }
}

const save = (target, entries) => {
  if (!target) throw new Error('Browser storage is unavailable. Your score remains local only.')
  try {
    target.setItem(KEY, JSON.stringify(entries))
  } catch (_) {
    throw new Error('Could not save the score for later syncing. Your local best is still kept.')
  }
}

export const queuedLeaderboardRuns = (player = readLeaderboardPlayer(), target = storage()) =>
  player ? read(target).filter(item => item.playerId === player.id).map(item => item.run) : []

export const pendingLeaderboardCount = (player = readLeaderboardPlayer(), target = storage()) =>
  queuedLeaderboardRuns(player, target).length

export const queueLeaderboardRun = (run, player = readLeaderboardPlayer(), target = storage()) => {
  if (!player || !canRankRun(run)) throw new Error('An eligible completed score and leaderboard profile are required.')
  const entries = read(target)
  if (entries.some(item => item.playerId === player.id && item.run.runId === run.runId)) return entries.length
  if (entries.length >= MAX_PENDING) throw new Error('Offline score queue is full. Reconnect before publishing more scores.')
  entries.push({ playerId: player.id, run })
  save(target, entries)
  return entries.length
}

export const removeQueuedLeaderboardRun = (runId, player = readLeaderboardPlayer(), target = storage()) => {
  if (!player) return
  const entries = read(target)
  const remaining = entries.filter(item => !(item.playerId === player.id && item.run.runId === runId))
  if (remaining.length !== entries.length) save(target, remaining)
}

export const clearQueuedLeaderboardRuns = (player = readLeaderboardPlayer(), target = storage()) => {
  if (!player) return
  const remaining = read(target).filter(item => item.playerId !== player.id)
  save(target, remaining)
}
