// can't use any class or __proto__ techniques here,
// cause Vue will overwrite it with its own proto on observer creation

function Piece(values, rotate) {
  const self = Array.from(values)

  Object.defineProperty(self, 'R', { get: _ => rotate, configurable: false })

  Object.defineProperty(self, 'size', {
    get() {
      // return this.reduce((acc, cur) => Math.max(acc, cur.length), 0)
      return this.length
    },
    configurable: false
  })

  self.get = function(x, y, R) {
    const S = this.size
    switch (R % this.R) {
      case 1:
        ;[x, y] = [S - y - 1, x]
        break
      case 2:
        ;[x, y] = [S - x - 1, S - y - 1]
        break
      case 3:
        ;[x, y] = [y, S - x - 1]
        break
    }
    return this[y] && this[y][x]
  }

  return self
}

export default Piece
