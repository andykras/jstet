import { events } from '@/utils/events'
import store from '@/store'
import { next } from '@/game/next'
import { put } from '@/game/put'
import { clearAllLines, clearOneLine, getSolidLines } from '@/game/tetris'

// todo clear measure!!!!!!!!!!!!!!!
const speed = { start: 1000, clear: 80, drop: 20, three: 100 }
// let item = { T: 0 }
let item = {}
let $cells = null
let $pieces = null
let $bus = null
let $lines = []
let $three = new Set()
$three.sorted = []

export function setup(bus) {
  events.init(), ($bus = bus)
  ;['rotate', 'left', 'right', 'down'].forEach(e => ['start', 'stop'].forEach(t => $bus.$on(e + ':' + t, _ => events.emit(e + ':' + t))))
  $bus.$on('start', _ => game.start())
  $bus.$on('pause', _ => (game.paused = !game.paused))
  $bus.$on('drop', hard => (hard ? dropDown() : game.drop++))
  $bus.$on('fill', _ => (game.clearAnimated = !game.clearAnimated))
  $bus.$on('fill:pause', _ => (game.pauseOnFill = !game.pauseOnFill))
  $bus.$on('next', _ => (item = next(item.N)))
}

export const game = {
  started: false,
  paused: false,

  level: 0,
  score: 0,
  bonus: 0,
  drop: 0,
  totalLines: 0,

  // TODO: move to options
  maxLevel: 9,
  levelTime: 60,
  scorePart: 10,
  bonusSize: 500,
  clearAnimated: true,
  removingAnimated: true,
  pauseOnFill: true,
  tetcolor: true,

  // speed: _ => (game.drop > 0 ? speed.drop / game.drop : speed.start / (game.level + 1)),
  speed: _ => (game.drop > 0 ? speed.drop / game.drop : Math.floor(speed.start - 150 * game.level + 4.3 * game.level * game.level)),
  clearSpeed: _ => (game.clearAnimated ? speed.clear : 2 * speed.clear),

  start() {
    $cells = store.state.cells
    $pieces = store.state.pieces

    cancelAnimationFrame(this.id)
    this.intervals = {}
    this.started = true
    this.drop = this.totalLines = 0
    item = next()
    item = next(item.N)
    this.startedTime = performance.now()
    this.id = requestAnimationFrame(this.loop.bind(this))

    game.level = game.score = 0
    game.scorePart = 10
    game.bonus = game.bonusSize
    $bus.$emit('level', game.level)
    $bus.$emit('score', 0)

    this.performance_measure_counter = 0
    this.performance_measure_delta = 0
  },

  interval(delta) {
    const count = (this.currentTime - this.startedTime) / delta
    this.intervals[delta] = this.intervals[delta] || count
    return count > this.intervals[delta] + 1
  },

  increase() {
    for (let [key] of Object.entries(this.intervals)) if (this.interval(key)) this.intervals[key]++
  },

  loop() {
    if (this.performance_measure_counter > 100 && this.performance_measure_delta < performance.now() - this.currentTime) {
      this.performance_measure_delta = performance.now() - this.currentTime
      console.log({ delta: this.performance_measure_delta })
    }
    this.performance_measure_counter++

    if (!game.started) return $bus.$emit('done')
    this.currentTime = performance.now()

    if (!game.paused && game.level < game.maxLevel - 1 && this.interval(game.levelTime * 1000)) {
      $bus.$emit('level', ++game.level)
      console.log({ speed: game.speed() })
    }

    if ($three.size && this.interval(speed.three)) {
      // removeThreeBlockOne()
      removeThreeBlockSorted()
      if ($three.sorted.length == 0) $three.clear()
      if ($three.size == 0) {
        getThreeBlock()
        if ($three.size) {
          game.bonus += Math.round((game.bonusSize + 0.5 * game.bonus) / 100) * 100
          game.score += game.bonus
          $bus.$emit('bonus', game.bonus)
        } else {
          game.bonus = 0
        }
        game.scorePart = 10
      } else {
        game.scorePart += 5
        game.score += game.scorePart
      }
      $bus.$emit('lines', game.totalLines++)
      $bus.$emit('score', game.score)
      // game.totalLines += $three.size
      // removeThreeBlock()
      // getThreeBlock()
      // $bus.$emit('lines', game.totalLines - 1)
    }

    if ($lines.length && this.interval(game.clearSpeed())) {
      game.totalLines += game.clearAnimated ? clearOneLine() : clearAllLines()
      $bus.$emit('lines', game.totalLines)
    }

    if (!game.paused && this.interval(game.speed())) update(item.X, item.Y - 1, item.R)
    if (events.left.active(this.currentTime)) update(item.X - 1, item.Y, item.R)
    if (events.right.active(this.currentTime)) update(item.X + 1, item.Y, item.R)
    if (events.rotate.active(this.currentTime)) update(item.X, item.Y, item.R + 1)
    if (events.down.active(this.currentTime)) update(item.X, item.Y - 1, item.R)

    this.increase()
    this.id = requestAnimationFrame(this.loop.bind(this))
  }
}

