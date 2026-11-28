import { events } from '@/utils/events'
import { attachGameCommands } from '@/utils/gameCommands'
import defaults, { resolveRunOptions } from '@/game/options'
import store from '@/store'
import { next } from '@/game/next'
import { put } from '@/game/put'
import { clearAllLines, clearOneLine, getSolidLines, resetSolidLines } from '@/game/tetris'
import { removeThreeBlockSorted, removeThreeBlock, getThreeBlock, resetThreeBlocks } from '@/game/tetcolor'
import { comboBonusForStreak, cascadeBonus } from '@/game/bonus'
import { getPieceFxCells, captureClearCandidates, markedClearFxCells, mergeClearFxCells, clearStepFxCells } from '@/utils/visualFx'

// todo clear measure!!!!!!!!!!!!!!!
const speed = { start: 1000, clear: 80, drop: 20, three: 80, scheduled: 100 }
const BONUS_HOLD_MS = 270
// let item = { T: 0 }
let item = {}
let $cells = null
let $pieces = null
let $bus = null
let $lines = []
let $three = new Set()
$three.sorted = []

// Build small cosmetic snapshots only when an opt-in FX consumer is mounted.
// Handler stacks on the mitt bus are arrays, so consumer presence is array length.
const hasFxConsumer = type => Boolean($bus?.all.get(type)?.length)
const emitFx = (type, makePayload) => {
  if (hasFxConsumer(type)) $bus.emit(type, makePayload())
}

// Visual metadata follows the already-detected clear group; it cannot influence
// which cells are cleared or when the engine advances them.
const EMPTY_FX_CELLS = Object.freeze([])
let clearFxCells = EMPTY_FX_CELLS

const detectClears = (mode, detect) => {
  const track = hasFxConsumer('fx:clear-start') || hasFxConsumer('fx:clear-step') ||
    hasFxConsumer('fx:combo') || hasFxConsumer('fx:cascade')
  const candidates = track ? captureClearCandidates($cells) : null
  const result = detect()
  // Membership comes from the detected group itself: the TetColor detector
  // cannot mark the top visible row as -2, and a batch-mode lock can extend
  // a still pending group, so the snapshot accumulates across such locks.
  const isDetected = result instanceof Set
    ? (x, y) => result.has(x * $cells.height + y)
    : (x, y) => result.includes(y)
  const fresh = candidates ? markedClearFxCells(candidates, $cells, isDetected) : EMPTY_FX_CELLS
  const resume = clearFxCells.length > 0
  clearFxCells = mergeClearFxCells(clearFxCells, fresh)
  if (clearFxCells.length && !resume) {
    emitFx('fx:clear-start', () => Object.freeze({
      mode, batch: !game.singleBlock, cells: clearFxCells
    }))
  }
  return result
}

const emitClearStep = (mode, x, y) => {
  if (!clearFxCells.length || !hasFxConsumer('fx:clear-step')) return
  const cells = game.singleBlock ? clearStepFxCells(clearFxCells, mode, x, y, $cells) : clearFxCells
  if (cells.length) $bus.emit('fx:clear-step', Object.freeze({ mode, cells }))
}

export function setup(bus) {
  if ($bus) throw new Error('Game engine already connected')
  $bus = bus
  const resetFx = () => { clearFxCells = EMPTY_FX_CELLS }
  bus.on('fx:reset', resetFx)
  const detach = attachGameCommands(bus, {
    input(type) {
      if (game.started && !game.paused) events.emit(type)
    },
    dragMove(targetX) {
      if (game.started && !game.paused) moveToColumn(targetX)
    },
    start: values => game.start(values),
    pause: () => game.togglePause(),
    drop(hard) {
      if (!game.started || game.paused) return
      if (hard) dropDown()
      else game.drop++
    },
    fill() {
      if (game.debug && game.started && !game.paused) game.singleBlock = !game.singleBlock
    },
    next() {
      if (!game.debug || !game.started || game.paused) return
      item = next(item.N)
      bus.emit('update', item)
    }
  })

  return () => {
    game.stop()
    detach()
    bus.off('fx:reset', resetFx)
    $bus = null
  }
}

