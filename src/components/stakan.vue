<template>
  <div class="main">
    <div class="info">
      <div>Lines: {{totalLines}}</div>
      <div class="stakan next">
        <div v-for="y in getSize(nextTet)"
             :key="y"
             class="row">
          <div v-for="x in getSize(nextTet)"
               :key="x"
               :class="'N' + getPiece(nextTet, x-1, y-1, 0)">
            <span v-html="getSymbol(x-1, y-1, nextTet, 0)"></span>
          </div>
        </div>
      </div>
    </div>
    <div class="stakan">
      <div class="dupa"
           :class="{end:!gameActive}">ДУПА</div>
      <div>
        <div>animated: {{linesAnimated ? 'A': 'a'}}</div>
        <div>drop soft: {{dropSoft ? 'S' : 's'}}</div>
        <div>theme: {{theme}}</div>
        <div class="github">
          <svg height="16"
               width="16"
               class="octicon octicon-mark-github"
               viewBox="0 0 16 16"
               version="1.1"
               aria-hidden="true">
            <path fill-rule="evenodd"
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47
                  7.59.4.07.55-.17.55-.38
                  0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01
                  1.08.58 1.23.82.72 1.21 1.87.87
                  2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12
                  0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08
                  2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2
                  0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
          <a href="https://github.com/andykras/jstet">github.com/andykras/jstet</a>
        </div>
      </div>
      <div v-for="y in cells.height"
           :key="y"
           class="row">
        <div v-for="x in cells.width"
             :key="x"
             :class="'N' + getValue(x, y)">
          <span v-html="getSymbol(x, y)"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const border = 9
const space = 0
const h = 20
const w = 12
let startY = h - 1
let indexBorder = 0
let ticks = performance.now()
let iskeydown = false
let nm = 0
let dim = 4 // tetra
const speed = 300

const filled = 0 //0.38
const emptyCells = _ => {
  const res = Array.from({ length: h + nm }, (_, row) =>
    Array.from({ length: w }, (_, i) =>
      i == 0 || i == w - 1 || row == 0 ? border : row < h / 3 && Math.random() < filled ? Math.floor(Math.random() * 7) : space
    )
  )
  res.width = w
  res.height = h
  return res
}

