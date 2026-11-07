// Combo rewards belong to consecutive pieces that each trigger a TetColor match.
// Cascade rewards belong to additional clears caused by gravity after a match.
export const comboBonusForStreak = (streak, scorePart) =>
  Math.max(0, streak - 1) * scorePart * 15

export const cascadeBonus = (previous, bonusSize) =>
  Math.round((bonusSize + 0.5 * previous) / 100) * 100
