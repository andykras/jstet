import { events } from '@/utils/events'
import store from '@/store'
import { next } from '@/game/next'
import { put } from '@/game/put'
import { clearAllLines, clearOneLine, getSolidLines } from '@/game/tetris'
import { removeThreeBlockSorted, removeThreeBlock, getThreeBlock } from '@/game/tetcolor'

// todo clear measure!!!!!!!!!!!!!!!
const speed = { start: 1000, clear: 80, drop: 20, three: 80, scheduled: 100 }
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
  $bus.$on('fill', _ => (game.singleBlock = !game.singleBlock))
  $bus.$on('next', _ => (item = next(item.N)))
  // $bus.$on('next', _ => next(item.N))
}

export const game = {
  // TODO: move to options
  maxLevel: 9,
  levelTime: 60,
  scorePart: 10,
  bonusSize: 500,
  singleBlock: true,
  tetcolor: true,

  levelSpeed: level => Math.floor(speed.start - 150 * level + 4.3 * level * level),
  clearSpeed: _ => (game.tetcolor ? speed.three : game.singleBlock ? speed.clear : 2 * speed.clear),
  speed: _ => (game.scheduled ? speed.scheduled : game.drop > 0 ? speed.drop / game.drop : game.levelSpeed(game.level)),

  start() {
    cancelAnimationFrame(this.id)

    $cells = store.state.cells
    $pieces = store.state.pieces

    this.paused = this.level = this.score = this.bonus = this.drop = this.totalLines = this.scheduled = 0
    this.intervals = {}
    this.started = true

    item = next(next().N)
    // next(rand())
    // next(item.N)

    this.startedTime = performance.now()
    this.id = requestAnimationFrame(this.loop.bind(this))

    $bus.$emit('level', game.level)
    $bus.$emit('score', game.score)

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

    if ($three.size && this.interval(game.clearSpeed())) {
      do {
        const add = Math.floor(game.scorePart * ($three.bonus / $three.sorted.length))
        game.score += add
        if (!game.singleBlock) $three.sorted.pop()
      } while ($three.sorted.length && !game.singleBlock)
      game.totalLines += game.singleBlock ? removeThreeBlockSorted() || 1 : removeThreeBlock() || $three.size
      if ($three.sorted.length === 0) {
        $three.clear()
        if (($three = getThreeBlock()).size) {
          game.bonus += Math.round((game.bonusSize + 0.5 * game.bonus) / 100) * 100
          game.score += game.bonus
          $bus.$emit('bonus', game.bonus)
        } else {
          game.bonus = 0
        }
      }
      $bus.$emit('lines', game.totalLines)
      $bus.$emit('score', game.score)
    }

    if ($lines.length && this.interval(game.clearSpeed())) {
      game.totalLines += game.singleBlock ? clearOneLine() : clearAllLines()
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

const update = (X, Y, R) => {
  if (($lines.length > 0 && game.singleBlock) || ($three.size > 0 && game.singleBlock)) return

  if (!set(X, Y, R) && Y < item.Y) {
    game.drop = Math.max(0, game.drop - 1)

    game.scheduled = !game.scheduled
    if (game.scheduled) return

    if (put(item)) {
      if (game.tetcolor) $three = getThreeBlock()
      else $lines = getSolidLines({ asc: game.singleBlock, item })

      $bus.$emit('bonus', 0)
      item = next(item.N)
      // next(item.N)

      // reset all timers for next piece, except level timer
      game.intervals = { [game.levelTime * 1000]: game.intervals[game.levelTime * 1000] }
    } else {
      game.started = false
    }
  }

  // game.scheduled = false

  $bus.$emit('update', item)
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
//   $bus.$emit('lines', game.totalLines++)
// }

const dropDown = _ => {
  while (set(item.X, item.Y - 1, item.R));
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

//   const check = (x, y, ly = 0, lx = 0, ry = 0, rx = 0) => $cells[y + ly][x + lx] == $cells[y][x] && $cells[y][x] == $cells[y + ry][x + rx]

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
