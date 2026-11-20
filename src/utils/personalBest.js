// Local records are independent from the optional public leaderboard.
const KEY = 'jstet.personal-bests.v1'
const store = () => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch (_) {
    return null
  }
}

const recordKey = (mode, singleBlock) => mode + ':' + (singleBlock ? 'single' : 'batch')

const loadRecords = target => {
  if (!target) return {}
  try {
    const parsed = JSON.parse(target.getItem(KEY) || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch (_) {
    return {}
  }
}

export const readPersonalBest = (mode, singleBlock = true, target = store()) => {
  const score = loadRecords(target)[recordKey(mode, singleBlock)]
  return Number.isSafeInteger(score) && score >= 0 ? score : 0
}

export const recordPersonalBest = (run, target = store()) => {
  const previous = readPersonalBest(run.mode, run.singleBlock, target)
  const improved = Number.isSafeInteger(run.score) && run.score > previous
  if (improved && target) {
    try {
      const records = loadRecords(target)
      records[recordKey(run.mode, run.singleBlock)] = run.score
      target.setItem(KEY, JSON.stringify(records))
    } catch (_) {
      // The game and the current session do not depend on localStorage.
    }
  }
  return { score: improved ? run.score : previous, improved }
}
