function gameEvent(first, next) {
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

function simpleEvent() {
  let value = false
  return {
    start: _ => (value = true),
    stop: _ => (value = false),
    active: _ => value
  }
}

export const events = {
  emit(type) {
    const [event, action] = type.split(':')
    this[event] && this[event][action] && this[event][action]()
  },

  init() {
    this.left = gameEvent()
    this.right = gameEvent()
    this.rotate = gameEvent(300, 120)
    this.down = gameEvent(60, 60)
  }
}