export const game = {
  ...defaults,
  status: 'idle',
  started: false,
  paused: false,
  debug: false,
  hardDropPending: false,
  cascadeDepth: 0,
  bonusHoldPending: false,
  bonusHoldUntil: 0,
  gravityHoldStart: 0,
  gravityPauseOffset: 0,

  // Configuring a run never mutates the shared defaults or Vuex hot-path data.
  configure(values) {
    const resolved = resolveRunOptions(values)
    Object.assign(this, resolved)
    return resolved
  },

  releaseControls() {
    events.init()
  },

  togglePause() {
    if (!this.started) return
    const now = performance.now()
    if (this.paused) {
      const pausedFor = now - this.pausedAt
      this.startedTime += pausedFor
      if (this.bonusHoldUntil) {
        this.bonusHoldUntil += pausedFor
        this.gravityHoldStart += pausedFor
      }
    } else this.pausedAt = now
    this.paused = !this.paused
    this.releaseControls()
    this.status = this.paused ? 'paused' : 'running'
    $bus.emit('status', this.status)
  },

  stop() {
    cancelAnimationFrame(this.id)
    this.id = null
    this.started = false
    this.paused = false
    this.hardDropPending = false
    this.bonusHoldPending = false
    this.bonusHoldUntil = 0
    this.gravityHoldStart = 0
    this.gravityPauseOffset = 0
    this.gravityIntervals = {}
    clearFxCells = EMPTY_FX_CELLS
    this.releaseControls()
    if (this.status !== 'idle') {
      this.status = 'idle'
      if ($bus) $bus.emit('status', this.status)
    }
  },

  levelSpeed: level => Math.floor(speed.start - 150 * level + 4.3 * level * level),
  clearSpeed: _ => (game.tetcolor ? speed.three : game.singleBlock ? speed.clear : 2 * speed.clear),
  speed: _ => (game.scheduled ? speed.scheduled : game.drop > 0 ? speed.drop / game.drop : game.levelSpeed(game.level)),

  start(values = store.state.options || defaults) {
    cancelAnimationFrame(this.id)
    this.configure(values)
    this.releaseControls()
    $cells = store.state.cells
    $pieces = store.state.pieces
    $lines = resetSolidLines()
    $three = resetThreeBlocks()
    clearFxCells = EMPTY_FX_CELLS

    this.paused = this.level = this.score = this.bonus = this.drop = this.totalLines = this.scheduled = 0
    this.matchStreak = 0
    this.chainBonus = 0
    this.cascadeDepth = 0
    this.hardDropPending = false
    this.bonusHoldPending = false
    this.bonusHoldUntil = 0
    this.gravityHoldStart = 0
    this.gravityPauseOffset = 0
    this.intervals = {}
    this.gravityIntervals = {}
    this.started = true
    this.status = 'running'

    item = next(next().N)
    this.startedTime = performance.now()
    this.performance_measure_counter = 0
    this.performance_measure_delta = 0
    this.id = requestAnimationFrame(this.loop.bind(this))

    $bus.emit('status', this.status)
    $bus.emit('level', this.level)
    $bus.emit('lines', this.totalLines)
    $bus.emit('score', this.score)
    $bus.emit('bonus', this.bonus)
    $bus.emit('update', item)
  },

  interval(delta) {
    const count = (this.currentTime - this.startedTime) / delta
    this.intervals[delta] = this.intervals[delta] || count
    return count > this.intervals[delta] + 1
  },

  // Gravity has its own logical clock: only automatic falling is held for
  // BONUS_HOLD_MS. Clearing, levels, touch input and manual Down keep running.
  gravityElapsed() {
    let elapsed = this.currentTime - this.startedTime - this.gravityPauseOffset
    if (this.bonusHoldUntil) elapsed -= Math.max(0, this.currentTime - this.gravityHoldStart)
    return elapsed
  },

  gravityInterval(delta) {
    const count = this.gravityElapsed() / delta
    this.gravityIntervals[delta] = this.gravityIntervals[delta] ?? count
    return count > this.gravityIntervals[delta] + 1
  },

  increase() {
    for (const [key] of Object.entries(this.intervals)) if (this.interval(key)) this.intervals[key]++
    for (const [key] of Object.entries(this.gravityIntervals)) {
      if (this.gravityInterval(key)) this.gravityIntervals[key]++
    }
  },

  loop() {
    if (this.performance_measure_counter > 100 && this.performance_measure_delta < performance.now() - this.currentTime) {
      this.performance_measure_delta = performance.now() - this.currentTime
      console.log({ delta: this.performance_measure_delta })
    }
    this.performance_measure_counter++

    if (!game.started) {
      this.releaseControls()
      this.status = 'gameOver'
      $bus.emit('status', this.status)
      return $bus.emit('done')
    }
    this.currentTime = performance.now()
    // Paused time does not count toward gravity, clearing or level progression.
    if (this.paused) {
      this.id = requestAnimationFrame(this.loop.bind(this))
      return
    }

    // Complete only the gravity hold. Never pause the whole simulation:
    // controls must stay responsive throughout the reward moment.
    if (this.bonusHoldUntil && this.currentTime >= this.bonusHoldUntil) {
      this.gravityPauseOffset += this.bonusHoldUntil - this.gravityHoldStart
      this.bonusHoldUntil = 0
      this.gravityHoldStart = 0
    }

    if (!game.paused && game.level < game.maxLevel - 1 && this.interval(game.levelTime * 1000)) {
      $bus.emit('level', ++game.level)
      console.log({ speed: game.speed() })
    }

    if ($three.size && this.interval(game.clearSpeed())) {
      let cascadeBonusAwarded = 0
      const xy = $three.sorted[$three.sorted.length - 1]
      if (xy !== undefined) {
        const x = Math.floor(xy / $cells.height)
        emitClearStep('tetcolor', x, xy - x * $cells.height)
      }
      do {
        const add = Math.floor(game.scorePart * ($three.bonus / $three.sorted.length))
        game.score += add
        if (!game.singleBlock) $three.sorted.pop()
      } while ($three.sorted.length && !game.singleBlock)
      game.totalLines += game.singleBlock ? removeThreeBlockSorted() || 1 : removeThreeBlock() || $three.size
      if ($three.sorted.length === 0) {
        $three.clear()
        clearFxCells = EMPTY_FX_CELLS
        if (($three = detectClears('tetcolor', getThreeBlock)).size) {
          $bus.emit('sound:clear')
          game.cascadeDepth++
          game.chainBonus = cascadeBonus(game.chainBonus, game.bonusSize)
          game.bonus = game.chainBonus
          game.score += game.chainBonus
          $bus.emit('bonus', game.chainBonus)
          cascadeBonusAwarded = game.chainBonus
          game.bonusHoldPending = true
        }
      }
      $bus.emit('lines', game.totalLines)
      $bus.emit('score', game.score)
      if (cascadeBonusAwarded > 0) {
        emitFx('fx:cascade', () => Object.freeze({
          amount: cascadeBonusAwarded,
          depth: game.cascadeDepth,
          cells: clearFxCells
        }))
      }
    }

    if ($lines.length && this.interval(game.clearSpeed())) {
      emitClearStep('classic', 1, $lines[$lines.length - 1])
      const cleared = game.singleBlock ? clearOneLine() : clearAllLines()
      if (!$lines.length) clearFxCells = EMPTY_FX_CELLS
      game.totalLines += cleared
      game.score += cleared * game.scorePart * 10 * (game.level + 1)
      $bus.emit('lines', game.totalLines)
      $bus.emit('score', game.score)
    }

    // Wait until all cascade cells have finished clearing before the short
    // reward dwell; do not hold between individual cells or cascade rounds.
    if (game.bonusHoldPending && !$three.size && !$lines.length) {
      game.bonusHoldPending = false
      // A second reward can arrive during the first hold via manual Drop.
      // Preserve already-frozen gravity time before restarting the dwell.
      if (game.bonusHoldUntil) {
        game.gravityPauseOffset += this.currentTime - game.gravityHoldStart
      }
      game.gravityHoldStart = this.currentTime
      game.bonusHoldUntil = this.currentTime + BONUS_HOLD_MS
    }

    if (!game.paused && !game.bonusHoldUntil && this.gravityInterval(game.speed())) {
      update(item.X, item.Y - 1, item.R)
    }
    if (events.left.active(this.currentTime)) update(item.X - 1, item.Y, item.R, 'left')
    if (events.right.active(this.currentTime)) update(item.X + 1, item.Y, item.R, 'right')
    if (events.rotate.active(this.currentTime)) update(item.X, item.Y, item.R + 1, 'rotate')
    if (events.down.active(this.currentTime)) update(item.X, item.Y - 1, item.R, 'down')

    this.increase()
    this.id = requestAnimationFrame(this.loop.bind(this))
  }
}

