const ACTIONS = Object.freeze(['left', 'right', 'rotate', 'down'])
const MIN_PRESS_MS = 48

// One controller per mounted touch pad. Emit the same commands as the keyboard.
export function createTouchInput(emit, timing = {}) {
  const now = timing.now || (() => performance.now())
  const schedule = timing.schedule || ((fn, ms) => setTimeout(fn, ms))
  const unschedule = timing.unschedule || (id => clearTimeout(id))
  const active = new Map()
  const pending = new Map()

  const stop = action => emit(action + ':stop')

  function clearPending(action) {
    const id = pending.get(action)
    if (id === undefined) return
    unschedule(id)
    pending.delete(action)
    stop(action)
  }

  function press(pointer, action) {
    if (!ACTIONS.includes(action) || active.has(pointer)) return false
    if ([...active.values()].some(entry => entry.action === action)) return false
    clearPending(action)
    active.set(pointer, { action, started: now() })
    emit(action + ':start')
    return true
  }

  function release(pointer, canceled = false) {
    const entry = active.get(pointer)
    if (!entry) return false
    active.delete(pointer)

    if (canceled) {
      stop(entry.action)
    } else {
      // A short tap must survive a game-frame boundary before being released.
      // Long presses keep the original keyboard repeat timing.
      const remaining = Math.max(0, MIN_PRESS_MS - (now() - entry.started))
      if (!remaining) stop(entry.action)
      else {
        const id = schedule(() => {
          pending.delete(entry.action)
          stop(entry.action)
        }, remaining)
        pending.set(entry.action, id)
      }
    }
    return true
  }

  function tap(action) {
    const pointer = 'keyboard:' + action
    if (press(pointer, action)) release(pointer)
  }

  function cancelAll() {
    for (const entry of active.values()) stop(entry.action)
    active.clear()
    for (const [action, id] of pending) {
      unschedule(id)
      stop(action)
    }
    pending.clear()
  }

  return { press, release, tap, cancelAll }
}
