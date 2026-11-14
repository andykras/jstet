import test from 'node:test'
import assert from 'node:assert/strict'

// The engine loop is rAF-driven and reads performance.now(): run both under a
// controllable fake clock so gravity, clears and the bonus dwell are exact.
let now = 0
const frames = []
Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true })
globalThis.requestAnimationFrame = fn => frames.push(fn) && frames.length
globalThis.cancelAnimationFrame = id => { delete frames[id - 1] }

const { default: store } = await import('../../src/store.js')
const { gameBus } = await import('../../src/utils/gameBus.js')
const { setup, game } = await import('../../src/utils/game.js')
const { resolveRunOptions } = await import('../../src/game/options.js')
const { createGameBoard, createGamePieces } = await import('../../src/game/modes.js')

const pump = async () => {
  const pending = frames.splice(0)
  for (const frame of pending) frame(now)
  await new Promise(resolve => setTimeout(resolve, 0))
}
const advance = async ms => {
  now += ms
  await pump()
}

const itemOf = () => {
  const item = store.state.item
  return { X: item.X, Y: item.Y, R: item.R }
}
const settledCount = () => store.state.cells.flat().filter(value => value > 0).length
// Deterministic matches: reshape the active piece into one color-6 triple row,
// so every hard drop forms a horizontal match by itself.
const forceTriplePiece = () => {
  const item = store.state.item
  const piece = store.state.pieces[item.T]
  if (!piece || piece.size !== 3) return false
  piece[0] = [0, 0, 0]
  piece[1] = [6, 6, 6]
  piece[2] = [0, 0, 0]
  return true
}
const clearPlayableRows = () => {
  const cells = store.state.cells
  for (let y = 1; y < cells.height; y++) {
    for (let x = 1; x < cells.width - 1; x++) cells[y][x] = 0
  }
}

test('a second rewarded match freezes only gravity for the bonus dwell while controls stay live', async () => {
  store.commit('setCells', createGameBoard('tetcolor'))
  store.commit('setPieces', createGamePieces('tetcolor'))
  const dispose = setup(gameBus)
  // App mirrors engine status into the store; the raw harness needs the same
  // bridge for store.state.status to mean anything.
  gameBus.on('status', status => store.commit('setStatus', status))
  gameBus.on('update', item => store.commit('setPieceState', item))

  const bonusAwards = []
  const onBonus = value => bonusAwards.push({ value, at: now })
  gameBus.on('bonus', onBonus)

  gameBus.emit('start', resolveRunOptions({ tetcolor: true, singleBlock: true }))
  assert.equal(store.state.status, 'running')

  const rewardedDrop = async () => {
    assert.ok(forceTriplePiece(), 'the active piece can host a triple row')
    gameBus.emit('drop', true)
    // Sequential clearing drains one matched cell per clear tick; the piece
    // spawned at the lock falls only after the whole cascade has finished.
    for (let i = 0; i < 14; i++) await advance(60)
  }

  // Round 1: the streak starts; a first match must not pay a combo.
  await rewardedDrop()
  assert.ok(!bonusAwards.some(award => award.value > 0), 'first match awards no combo')
  clearPlayableRows()

  // Round 2: the streak pays and arms the gravity dwell.
  game.drop = 6 // fast automatic gravity makes the dwell observable
  await rewardedDrop()
  const paid = bonusAwards.filter(award => award.value > 0)
  assert.equal(paid.length, 1, 'second consecutive match pays the combo')
  assert.ok(paid[0].value > 0)

  // Trace automatic gravity through the dwell: with drop=6 the natural cadence
  // is ~3.3ms per step, so a long Y plateau is the frozen gravity window.
  const trace = []
  let downResult = null
  let downFired = false
  let lastMoveAt = now
  for (let i = 0; i < 140; i++) {
    if (!downFired && bonusAwards.length && now - lastMoveAt >= 120) {
      const before = itemOf().Y
      gameBus.emit('down:start')
      await advance(70)
      gameBus.emit('down:stop')
      downResult = { before, after: itemOf().Y, moved: itemOf().Y < before }
      downFired = true
    }
    const y = itemOf().Y
    if (i === 0 || trace[trace.length - 1].y !== y) lastMoveAt = now
    trace.push({ at: now, y, settled: settledCount() })
    await advance(8)
  }

  const changes = []
  for (let i = 1; i < trace.length; i++) {
    if (trace[i].y !== trace[i - 1].y) changes.push(i)
  }
  assert.ok(changes.length >= 4, 'automatic gravity keeps stepping around the dwell')
  let longestGap = 0
  for (let i = 1; i < changes.length; i++) {
    longestGap = Math.max(longestGap, trace[changes[i]].at - trace[changes[i - 1]].at)
  }
  assert.ok(longestGap >= 250, `gravity froze for the reward dwell, longest gap ${longestGap}ms`)
  assert.ok(longestGap <= 450, `the dwell is bounded by BONUS_HOLD_MS, got ${longestGap}ms`)
  assert.deepEqual(downResult && downResult.moved, true, 'manual Down works during the reward dwell')

  gameBus.off('bonus', onBonus)
  dispose()
})