// const rand = _ => Math.floor(Math.random() * $pieces.length)
// const next = N => {
//   // N = Number.isInteger(N) ? N : rand()
//   item = {
//     T: N,
//     N: N,
//     X: Math.round(($cells.width - $pieces[N].size) / 2),
//     Y: $cells.height - (game.tetcolor ? 2 : 1),
//     R: 0
//   }

//   while (item.T == item.N) item.N = rand()

//   if (game.tetcolor) {
//     const maxColors = 6
//     $pieces[item.N].forEach(row =>
//       row.forEach((col, i) => {
//         if (col > 0) row[i] = 1 + Math.floor(Math.random() * maxColors)
//       })
//     )
//   }
//   // return item
//   // game.drop = Math.max(0, game.drop - 1)
// }

const set = (X, Y, R, T = item.T, N = item.N) => {
  const S = $pieces[T].size
  for (let y = 0; y < S; y++) {
    if (!$cells[Y + y]) continue
    for (let x = 0; x < S; x++) {
      const cell = $pieces[T].get(x, y, R)
      if (cell > 0 && $cells[Y + y][X + x] !== 0) return false
    }
  }
  return (item = { X, Y, R, T, N }) // true
}

// const put = ({ X, Y, R, T }) => {
//   const S = $pieces[T].size
//   let success = false
//   for (let y = 0; y < S; y++) {
//     if (Y + y > $cells.height - 1) return false
//     for (let x = 0; x < S; x++) {
//       const cell = $pieces[T].get(x, y, R)
//       if (cell > 0 && $cells[Y + y]) {
//         $cells[Y + y][X + x] = cell
//         success = true
//       }
//     }
//   }
//   return success
// }

