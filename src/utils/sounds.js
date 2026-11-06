// Audio is driven by game events, so keyboard and touch controls share the same effects.
export function attachSounds(bus, {
  enabled = true,
  basePath = import.meta.env?.BASE_URL || './',
  createAudio = path => new Audio(path)
} = {}) {
  const makeVoices = (file, volume, count = 1) =>
    Array.from({ length: count }, () => {
      const audio = createAudio(basePath + 'sounds/' + file)
      audio.volume = volume
      audio.preload = 'auto'
      return audio
    })

  const hum = makeVoices('buzz.mp3', 0.12)[0]
  hum.loop = true
  const click = makeVoices('click.mp3', 0.3, 3)
  const drop = makeVoices('drop.mp3', 0.45, 2)
  const clear = makeVoices('line2.mp3', 0.55, 2)
  const positions = new Map()
  const handlers = []
  let running = false
  let muted = !enabled

  const hidden = () => typeof document !== 'undefined' && document.hidden
  const tryPlay = audio => {
    try {
      const promise = audio.play()
      if (promise && typeof promise.catch === 'function') promise.catch(() => {})
    } catch (_) {
      // Browsers may reject playback until the first user gesture.
    }
  }
  const pause = audio => {
    audio.pause()
    try {
      audio.currentTime = 0
    } catch (_) {
      // An unloaded media element may reject seeking.
    }
  }
  const stop = () => {
    pause(hum)
    for (const voices of [click, drop, clear]) for (const audio of voices) pause(audio)
  }
  const syncHum = () => {
    if (muted || !running || hidden()) {
      hum.pause()
    } else if (hum.paused) {
      tryPlay(hum)
    }
  }
  const play = voices => {
    if (muted || !running || hidden()) return
    const index = positions.get(voices) || 0
    positions.set(voices, (index + 1) % voices.length)
    const audio = voices[index]
    try {
      audio.currentTime = 0
    } catch (_) {
      // Playing without seeking is preferable to losing an input sound.
    }
    tryPlay(audio)
  }
  const on = (type, handler) => {
    bus.on(type, handler)
    handlers.push([type, handler])
  }
  const input = () => {
    if (!running || muted || hidden()) return
    // The same user gesture can unlock the ambient loop after autoplay was blocked.
    syncHum()
    play(click)
  }

  on('status', status => {
    running = status === 'running'
    if (!running) stop()
    else syncHum()
  })
  for (const type of ['left:start', 'right:start', 'rotate:start', 'down:start', 'drop']) on(type, input)
  on('sound:drop', () => play(drop))
  on('sound:clear', () => play(clear))

  const onVisibilityChange = () => {
    if (hidden()) stop()
    else syncHum()
  }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibilityChange)

  return {
    setEnabled(value) {
      muted = !value
      if (muted) stop()
      else syncHum()
    },
    dispose() {
      for (const [type, handler] of handlers) bus.off(type, handler)
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibilityChange)
      stop()
    }
  }
}
