let gameStarted = false
let level = 0
const speed = 300
let currX = 0
let currY = 0
let rotate = 0
let current = -1
let next = -1
let $cells = null
let $pieces = null
let $bus = null

import { events } from '@/utils/events'

const nextPiece = _ => {
  current = next < 0 ? Math.floor(Math.random() * $pieces.length) : next
  next = Math.floor(Math.random() * $pieces.length)
  currX = Math.floor(($cells.width - $pieces[current].N) / 2 + 0.5)
  currY = $cells.height
  rotate = 0
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
      gameStarted = false
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
    for (let key in this.intervals) {
      console.log({ key, value: this.intervals[key] })
      this.intervals[key] = 0
    }
  },
  interval(delta) {
    this.intervals[delta] = this.intervals[delta] || 0
    return (this.currentTime - this.startedTime) / delta > this.intervals[delta]
  },
  updateIntervals() {
    for (let key in this.intervals) {
      if (this.interval(key)) this.intervals[key]++
    }
  },

  loop() {
    if (!gameStarted) return

    this.currentTime = performance.now()
    if (this.interval(1000)) {
      console.log({ sec: this.intervals[1000] })
    }

    if (this.interval(speed / (level + 1))) {
      update(currX, currY - 1, rotate)
    }

    if (events.left.active(this.currentTime)) update(currX - 1, currY, rotate)
    if (events.right.active(this.currentTime)) update(currX + 1, currY, rotate)
    if (events.rotate.active(this.currentTime)) update(currX, currY, rotate + 1)
    if (events.down) update(currX, currY - 1, rotate)

    this.updateIntervals()
    this.id = requestAnimationFrame(this.loop.bind(this))
  }
}

export function newGame(cells, pieces) {
  $cells = cells
  $pieces = pieces
  nextPiece()

  events.init()
  gameStarted = true
  gameLoop.start()
}

export function setEventHandler(bus) {
  $bus = bus
  $bus.$on('rotate:start', _ => events.rotate.start())
  $bus.$on('rotate:stop', _ => events.rotate.stop())
  $bus.$on('left:start', _ => events.left.start())
  $bus.$on('left:stop', _ => events.left.stop())
  $bus.$on('right:start', _ => events.right.start())
  $bus.$on('right:stop', _ => events.right.stop())
  $bus.$on('down:start', _ => (events.down = true))
  $bus.$on('down:stop', _ => (events.down = false))
}