const update = (X, Y, R, action = 'gravity') => {
  if (($lines.length > 0 && game.singleBlock) || ($three.size > 0 && game.singleBlock)) return

  const previous = item
  const accepted = set(X, Y, R)
  if (accepted && action !== 'gravity' && (previous.X !== item.X || previous.Y !== item.Y || previous.R !== item.R)) {
    emitFx('fx:move', () => Object.freeze({
      action,
      from: Object.freeze({ X: previous.X, Y: previous.Y, R: previous.R }),
      to: Object.freeze({ X: item.X, Y: item.Y, R: item.R }),
      cells: getPieceFxCells(previous, $pieces, $cells)
    }))
  }

  if (!accepted && Y < item.Y) {
    game.drop = Math.max(0, game.drop - 1)

    game.scheduled = !game.scheduled
    if (game.scheduled) return

    if (put(item)) {
      emitFx('fx:lock', () => Object.freeze({
        cells: getPieceFxCells(item, $pieces, $cells),
        hard: game.hardDropPending
      }))
      game.hardDropPending = false
      $bus.emit('sound:drop')
      if (game.tetcolor) {
        game.cascadeDepth = 0
        $three = detectClears('tetcolor', getThreeBlock)
        game.chainBonus = 0
        if ($three.size) {
          game.matchStreak++
          const combo = comboBonusForStreak(game.matchStreak, game.scorePart)
          if (combo > 0) {
            game.bonusHoldPending = true
            game.bonus = combo
            game.score += combo
            $bus.emit('bonus', combo)
            $bus.emit('score', game.score)
            emitFx('fx:combo', () => Object.freeze({
              amount: combo,
              streak: game.matchStreak,
              cells: clearFxCells
            }))
          }
          $bus.emit('sound:clear')
        } else {
          game.matchStreak = 0
          game.bonus = 0
          $bus.emit('bonus', 0)
        }
      } else {
        $lines = detectClears('classic', () => getSolidLines({ asc: game.singleBlock, item }))
        if ($lines.length) $bus.emit('sound:clear')
      }

      item = next(item.N)
      // next(item.N)

      // reset all timers for next piece, except level timer
      game.intervals = { [game.levelTime * 1000]: game.intervals[game.levelTime * 1000] }
      game.gravityIntervals = {}
    } else {
      game.hardDropPending = false
      game.started = false
    }
  }

  // game.scheduled = false

  $bus.emit('update', item)
}

// const clearLines = _ => {
//   const h = $cells.height
//   const w = $cells.width
//   if (game.singleBlock) {
//     for (let y = $lines.pop(); y < h - 1; y++) {
//       for (let x = 1; x < w - 1; ++x) {
//         $cells[y][x] = $cells[y + 1][x]
//       }
//     }
//   } else {
//     game.totalLines += $lines.length - 1
//     let cur = $lines.pop()
//     for (let y = cur + 1; y < h; y++) {
//       const len = $lines.length
//       if (len && y == $lines[len - 1]) {
//         $lines.pop()
//         continue
//       }
//       for (let x = 1; x < w - 1; ++x) {
//         $cells[cur][x] = $cells[y][x]
//       }
//       cur++
//     }
//     for (let y = cur; y < h; y++) {
//       for (let x = 1; x < w - 1; ++x) {
//         $cells[y][x] = 0
//       }
//     }
//   }
//   $bus.emit('lines', game.totalLines++)
// }

