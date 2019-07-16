import { events } from '@/utils/events'

const speed = { start: 300, drop: 20 }

const game = {
  started: false,
  level: 0,
  paused: false,
  drop: 0,
  speed: _ => (game.drop > 0 ? speed.drop / game.drop : speed.start / (game.level + 1))
}

let currX = 0
let currY = 0
let rotate = 0
let current = -1
let next = -1

let $cells = null
let $pieces = null
let $bus = null

const nextPiece = _ => {
  current = next < 0 ? Math.floor(Math.random() * $pieces.length) : next
  next = Math.floor(Math.random() * $pieces.length)
  currX = Math.floor(($cells.width - $pieces[current].N) / 2 + 0.5)
  currY = $cells.height
  rotate = 0
  game.drop = Math.max(0, game.drop - 1)
}

const check = (T, X, Y, R) => {
  const N = $pieces[T].N
  for (let y = 0; y < N; y++) {
    if (!$cells[Y + y]) continue
    for (let x = 0; x < N; x++) {
      const cell = $pieces[T].get(x, y, R)
      if (cell > 0 && $cells[Y + y][X + x] !== 0) return false
    }
  }
  ;[currX, currY, rotate] = [X, Y, R]
  return true
}

const put = (T, X, Y, R) => {
  const N = $pieces[T].N
  let success = false
  for (let y = 0; y < N; y++) {
    if (Y + y > $cells.height - 1) return false
    for (let x = 0; x < N; x++) {
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
  if (!check(current, X, Y, R) && Y < currY) {
    if (put(current, currX, currY, rotate)) {
      nextPiece()
    } else {
      game.started = false
      console.log('done')
    }
  }
  $bus.$emit('update', { currX, currY, rotate, current, next })
}

const gameLoop = {
  intervals: {},
  start() {
    cancelAnimationFrame(this.id)
    this.startedTime = performance.now()
    this.clear()
    this.loop()
  },
  clear() {
    for (let key in this.intervals) this.intervals[key] = 0
  },
  interval(delta) {
    delta = +delta
    // const count = Math.floor((this.currentTime - this.startedTime) / delta)
    const count = (this.currentTime - this.startedTime) / delta
    this.intervals[delta] = this.intervals[delta] || count
    return count > this.intervals[delta]
  },
  updateIntervals() {
    for (let key in this.intervals) {
      if (this.interval(key)) this.intervals[key]++
    }
  },
  loop() {
    if (!game.started) return

    this.currentTime = performance.now()
    if (this.interval(1000)) {
      console.log({ sec: this.intervals[1000] })
    }

    if (!game.paused && this.interval(game.speed())) {
      update(currX, currY - 1, rotate)
    }

    if (events.left.active(this.currentTime)) update(currX - 1, currY, rotate)
    if (events.right.active(this.currentTime)) update(currX + 1, currY, rotate)
    if (events.rotate.active(this.currentTime)) update(currX, currY, rotate + 1)
    if (events.down.active(this.currentTime)) update(currX, currY - 1, rotate)

    this.updateIntervals()
    this.id = requestAnimationFrame(this.loop.bind(this))
  }
}

function newGame({ cells, pieces }) {
  $cells = cells
  $pieces = pieces

  game.drop = 1
  nextPiece()

  game.started = true
  gameLoop.start()
}

export function setEventHandler(bus) {
  events.init(), ($bus = bus)
  ;['rotate', 'left', 'right', 'down'].forEach(event =>
    ['start', 'stop'].forEach(type =>
      // subscribe on events 'event:type'
      $bus.$on(event + ':' + type, _ => events.emit(event + ':' + type))
    )
  )
  $bus.$on('pause', _ => (game.paused = !game.paused))
  $bus.$on('start', newGame)
  $bus.$on('drop', _ => game.drop++)
  $bus.$on('hard', _ => {
    while (check(current, currX, currY - 1, rotate)) update(currX, currY, rotate)
  })
}
