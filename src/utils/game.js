import { events } from '@/utils/events'

// todo fill measure!!!!!!!!!!!!!!!
const speed = { start: 300, fill: 80, drop: 20 }
// let item = { T: 0 }
let item = {}
let $cells = null
let $pieces = null
let $bus = null
let $lines = []

export function setup(bus) {
  events.init(), ($bus = bus)
  ;['rotate', 'left', 'right', 'down'].forEach(e => ['start', 'stop'].forEach(t => $bus.$on(e + ':' + t, _ => events.emit(e + ':' + t))))
  $bus.$on('start', ({ cells, pieces }) => (($cells = cells), ($pieces = pieces), game.start()))
  $bus.$on('pause', _ => (game.paused = !game.paused))
  $bus.$on('drop', hard => (hard ? dropDown() : game.drop++))
  $bus.$on('fill', _ => (game.fillAnimated = !game.fillAnimated))
  $bus.$on('fill:pause', _ => (game.pauseOnFill = !game.pauseOnFill))
}

const game = {
  started: false,
  level: 0,
  paused: false,
  drop: 0,
  fillAnimated: true,
  pauseOnFill: true,
  totalLines: 0,

  speed: _ => (game.drop > 0 ? speed.drop / game.drop : speed.start / (game.level + 1)),

  start() {
    cancelAnimationFrame(this.id)
    this.intervals = {}
    this.started = this.drop = this.totalLines = 1
    next()
    this.startedTime = performance.now()
    this.id = requestAnimationFrame(this.loop.bind(this))

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

    if ($lines.length && this.interval(speed.fill)) fill()
    if (!game.paused && this.interval(game.speed())) update(item.X, item.Y - 1, item.R)
    if (events.left.active(this.currentTime)) update(item.X - 1, item.Y, item.R)
    if (events.right.active(this.currentTime)) update(item.X + 1, item.Y, item.R)
    if (events.rotate.active(this.currentTime)) update(item.X, item.Y, item.R + 1)
    if (events.down.active(this.currentTime)) update(item.X, item.Y - 1, item.R)

    this.increase()
    this.id = requestAnimationFrame(this.loop.bind(this))
  }
}

const rand = _ => Math.floor(Math.random() * $pieces.length)

const next = _ => {
  item = {
    T: item.N || rand(),
    N: rand(),
    X: Math.round(($cells.width - $pieces[0].size) / 2),
    Y: $cells.height - 1,
    R: 0
  }
  game.drop = Math.max(0, game.drop - 1)
}

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

const put = ({ X, Y, R, T }) => {
  const S = $pieces[T].size
  let success = false
  for (let y = 0; y < S; y++) {
    if (Y + y > $cells.height - 1) return false
    for (let x = 0; x < S; x++) {
      const cell = $pieces[T].get(x, y, R)
      if (cell > 0 && $cells[Y + y]) {
        $cells[Y + y][X + x] = cell
        success = true
      }
    }
  }
  return success
}

const update = (X, Y, R) => {
  if ($lines.length > 0 && game.pauseOnFill) return
  if (!set(X, Y, R) && Y < item.Y) {
    if (put(item)) {
      getSolidLines(!game.fillAnimated)
      next()
      game.intervals = {} // reset timers on next piece, so the next piece falling starts to count from zero
    } else {
      game.started = false
    }
  }
  $bus.$emit('update', item)
}

const fill = _ => {
  //if(game.fillAnimated) todo
  const h = $cells.height
  const w = $cells.width
  for (let y = $lines.pop(); y < h - 1; y++) {
    for (let x = 1; x < w - 1; ++x) {
      $cells[y][x] = $cells[y + 1][x]
    }
  }
  $bus.$emit('lines', game.totalLines++)
}

function dropDown(allowFinalMove = false) {
  while (set(item.X, item.Y - 1, item.R));
  update(item.X, item.Y - 1 + allowFinalMove, item.R)
}

function getSolidLines(reverse = false) {
  const dim = $pieces[item.T].size
  const h = $cells.height
  const w = $cells.width
  const border = -2
  for (let y = reverse ? dim - 1 : 0; reverse ? y >= 0 : y < dim; reverse ? --y : ++y) {
    if (item.Y + y <= 0 || item.Y + y > h - 1) continue
    let line = true
    for (let x = 1; x < w - 1 && line; ++x) {
      line = $cells[item.Y + y][x] != 0
    }
    if (line) {
      $lines.push(item.Y + y)
      for (let x = 1; x < w - 1; ++x) {
        $cells[item.Y + y][x] = border
      }
    }
  }
}