// Touch drag expresses a target column, not a synthetic key hold.
// Move one cell at a time through update()/set() so collisions and the
// existing piece FX work identically to keyboard movement.
const moveToColumn = targetX => {
  if (!Number.isFinite(targetX) || !Number.isInteger(item.X) || !$cells) return
  const destination = Math.max(0, Math.min($cells.width - 1, Math.trunc(targetX)))
  while (item.X !== destination) {
    const before = item.X
    const step = destination > before ? 1 : -1
    update(before + step, item.Y, item.R, step > 0 ? 'right' : 'left')
    if (item.X === before) break // Wall, settled block or active clearing.
  }
}

const dropDown = _ => {
  const clearing = game.singleBlock && ($lines.length > 0 || $three.size > 0)
  const start = item
  while (set(item.X, item.Y - 1, item.R));
  const distance = start.Y - item.Y
  if (!clearing && distance > 0) {
    emitFx('fx:hard-drop', () => Object.freeze({
      from: Object.freeze({ X: start.X, Y: start.Y, R: start.R }),
      to: Object.freeze({ X: item.X, Y: item.Y, R: item.R }),
      distance,
      cells: getPieceFxCells(start, $pieces, $cells)
    }))
  }
  if (!clearing) game.hardDropPending = true
  update(item.X, item.Y + game.drop++, item.R)
}

// function removeThreeBlockSorted() {
//   const h = $cells.height
//   const xy = $three.sorted.pop()
//   const x = Math.floor(xy / h)
//   for (let y = xy - x * h; y < h; ++y) $cells[y][x] = $cells[y + 1][x]
// }
// function removeThreeBlock() {
//   const h = $cells.height
//   const w = $cells.width
//   for (let x = 1; x < w - 1; ++x) {
//     for (let cur = 1, y = cur; y < h + 1; ++y) {
//       if (!$three.has(x * h + y)) $cells[cur++][x] = $cells[y][x]
//     }
//   }
// }

// function getThreeBlock() {
//   const h = $cells.height
//   const w = $cells.width

//   const check = (x, y, ly = 0, lx = 0, ry = 0, rx = 0) =>
//     $cells[y + ly][x + lx] == $cells[y][x] && $cells[y + ry][x + rx] == $cells[y][x]

//   for (let y = 1; y < h - 1; ++y) {
//     for (let x = 1; x < w - 1; ++x) {
//       if ($cells[y][x] <= 0) continue
//       if (check(x, y,  0, -1, 0,  1)) $three.add(x * h + y).add((x - 1) * h + y).add((x + 1) * h + y) // prettier-ignore
//       if (check(x, y, -1, -1, 1,  1)) $three.add(x * h + y).add((x - 1) * h + y - 1).add((x + 1) * h + y + 1) // prettier-ignore
//       if (check(x, y, -1,  0, 1,  0)) $three.add(x * h + y).add(x * h + y - 1).add(x * h + y + 1) // prettier-ignore
//       if (check(x, y, -1,  1, 1, -1)) $three.add(x * h + y).add((x - 1) * h + y + 1).add((x + 1) * h + y - 1) // prettier-ignore
//     }
//   }
//   if ($three.size > 0) {
//     let delta = -1
//     $three.bonus = 0
//     for (let x = 1; x < w - 1; ++x) {
//       for (let y = 1; y < h - 1; ++y) {
//         const xhy = x * h + y
//         if ($three.has(xhy)) {
//           const diff = xhy - delta
//           delta = xhy
//           if (diff != h && diff != w && diff > 1) $three.bonus++
//           $cells[y][x] = -2
//         }
//       }
//     }
//   }
//   $three.sorted = Array.from($three)
//   $three.sorted.sort((a, b) => {
//     const xA = Math.floor(a / h)
//     const yA = a - xA * h
//     const xB = Math.floor(b / h)
//     const yB = b - xB * h
//     return yA == yB ? xB - xA : yA - yB
//   })
//   return $three.size
// }

// function getSolidLines(reverse = false) {
//   const dim = $pieces[item.T].size
//   const h = $cells.height
//   const w = $cells.width
//   const border = -2
//   for (let y = reverse ? dim - 1 : 0; reverse ? y >= 0 : y < dim; reverse ? --y : ++y) {
//     if (item.Y + y <= 0 || item.Y + y > h - 1) continue
//     let line = true
//     for (let x = 1; x < w - 1 && line; ++x) {
//       line = $cells[item.Y + y][x] != 0
//     }
//     if (line) {
//       $lines.push(item.Y + y)
//       for (let x = 1; x < w - 1; ++x) {
//         $cells[item.Y + y][x] = border
//       }
//     }
//   }
// }
