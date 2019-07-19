import Piece from '@/utils/piece.js'

const count = 7
export function createTetColor3(rotates, z) {
  const c1 = 1 + Math.floor(Math.random() * count)
  const c2 = 1 + Math.floor(Math.random() * count)
  const c3 = 1 + Math.floor(Math.random() * count)
  return new Piece(
    [
      //
      [z],
      [c1, c2, c3],
      [z]
    ],
    rotates
  )
}

export function createTetColor2(rotates, z) {
  const c1 = 1 + Math.floor(Math.random() * count)
  const c2 = 1 + Math.floor(Math.random() * count)
  return new Piece(
    [
      //
      [z],
      [c1, c2, z],
      [z]
    ],
    rotates
  )
}

export function createTetColor1(rotates, z) {
  const c1 = 1 + Math.floor(Math.random() * count)
  return new Piece([[c1]], rotates)
}

export function createStraight(rotates, z = 0) {
  return new Piece(
    [
      // I (also a "straight polyomino"): four blocks in a straight line.
      // [z, 1],
      // [z, 1],
      // [z, 1],
      // [z, 1]
      [z],
      [1, 1, 1, 1],
      [z],
      [z]
    ],
    rotates
  )
}

export function createLShape(rotates, z = 0) {
  return new Piece(
    [
      // L: a row of three blocks with one added below the left side.
      // [z, 7],
      // [z, 7],
      // [z, 7, 7]
      [z],
      [7, 7, 7],
      [7]
    ],
    rotates
  )
}

export function createJShape(rotates, z = 0) {
  return new Piece(
    [
      // J: a row of three blocks with one added below the right side.
      // [z, 7],
      // [z, 7],
      // [7, 7]
      [z],
      [6, 6, 6],
      [z, z, 6]
    ],
    rotates
  )
}

export function createSquare(rotates) {
  return new Piece(
    [
      // O (also a "square polyomino"): four blocks in a 2×2 square.
      [4, 4],
      [4, 4]
    ],
    rotates
  )
}

export function createZShape(rotates, z = 0) {
  return new Piece(
    [
      // Z: two stacked horizontal dominoes with the top one offset to the left.
      [2, 2],
      [z, 2, 2],
      [z]
    ],
    rotates
  )
}

export function createSShape(rotates, z = 0) {
  return new Piece(
    [
      // S: two stacked horizontal dominoes with the top one offset to the right.
      [z, 3, 3],
      [3, 3, z],
      [z]
    ],
    rotates
  )
}