// const rand = _ => Math.floor(Math.random() * $pieces.length)

// const next = N => {
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
//   game.drop = Math.max(0, game.drop - 1)
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

const update = (X, Y, R) => {
  if (($lines.length > 0 && game.clearAnimated) || ($three.size > 0 && game.removingAnimated)) return
  if (!set(X, Y, R) && Y < item.Y) {
    if (put(item)) {
      if (game.tetcolor) getThreeBlock()
      else $lines = getSolidLines({ asc: game.clearAnimated, item })
      $bus.$emit('bonus', 0)
      item = next(item.N)

      // reset all timers on next piece, except level timer
      game.intervals = { [game.levelTime * 1000]: game.intervals[game.levelTime * 1000] }
    } else {
      game.started = false
    }
  }
  $bus.$emit('update', item)
}

// const clearLines = _ => {
//   const h = $cells.height
//   const w = $cells.width
//   if (game.clearAnimated) {
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
//   $bus.$emit('lines', game.totalLines++)
// }

function dropDown(allowFinalMove = false) {
  while (set(item.X, item.Y - 1, item.R));
  update(item.X, item.Y - 1 + allowFinalMove, item.R)
}

function removeThreeBlockSorted() {
  const h = $cells.height

  const xy = $three.sorted.pop()

  let x = Math.floor(xy / h)
  let y = xy - x * h
  // console.log({ x, y, xy })
  for (; y < h; ++y) {
    $cells[y][x] = $cells[y + 1][x]
  }

  // $three.sorted.forEach(xy => {
  //   const x = Math.floor(xy / h)
  //   const y = xy - x * h
  //   console.log({ x, y })
  // })
}
function removeThreeBlockOne() {
  const h = $cells.height
  const w = $cells.width
  let done = false
  for (let x = 1; x < w - 1 && !done; ++x) {
    for (let cur = 1, y = cur; y < h + 1; ++y) {
      if (!$three.has(x * h + y)) $cells[cur++][x] = $cells[y][x]
      else done = $three.delete(x * h + y)
    }
  }
}
function removeThreeBlock() {
  const h = $cells.height
  const w = $cells.width
  for (let x = 1; x < w - 1; ++x) {
    for (let cur = 1, y = cur; y < h + 1; ++y) {
      if (!$three.has(x * h + y)) $cells[cur++][x] = $cells[y][x]
    }
  }
  $three.clear()
}

function getThreeBlock() {
  const h = $cells.height
  const w = $cells.width

  const check = (x, y, ly = 0, lx = 0, ry = 0, rx = 0) => $cells[y + ly][x + lx] == $cells[y][x] && $cells[y][x] == $cells[y + ry][x + rx]

  for (let y = 1; y < h - 1; ++y) {
    for (let x = 1; x < w - 1; ++x) {
      if ($cells[y][x] <= 0) continue
      if (check(x, y,  0, -1, 0,  1)) $three.add(x * h + y).add((x - 1) * h + y).add((x + 1) * h + y) // prettier-ignore
      if (check(x, y, -1, -1, 1,  1)) $three.add(x * h + y).add((x - 1) * h + y - 1).add((x + 1) * h + y + 1) // prettier-ignore
      if (check(x, y, -1,  0, 1,  0)) $three.add(x * h + y).add(x * h + y - 1).add(x * h + y + 1) // prettier-ignore
      if (check(x, y, -1,  1, 1, -1)) $three.add(x * h + y).add((x - 1) * h + y + 1).add((x + 1) * h + y - 1) // prettier-ignore
    }
  }
  if ($three.size > 0) {
    for (let x = 1; x < w - 1; ++x) {
      for (let y = 1; y < h - 1; ++y) {
        if ($three.has(x * h + y)) {
          $cells[y][x] = -2
        }
      }
    }
  }
  $three.sorted = Array.from($three)
  $three.sorted.sort((a, b) => {
    const xA = Math.floor(a / h)
    const yA = a - xA * h
    const xB = Math.floor(b / h)
    const yB = b - xB * h
    return yA == yB ? xB - xA : yA - yB
  })
}

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