export default {
  name: 'stakan',
  data() {
    const tets = []
    const z = 0

    // pentix
    // tets.push([
    //   //
    //   [z, z, z, z, z],
    //   [z, z, 1, 1, z],
    //   [z, z, 1, z, z],
    //   [z, 1, 1, z, z],
    //   [z, z, z, z, z]
    // ])
    // tets.push([
    //   //
    //   [z, z, z, z, z],
    //   [z, z, 1, 1, z],
    //   [z, 1, 1, z, z],
    //   [z, z, 1, z, z],
    //   [z, z, z, z, z]
    // ])

    // tetris:
    tets.push([
      //
      // [z, 1, z, z],
      // [z, 1, z, z],
      // [z, 1, z, z],
      // [z, 1, z, z]
      // [z, 1],
      // [z, 1],
      // [z, 1],
      // [z, 1]
      [z],
      [1, 1, 1, 1],
      [z],
      [z]
    ])
    tets.push([
      //
      // [z, z, 2, z],
      // [z, 2, 2, z],
      // [z, 2, z, z],
      // [z, z, z, z]
      // [z, z, 2],
      // [z, 2, 2],
      // [z, 2, z]
      [2, 2],
      [z, 2, 2],
      [z]
    ])
    tets.push([
      //
      // [z, 3, z, z],
      // [z, 3, 3, z],
      // [z, z, 3, z],
      // [z, z, z, z]
      // [3, z, z],
      // [3, 3, z],
      // [z, 3, z]
      [z, 3, 3],
      [3, 3, z],
      [z]
    ])
    tets.push([
      //
      // [z, z, z, z],
      // [z, 4, 4, z],
      // [z, 4, 4, z],
      // [z, z, z, z]
      [4, 4],
      [4, 4]
    ])
    tets.push([
      //
      // [z, z, 5, z],
      // [z, 5, 5, z],
      // [z, z, 5, z],
      // [z, z, z, z]
      // [z, z, z],
      // [5, 5, 5],
      // [z, 5, z]
      [z, 5],
      [5, 5, 5],
      [z]
    ])
    tets.push([
      //
      // [z, z, z, z],
      // [z, 6, 6, z],
      // [z, z, 6, z],
      // [z, z, 6, z]
      // [z, 6, z],
      // [z, 6, z],
      // [z, 6, 6]
      // [z, 6],
      // [z, 6],
      // [z, 6, 6]
      [6],
      [6, 6, 6],
      [z]
    ])
    tets.push([
      //
      //[z, z, z, z],
      // [z, 7, 7, z],
      // [z, 7, z, z],
      // [z, 7, z, z]
      // [z, 7, z],
      // [z, 7, z],
      // [7, 7, z]
      [z],
      [7, 7, 7],
      [7]
    ])
    nm = 0 //tets[0].length
    // make cells height bigger than visible height to prevent moving piece ot ouf the border, esp. when quickly moving to left\right

    const cells = emptyCells()
    return {
      cells,
      tets,
      curTet: 0,
      nextTet: 0,
      rotate: 0,
      tryRotate: 0,
      currX: w / 2 - 1,
      currY: startY,
      tryX: w / 2 - 1,
      tryY: startY,
      lines: [],
      loop: null,
      posDecrement: null,
      gameActive: false,
      dropping: false,
      dropSoft: true,
      theme: 1,
      totalLines: 0,
      linesCutting: false,
      linesAnimated: true
    }
  },
  created() {
    this.newGame()
    window.addEventListener('keydown', this.keydown)
    window.addEventListener('keyup', this.keyup)
    window.addEventListener('keypress', this.keypress)
  },
  destroyed() {
    clearInterval(this.loop)
    clearInterval(this.posDecrement)
    window.removeEventListener('keydown', this.keydown)
    window.removeEventListener('keyup', this.keyup)
    window.removeEventListener('keypress', this.keypress)
  },
  mounted() {
    this.curTet = Math.floor(Math.random() * this.tets.length)
    this.nextTet = Math.floor(Math.random() * this.tets.length)
  },
  methods: {
    getSymbol(x, y, T, R) {
      const pieceOnly = T !== undefined
      const val = pieceOnly ? this.getPiece(T, x, y, R) : this.getValue(x, y)
      switch (this.theme) {
        case 1:
          if (pieceOnly) return '&nbsp;'
          if (val == 9) return y == h ? '※' : y == 1 ? '֍' : '‖'
          //   return val ? "&nbsp;" : "•";
          //   let line = "⌌⌏⌎⌍"[Math.floor(Math.random() * 4)];
          let line = '×Ø•'[Math.floor(Math.random() * 3)]
          return val == 0 ? '•' : val == 8 ? line : '&nbsp;'

        case 2:
          if (pieceOnly) return val ? '.-'[Math.floor(Math.random() * 2)] : '&nbsp;'
          // "qwertyuiopasdfghjklzxcvbnm"[Math.floor(Math.random() * 26)]
          const border = this.gameActive ? '\\|/-'[indexBorder % 4] : 'x'
          return val == 9 ? border : val != 8 && val ? '.-'[Math.floor(Math.random() * 2)] : val == 8 ? '&nbsp;' : '.'
        case 3:
          if (pieceOnly) return val ? '[ ]' : '&nbsp;'
          if (val == 9) {
            return x == 1 ? '&lt;!' : y == 1 && x < w ? '==<br>\\/' : '!&gt;'
          }
          return val == 0 ? '.' : val == 8 ? '--' : '[ ]'
        case 4:
          return '&nbsp;'
      }
      return val
    },
    getPiece(T, x, y, r) {
      const N = this.getSize(T)
      switch (r % 4) {
        case 1:
          ;[x, y] = [N - y - 1, x]
          break
        case 2:
          ;[x, y] = [N - x - 1, N - y - 1]
          break
        case 3:
          ;[x, y] = [y, N - x - 1]
          break
      }
      return this.tets[T][y] && this.tets[T][y][x]
    },

    newGame() {
      if (this.loop != null) this.cells = emptyCells()

      this.totalLines = 0
      this.gameActive = true
      this.posDecrement = setInterval(_ => {
        if (this.dropping) return
        indexBorder++
        if (!this.linesCutting) this.tryY--
        // this.tryY--
        this.render()
      }, speed)
      this.loop = setInterval(_ => {
        // this.tryY--;
        // this.render();
      }, 10)
    },
    keydown(e) {
      if (this.linesCutting) return
      e.preventDefault()
      if (!this.gameActive) return this.newGame()

      if (!this.gameActive) return

      if (e.code == 'KeyP') {
        if (this.loop == null) {
          return this.newGame()
        }
        clearInterval(this.loop)
        clearInterval(this.posDecrement)
        this.loop = null
      } else if (e.code == 'Space') {
        if (this.dropSoft) {
          this.dropping = true
          let start = performance.now()
          const step = _ => {
            const curr = performance.now()
            if (curr - start > 10) {
              start = curr
              const check = this.check(this.curTet, this.currX, this.tryY - 1, this.rotate)
              this.tryY--
              this.render()
              if (!check) {
                this.dropping = false
                return
              }
            }
            requestAnimationFrame(step)
          }
          step()
        } else {
          while (this.check(this.curTet, this.currX, this.currY - 1, this.rotate)) this.currY--
          this.tryY = this.currY - 1
        }
      } else if (e.code == 'ArrowUp' && (!iskeydown || ticks + 100 < performance.now())) {
        ticks = performance.now()
        this.tryRotate++
      } else if (e.code == 'ArrowDown') this.tryY--
      else if (e.code == 'ArrowLeft') this.tryX--
      else if (e.code == 'ArrowRight') this.tryX++
      this.render()
      iskeydown = true
    },
    keyup(e) {
      e.preventDefault()
      // ticks = performance.now()
      iskeydown = false
      let p = parseInt(e.key)
      if (p >= 0 && p <= 9) {
        this.theme = p
      }
      if (e.key == 'a') this.linesAnimated = !this.linesAnimated
      if (e.key == 's') this.dropSoft = !this.dropSoft
    },
    keypress(e) {
      e.preventDefault()
    },
    getSize(T) {
      return this.tets[T].length
      // return this.tets[T].reduce((acc, cur) => Math.max(acc, cur.length), 0)
    },
    getValue(x, y) {
      const R = this.rotate
      const T = this.curTet
      return this.getPiece(T, x - this.currX - 1, y - this.currY - 1, R) || this.cells[y - 1][x - 1]
    },
    drop() {
      while (this.check(this.curTet, this.currX, this.tryY - 1, this.rotate)) this.tryY--
    },
    render() {
      const check = this.check(this.curTet, this.tryX, this.tryY, this.tryRotate)
      // console.log({ check })
      if (check) {
        this.currX = this.tryX
        this.currY = this.tryY
        this.rotate = this.tryRotate
      } else {
        if (this.tryY < this.currY) {
          const put = this.put(this.curTet, this.currX, this.currY, this.rotate)
          if (!put) {
            clearInterval(this.loop)
            clearInterval(this.posDecrement)
            this.gameActive = false
            console.log('FINITA')
          } else {
            const lines = this.getSolidLines(!this.linesAnimated)

            if (lines.length && this.linesAnimated) {
              let start = performance.now()
              this.linesCutting = true
              const step = _ => {
                const curr = performance.now()
                if (curr - start > 80) {
                  start = curr
                  for (let y = lines.pop(); y < h - 1; y++) {
                    for (let x = 1; x < w - 1; ++x) {
                      this.cells[y][x] = this.cells[y + 1][x]
                    }
                  }
                  this.totalLines++
                  if (!lines.length) {
                    this.linesCutting = false
                    return
                  }
                }
                requestAnimationFrame(step)
              }
              step()
            }

            if (lines.length && !this.linesAnimated) {
              setTimeout(_ => {
                this.totalLines += lines.length
                let cur = lines.pop()
                for (let y = cur + 1; y < h; y++) {
                  const len = lines.length
                  if (len && y == lines[len - 1]) {
                    lines.pop()
                    continue
                  }
                  for (let x = 1; x < w - 1; ++x) {
                    this.cells[cur][x] = this.cells[y][x]
                  }
                  cur++
                }
                for (let y = cur; y < h; y++) {
                  for (let x = 1; x < w - 1; ++x) {
                    this.cells[y][x] = 0
                  }
                }
              }, 100)
            }
            this.currX = w / 2 - 1
            this.currY = startY
            this.rotate = 0
            this.curTet = this.nextTet
            this.nextTet = Math.floor(Math.random() * this.tets.length)
          }
        }
        this.tryX = this.currX
        this.tryY = this.currY
        this.tryRotate = this.rotate
      }
      // console.log({ curTet: this.curTet, Y: this.currY, X: this.currX, check })
    },
    check(T, X, Y, R) {
      const N = this.getSize(T)
      for (let y = 0; y < N; y++) {
        if (!this.cells[Y + y]) continue
        for (let x = 0; x < N; x++) {
          const cell = this.getPiece(T, x, y, R)
          if (cell > 0 && this.cells[Y + y][X + x] > 0) return false
        }
      }
      return true
    },
    put(T, X, Y, R) {
      const N = this.getSize(T)
      let success = false
      for (let y = 0; y < N; y++) {
        if (Y + y > h - 1) return false
        for (let x = 0; x < N; x++) {
          const cell = this.getPiece(T, x, y, R)
          if (cell > 0 && this.cells[Y + y]) {
            this.cells[Y + y][X + x] = cell
            success = true
          }
        }
      }
      return success
    },
    getSolidLines(reverse = false) {
      let lines = []
      for (let y = reverse ? dim - 1 : 0; reverse ? y >= 0 : y < dim; reverse ? --y : ++y) {
        if (this.currY + y <= 0 || this.currY + y > h - 1) continue
        let line = true
        for (let x = 1; x < w - 1 && line; ++x) {
          line = this.cells[this.currY + y][x] != 0
        }
        if (line) {
          lines.push(this.currY + y)
          for (let x = 1; x < w - 1; ++x) {
            this.cells[this.currY + y][x] = 8
          }
        }
      }
      return lines
    }
  }
}
</script>

