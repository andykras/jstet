<template>
  <div class="main">
    <div class="stakan next">
      <div>
        <input type="number"
               v-model.number="theme">
      </div>
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
    <div class="stakan">
      <div v-if="!gameActive">ДУПА</div>
      <div v-for="y in 20"
           :key="y"
           class="row">
        <div v-for="x in 10"
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
const w = 10
let startY = h - 1
let indexBorder = 0
let ticks = performance.now()
let iskeydown = false
let nm = 0

const filled = 0 //0.38
const emptyCells = _ =>
  Array.from({ length: h + nm }, (_, row) =>
    Array.from({ length: w }, (_, i) =>
      i == 0 || i == w - 1 || row == 0 ? border : row < h / 3 && Math.random() < filled ? Math.floor(Math.random() * 7) : space
    )
  )

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
      [z, 1, z, z],
      [z, 1, z, z],
      [z, 1, z, z],
      [z, 1, z, z]
    ])
    tets.push([
      //
      // [z, z, 2, z],
      // [z, 2, 2, z],
      // [z, 2, z, z],
      // [z, z, z, z]
      [z, z, 2],
      [z, 2, 2],
      [z, 2, z]
    ])
    tets.push([
      //
      // [z, 3, z, z],
      // [z, 3, 3, z],
      // [z, z, 3, z],
      // [z, z, z, z]
      [3, z, z],
      [3, 3, z],
      [z, 3, z]
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
      [z, z, z],
      [5, 5, 5],
      [z, 5, z]
    ])
    tets.push([
      //
      // [z, z, z, z],
      // [z, 6, 6, z],
      // [z, z, 6, z],
      // [z, z, 6, z]
      [z, 6, z],
      [z, 6, z],
      [z, 6, 6]
    ])
    tets.push([
      //
      //[z, z, z, z],
      // [z, 7, 7, z],
      // [z, 7, z, z],
      // [z, 7, z, z]
      [z, 7, z],
      [z, 7, z],
      [7, 7, z]
    ])
    nm = tets[0].length

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
      dropped: false,
      theme: 1
    }
  },
  created() {
    this.newGame()
    window.addEventListener('keydown', this.keydown)
    window.addEventListener('keyup', this.keyup)
    window.addEventListener('keypress', this.keypress)
  },
  destroyed() {
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

      this.gameActive = true
      this.posDecrement = setInterval(_ => {
        indexBorder++
        this.tryY--
        this.render()
      }, 300)
      this.loop = setInterval(_ => {
        // this.tryY--;
        // this.render();
      }, 10)
    },
    keydown(e) {
      // e.preventDefault()
      //   this.dropped = false;

      //   console.log("keydown", arguments);
      if ((e.code == 'Space' || e.code == 'Enter') && !this.gameActive) {
        return this.newGame()
      }
      if (!this.gameActive) return
      if (e.code == 'KeyP') {
        if (this.loop == null) {
          return this.newGame()
        }
        clearInterval(this.loop)
        clearInterval(this.posDecrement)
        this.loop = null
      } else if (e.code == 'Space') {
        while (this.check(this.curTet, this.currX, this.tryY - 1, this.rotate)) this.tryY--
        this.dropped = true
        setTimeout(_ => {
          this.dropped = false
        }, 100)
        // this.tryY++;
        // return;
      } else if (e.code == 'ArrowUp' && (!iskeydown || ticks + 100 < performance.now())) {
        ticks = performance.now()
        this.tryRotate++
      } else if (e.code == 'ArrowDown') this.tryY--
      else if (e.code == 'ArrowLeft') this.tryX--
      //this.tryX = Math.max(-nm, this.tryX - 1)
      else if (e.code == 'ArrowRight') this.tryX++
      //this.tryX = Math.min(w + nm, this.tryX + 1)
      this.render()
      iskeydown = true
    },
    keyup(e) {
      // e.preventDefault()
      console.log('keyup', arguments)
      // ticks = performance.now()
      iskeydown = false
    },
    keypress(e) {
      // e.preventDefault()
      console.log('keypress', arguments)
    },
    getSize(T) {
      return this.tets[T].length
    },
    getValue(x, y) {
      const R = this.rotate
      const T = this.curTet
      return this.getPiece(T, x - this.currX - 1, y - this.currY - 1, R) || this.cells[y - 1][x - 1]
    },
    render() {
      const check = this.check(this.curTet, this.tryX, this.tryY, this.tryRotate)
      //   console.log({ check });

      if (check) {
        this.currX = this.tryX
        this.currY = this.tryY
        this.rotate = this.tryRotate
      } else {
        if (this.tryY < this.currY && !this.dropped) {
          const put = this.put(this.curTet, this.currX, this.currY, this.rotate)
          //   console.log({ put });

          if (!put) {
            clearInterval(this.loop)
            clearInterval(this.posDecrement)
            this.gameActive = false
          } else {
            const lines = this.fill()
            // console.log({ lines })

            if (lines.length) {
              setTimeout(_ => {
                let current = lines.shift()
                for (let y = current + 1; y < h; y++) {
                  if (lines.length && y == lines[0]) {
                    lines.shift()
                    continue
                  }
                  for (let x = 1; x < w - 1; ++x) {
                    this.cells[current][x] = this.cells[y][x]
                  }
                  current++
                }
                for (let y = current; y < h; y++) {
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
      console.log({ curTet: this.curTet, Y: this.currY, X: this.currX, check })
    },
    check(T, X, Y, R) {
      const N = this.getSize(T)
      for (let y = 0; y < N; y++) {
        if (!this.cells[Y + y]) continue //return true;
        // const row = this.tets[T][y];
        for (let x = 0; x < N; x++) {
          //   const cell = row[x];
          const cell = this.getPiece(T, x, y, R)
          // if (!cell || this.cells[Y + y][X + x] == undefined) continue
          if (cell > 0 && this.cells[Y + y][X + x] > 0) {
            return false
          }
        }
      }
      return true
    },
    put(T, X, Y, R) {
      const N = this.getSize(T)
      let success = false
      for (let y = 0; y < N; y++) {
        // if (!this.cells[Y + y]) continue
        if (Y + y > h - 1) return false
        // const row = this.tets[T][y];
        for (let x = 0; x < N; x++) {
          //   const cell = row[x];
          const cell = this.getPiece(T, x, y, R)

          if (cell > 0 && this.cells[Y + y]) {
            // if (this.cells[Y + y][X + x] == undefined) return false;
            this.cells[Y + y][X + x] = cell
            success = true
          }
        }
      }
      return success
    },
    fill() {
      let lines = []
      for (let y = 0; y < nm; ++y) {
        if (this.currY + y <= 0 || this.currY + y > h - 1) continue
        let line = true
        for (let x = 1; x < w - 1 && line; ++x) {
          line = this.cells[this.currY + y][x] != 0
        }
        if (line) {
          lines.push(this.currY + y)
          for (let x = 1; x < w - 1 && line; ++x) {
            this.cells[this.currY + y][x] = 8
          }
        }
      }
      return lines
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="stylus">
.main {
  text-align: center
  display: flex
  margin: auto
  flex-direction: row
  justify-content: center

  .stakan {
    flex: 1 1
    display: flex
    margin: auto
    flex-direction: column-reverse
    justify-content: center

    .row {
      display: flex
      flex-direction: row
      justify-content: center
      align-items: baseline

      & > div {
        // height: 25px;
        // width: 25px;
        flex: 0 0 25px
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
    flex: 0.3

    // align-items: flex-end
    .row {
      .N0 {
        background: transparent
      }
    }
  }
}
</style>
