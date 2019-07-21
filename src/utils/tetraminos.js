import Piece from '@/utils/piece.js'

export function createTetColor3(rotates, z) {
  return new Piece(
    [
      //
      [z],
      [1, 1, 1],
      [z]
      // [z, 1],
      // [z, 1],
      // [z, 1]
    ],
    rotates
  )
}

export function createTetColorZ(rotates, z) {
  return new Piece(
    [
      //
      [z, 1],
      [1, 1],
      [z]
    ],
    rotates
  )
}

export function createTetColor2(rotates, z) {
  return new Piece(
    [
      //
      [z],
      [1, 1, z],
      [z]
      // [z, 1],
      // [z, 1],
      // [z]
    ],
    rotates
  )
}

export function createTetColor1(rotates, z) {
  return new Piece(
    [
      //
      // [1]
      [z],
      [z, 1, z],
      [z]
    ],
    rotates
  )
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
