// Run-level rules take effect only when a new game starts.
const defaults = Object.freeze({
  maxLevel: 9,
  levelTime: 60,
  scorePart: 10,
  bonusSize: 500,
  singleBlock: true,
  tetcolor: true
})

export const resolveRunOptions = values => {
  const input = values && typeof values === 'object' ? values : {}
  const result = { ...defaults }

  for (const key of ['maxLevel', 'levelTime', 'scorePart', 'bonusSize']) {
    const value = input[key]
    if (Number.isInteger(value) && value >= (key === 'maxLevel' || key === 'levelTime' ? 1 : 0)) result[key] = value
  }
  for (const key of ['singleBlock', 'tetcolor']) {
    if (typeof input[key] === 'boolean') result[key] = input[key]
  }
  return result
}

export default defaults
