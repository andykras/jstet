import Piece from '@/utils/piece.js'

export function straight(rotates, z = 0) {
  return new Piece(
    [
      // I (also a "straight polyomino"): four blocks in a straight line.
      [z, 1],
      [z, 1],
      [z, 1],
      [z, 1]
    ],
    rotates
  )
}

export function rowL(rotates, z = 0) {
  return new Piece(
    [
      // L: a row of three blocks with one added below the left side.
      [z, 6],
      [z, 6],
      [z, 6, 6]
    ],
    rotates
  )
}

export function rowJ(rotates, z = 0) {
  return new Piece(
    [
      // J: a row of three blocks with one added below the right side.
      [z, 7],
      [z, 7],
      [7, 7]
    ],
    rotates
  )
}

export function square(rotates) {
  return new Piece(
    [
      // O (also a "square polyomino"): four blocks in a 2×2 square.
      [4, 4],
      [4, 4]
    ],
    rotates
  )
}

export function domZ(rotates, z = 0) {
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
