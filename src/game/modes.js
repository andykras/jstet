import Stakan from '../utils/stakan.js'
import {
  createStraight,
  createLShape,
  createJShape,
  createSquare,
  createZShape,
  createSShape,
  createTShape,
  createTetColor3,
  createTetColor2,
  createTetColor1,
  createTetColorZ
} from '../utils/tetraminos.js'

export const GAME_MODES = Object.freeze(['tetcolor', 'classic'])

export const isGameMode = mode => GAME_MODES.includes(mode)

export function createGamePieces(mode) {
  if (mode === 'tetcolor') {
    return [
      createTetColor3(4, 0),
      createTetColor2(4, 0),
      createTetColor1(4, 0),
      createTetColorZ(4, 0)
    ]
  }
  if (mode === 'classic') {
    return [
      createStraight(2),
      createLShape(4),
      createJShape(4),
      createSquare(1),
      createZShape(2),
      createSShape(2),
      createTShape(4)
    ]
  }
  throw new RangeError('Unknown game mode: ' + mode)
}

export function createGameBoard(mode) {
  if (mode === 'tetcolor') return new Stakan(19, 9, 4)
  if (mode === 'classic') return new Stakan(21, 12, 4)
  throw new RangeError('Unknown game mode: ' + mode)
}
