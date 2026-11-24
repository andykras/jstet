<template>
  <div class="legacy-screen" :class="{ 'legacy-screen--colors': theme === 4 }">
    <section class="legacy-options"
             aria-label="Legacy engine options">
      <label class="legacy-options__field">
        <span>Skin</span>
        <select v-model.number="theme"
                aria-label="Legacy visual skin"
                @change="focusGameField">
          <option :value="1">1 · Symbols</option>
          <option :value="2">2 · ASCII</option>
          <option :value="3">3 · Text</option>
          <option :value="4">4 · Colors</option>
        </select>
      </label>
      <label class="legacy-options__field">
        <input type="checkbox"
               v-model="linesAnimated"
               @change="focusGameField">
        Animate line clears (A)
      </label>
      <label class="legacy-options__field">
        <input type="checkbox"
               v-model="dropSoft"
               @change="focusGameField">
        Soft drop (S)
      </label>
      <button type="button"
              class="arcade-button"
              @click="restartFromControls">New Game</button>
    </section>
    <div class="main">
    <div class="info">
      <div>Lines: {{totalLines}}</div>
      <div class="stakan next"
           role="img"
           aria-label="Next piece">
        <div v-for="(row, y) in nextPreview"
             :key="y"
             class="row">
          <div v-for="(cell, x) in row"
               :key="x"
               :class="'N' + cell.value">
            <span v-if="cell.value"
                  v-html="getSymbol(cell.sourceX, cell.sourceY, nextTet, 0)"></span>
          </div>
        </div>
      </div>
    </div>
    <div ref="gameField"
         class="stakan stakan--board"
         role="group"
         aria-label="Legacy game field: use arrow keys to move, Space to drop"
         tabindex="0">
      <div class="dupa"
           :class="{end:!gameActive}">ДУПА</div>
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
  </div>
</template>

