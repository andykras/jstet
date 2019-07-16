export function gameEvent(first, next) {
  const firstDelta = first || 300 // first timeout 300ms
  const nextDelta = next || 40 // second and next timeouts 40ms
  let [value, time, delta] = [0, 0, firstDelta]
  return {
    start() {
      if (value === 0) time = 0
      value = 1
    },
    stop() {
      value -= 2
    },
    active(currentTime) {
      if (value === 0 || (time && time + delta > currentTime)) return false
      delta = time ? nextDelta : firstDelta
      time = currentTime
      if (value < 2) value++
      return true
    }
  }
}

export const events = {
  init() {
    this.left = new gameEvent()
    this.right = new gameEvent()
    this.rotate = new gameEvent(200, 120)
  }
}