<style scoped lang="stylus">
.main {
  text-align: center
  display: flex
  // margin: auto
  // flex-direction: row
  justify-content: center

  .info {
    display: flex
    // padding: 1rem
    flex-direction: column
    min-width: 7rem
    align-items: center

    &> div {
      padding-bottom: 0.3rem
    }
  }

  .github {
    & > a {
      display: inline-block
      height: 28px
      padding-left: 0.2rem
      vertical-align: middle
      font-size: small
      color: #25a5ff
      font-family: 'Segoe UI'
      // font-weight: 500;
      text-decoration: none
    }
  }

  .dupa {
    position: relative
    background: rgba(252, 255, 79, 0.878)
    width: 50%
    align-self: center
    border: 2px solid #333
    padding: 0.5em
    color: red
    transition: all 1s
    // transition: all 1s cubic-bezier(0, 0, 0.2, 1)
    top: -30em
    opacity: 0

    &.end {
      top: -18em
      opacity: 1
    }
  }

  .stakan {
    // flex: 1 1
    display: flex
    // margin: auto
    flex-direction: column-reverse

    // justify-content: center
    .row {
      display: flex

      // flex-direction: row
      // justify-content: center
      // align-items: baseline
      & > div {
        height: 25px
        width: 25px
        // flex: 0 0 25px
        background-color: #efe
        // background-color: #eee
        font-family: 'Helvetica Neue'
        font-weight: 900
        font-size: 20px

        &.N1 {
          background-color: #8cff8c
        }

        &.N2 {
          background-color: #ed8cff
        }

        &.N3 {
          background-color: lightness(#ed8cff, 81%)
        }

        &.N4 {
          background-color: #ff6c6c
        }

        &.N5 {
          background-color: #caca0a
        }

        &.N6 {
          background-color: #4fb6ff
        }

        &.N7 {
          background-color: #4ff6ff
        }

        &.N8 {
          background-color: #aebece
        }

        &.N9 {
          // background-color: #abc
          background-color: #eee
        }
      }
    }
  }

  .next {
    // flex: 0.3

    // align-items: flex-end
    .row {
      .N0 {
        background: transparent
      }
    }
  }
}
</style>