<script>
import { shouldIgnoreGameInput } from '@/utils/keyboard.js'

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
  name: 'LegacyStakan',
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
      linesAnimated: true,
      dropFrame: null,
      clearFrame: null,
      clearDelay: null,
      disposed: false
    }
  },
  computed: {
    nextPreview() {
      // Some legacy pieces have ragged source rows. Crop to occupied cells,
      // then center the actual 0-degree shape in a transparent 4x4 preview.
      const blocks = []
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          const value = this.getPiece(this.nextTet, x, y, 0)
          if (value > 0) blocks.push({ x, y })
        }
      }
      const left = blocks.length ? Math.min(...blocks.map(block => block.x)) : 0
      const right = blocks.length ? Math.max(...blocks.map(block => block.x)) : 0
      const bottom = blocks.length ? Math.min(...blocks.map(block => block.y)) : 0
      const top = blocks.length ? Math.max(...blocks.map(block => block.y)) : 0
      const shiftX = Math.floor((4 - (right - left + 1)) / 2) - left
      const shiftY = Math.floor((4 - (top - bottom + 1)) / 2) - bottom

      return Array.from({ length: 4 }, (_, y) =>
        Array.from({ length: 4 }, (_, x) => {
          const sourceX = x - shiftX
          const sourceY = y - shiftY
          return { value: this.getPiece(this.nextTet, sourceX, sourceY, 0) || 0, sourceX, sourceY }
        })
      )
    }
  },
  created() {
    this.newGame()
    window.addEventListener('keydown', this.keydown)
    window.addEventListener('keyup', this.keyup)
    window.addEventListener('keypress', this.keypress)
  },
  unmounted() {
    this.disposed = true
    this.cancelEffects()
    clearInterval(this.loop)
    clearInterval(this.posDecrement)
    window.removeEventListener('keydown', this.keydown)
    window.removeEventListener('keyup', this.keyup)
    window.removeEventListener('keypress', this.keypress)
  },
  mounted() {
    this.curTet = Math.floor(Math.random() * this.tets.length)
    this.nextTet = Math.floor(Math.random() * this.tets.length)
    // Entering Legacy via the mode button leaves that button focused.
    // Restore game keyboard controls without requiring a click on the well.
    this.focusGameField()
  },
  methods: {
    focusGameField() {
      // Wait until the setting's native change/click event has completed.
      // Keep keyboard focus out of Legacy's select and checkboxes while playing.
      this.$nextTick(() => {
        if (!this.disposed) this.$refs.gameField?.focus({ preventScroll: true })
      })
    },
    restartFromControls() {
      this.newGame()
      this.focusGameField()
    },
    isLabControl(target) {
      return Boolean(target && target.closest && target.closest('.legacy-options, button'))
    },
    cancelEffects() {
      cancelAnimationFrame(this.dropFrame)
      cancelAnimationFrame(this.clearFrame)
      clearTimeout(this.clearDelay)
      this.dropFrame = this.clearFrame = this.clearDelay = null
      this.dropping = false
      this.linesCutting = false
    },
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
      clearInterval(this.loop)
      clearInterval(this.posDecrement)
      this.cancelEffects()
      this.cells = emptyCells()

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
      if (shouldIgnoreGameInput(e.target) || this.isLabControl(e.target) || this.linesCutting) return
      if (!['KeyP', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) return
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
            if (this.disposed) return
            const curr = performance.now()
            if (curr - start > 10) {
              start = curr
              const check = this.check(this.curTet, this.currX, this.tryY - 1, this.rotate)
              this.tryY--
              this.render()
              if (!check) {
                this.dropping = false
                this.dropFrame = null
                return
              }
            }
            this.dropFrame = requestAnimationFrame(step)
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
      if (shouldIgnoreGameInput(e.target) || this.isLabControl(e.target)) return
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyS'].includes(e.code) && !/^[0-9]$/.test(e.key)) return
      e.preventDefault()
      // ticks = performance.now()
      iskeydown = false
      let p = parseInt(e.key)
      if (p >= 1 && p <= 4) {
        this.theme = p
      }
      if (e.key == 'a') this.linesAnimated = !this.linesAnimated
      if (e.key == 's') this.dropSoft = !this.dropSoft
    },
    keypress(e) {
      if (!shouldIgnoreGameInput(e.target) && !this.isLabControl(e.target) && e.code === 'Space') {
        e.preventDefault()
      }
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
                if (this.disposed) return
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
                    this.clearFrame = null
                    return
                  }
                }
                this.clearFrame = requestAnimationFrame(step)
              }
              step()
            }

            if (lines.length && !this.linesAnimated) {
              this.clearDelay = setTimeout(_ => {
                this.clearDelay = null
                if (this.disposed) return
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
.legacy-screen
  // A 20-row well must fit below the Arcade header and Legacy controls.
  // Keep the cell size responsive without ever changing engine dimensions.
  --legacy-cell-size unquote('clamp(12px, min(25px, calc((100dvh - 265px) / 20), calc((100vw - 195px) / 12)), 25px)')
  --legacy-preview-cell-size unquote('min(22px, var(--legacy-cell-size))')
  width 100%
  max-width 100%

.main
  display flex
  align-items flex-start
  justify-content center
  gap clamp(12px, 2vw, 24px)
  width 100%
  max-width 100%
  margin 0 auto

  .info
    display flex
    flex 0 0 110px
    flex-direction column
    align-items center
    gap 12px
    min-width 0
    color #f5ecff
    font-size 15px
    text-align center

  .stakan
    position relative
    display flex
    flex 0 0 auto
    flex-direction column-reverse
    width max-content
    max-width 100%

    .row
      display flex
      flex 0 0 auto
      justify-content center
      height var(--legacy-cell-size)

      > div
        display flex
        flex 0 0 var(--legacy-cell-size)
        align-items center
        justify-content center
        width var(--legacy-cell-size)
        height var(--legacy-cell-size)
        overflow hidden
        background-color #efe
        color #fff
        font-family 'Helvetica Neue', Helvetica, Arial, sans-serif
        font-size unquote('clamp(9px, calc(var(--legacy-cell-size) * .52), 14px)')
        font-weight 900
        line-height 1
        white-space nowrap

        &.N1
          background-color #8cff8c

        &.N2
          background-color #ed8cff

        &.N3
          background-color lightness(#ed8cff, 81%)

        &.N4
          background-color #ff6c6c

        &.N5
          background-color #caca0a

        &.N6
          background-color #4fb6ff

        &.N7
          background-color #4ff6ff

        &.N8
          background-color #aebece

        &.N9
          background-color #eee

  .next
    padding 7px
    border 1px solid rgba(211, 190, 250, .28)
    border-radius 12px
    background rgba(10, 13, 34, .35)

    .row
      height var(--legacy-preview-cell-size)

      > div
        flex-basis var(--legacy-preview-cell-size)
        width var(--legacy-preview-cell-size)
        height var(--legacy-preview-cell-size)

        &.N0
          background-color transparent

  .dupa
    // This overlay must not take up a phantom extra row in the 20-row well.
    position absolute
    z-index 1
    top 50%
    left 50%
    width max-content
    max-width 90%
    padding 10px 16px
    border 2px solid #333
    border-radius 8px
    background rgba(252, 255, 79, .92)
    color #a71136
    font-size 20px
    font-weight 900
    opacity 0
    pointer-events none
    transform translate(-50%, -50%)
    transition opacity .2s ease

    &.end
      opacity 1

// Only the historical Colors skin (4) displays different piece hues.
.legacy-screen:not(.legacy-screen--colors)
  .main .stakan .row > div
    background-color #f7f7f7
    color #191919

    &.N1,
    &.N2,
    &.N3,
    &.N4,
    &.N5,
    &.N6,
    &.N7
      background-color #b9b9b9
      color #202020

    &.N8
      background-color #bfbfbf
      color #161616

    &.N9
      background-color #e2e2e2
      color #444

  .main .next .row > div.N0
    background-color transparent

@media (max-width: 620px)
  .legacy-screen
    --legacy-cell-size unquote('clamp(12px, min(24px, calc((100dvh - 360px) / 20), calc((100vw - 32px) / 12)), 24px)')

  .main
    flex-direction column
    align-items center
    gap 12px

    .info
      flex 0 0 auto
      flex-direction row
      justify-content center
      gap 17px
      width 100%

    .next
      padding 5px

@media (prefers-reduced-motion: reduce)
  .main .dupa
    transition none
</style>
