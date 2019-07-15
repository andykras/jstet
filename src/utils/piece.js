// can't use any class or __proto__ techniques here,
// cause Vue will overwrite it with its own proto on observer creation

function Piece(values, rotate) {
  const self = Array.from(values)

  Object.defineProperty(self, 'R', { get: _ => rotate })

  Object.defineProperty(self, 'N', {
    get() {
      // return this.reduce((acc, cur) => Math.max(acc, cur.length), 0)
      return this.length
    }
  })

  self.get = function(x, y, R) {
    const N = this.N
    switch (R % this.R) {
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
    return this[y] && this[y][x]
  }

  return self
}

export default Piece

// class Piece extends Array {
//   constructor(values, rotate) {
//     super(values)
//     this.rotate = rotate
//   }
//   get R() {
//     return this.rotate
//   }
//   get N() {
//     // return this.reduce((acc, cur) => Math.max(acc, cur.length), 0)
//     return this.length
//   }
//   get(x, y, R) {
//     const N = this.N
//     switch (R % this.R) {
//       case 1:
//         ;[x, y] = [N - y - 1, x]
//         break
//       case 2:
//         ;[x, y] = [N - x - 1, N - y - 1]
//         break
//       case 3:
//         ;[x, y] = [y, N - x - 1]
//         break
//     }
//     return this[y] && this[y][x]
//   }
// }

// Piece.prototype = new Array()
// Object.defineProperty(Piece.prototype, 'R', {
//   get: function() {
//     return this.__rotate
//   }
// })
// Object.defineProperty(Piece.prototype, 'N', {
//   get: function() {
//     // return this.reduce((acc, cur) => Math.max(acc, cur.length), 0)
//     return this.length
//   }
// })
