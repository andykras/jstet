// Local records are independent from the optional public leaderboard.
const KEY = 'jstet.personal-bests.v1'
const store = () => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch (_) {
    return null
  }
}

// Old releases stored one personal best per clearing rule. Retain both when merging.
const legacyRecordKeys = mode => [mode + ':single', mode + ':batch']

const loadRecords = target => {
  if (!target) return {}
  try {
    const parsed = JSON.parse(target.getItem(KEY) || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch (_) {
    return {}
  }
}

export const readPersonalBest = (mode, target = store()) => {
  const records = loadRecords(target)
  return [mode, ...legacyRecordKeys(mode)]
    .map(key => records[key])
    .filter(value => Number.isSafeInteger(value) && value >= 0)
    .reduce((best, value) => Math.max(best, value), 0)
}

export const recordPersonalBest = (run, target = store()) => {
  const previous = readPersonalBest(run.mode, target)
  const improved = Number.isSafeInteger(run.score) && run.score > previous
  if (improved && target) {
    try {
      const records = loadRecords(target)
      records[run.mode] = run.score
      target.setItem(KEY, JSON.stringify(records))
    } catch (_) {
      // The game and the current session do not depend on localStorage.
    }
  }
  return { score: improved ? run.score : previous, improved }
}
