import { events } from './events.js'

// Bind one engine to the bus. The disposer removes only its own listeners.
export function attachGameCommands(bus, actions) {
  events.init()
  const subscriptions = []
  const on = (name, listener) => {
    bus.on(name, listener)
    subscriptions.push([name, listener])
  }

  for (const direction of ['rotate', 'left', 'right', 'down']) {
    for (const action of ['start', 'stop']) {
      const type = direction + ':' + action
      on(type, () => actions.input(type))
    }
  }
  for (const name of ['start', 'pause', 'drop', 'fill', 'next']) {
    on(name, value => actions[name](value))
  }
  // Continuous touch drag targets a column directly; key-repeat input stays
  // reserved for taps, physical keys and optional button controls.
  if (actions.dragMove) on('drag:move', position => actions.dragMove(position))

  return () => {
    for (const [name, listener] of subscriptions) bus.off(name, listener)
    events.init()
  }
}
