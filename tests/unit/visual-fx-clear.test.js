import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import Stakan from '../../src/utils/stakan.js'
import { captureClearCandidates, markedClearFxCells, mergeClearFxCells, clearStepFxCells } from '../../src/utils/visualFx.js'

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('TetColor: exact horizontal, vertical and diagonal matches retain original colors', () => {
  const board = new Stakan(19, 9, 4)
  const matches = [
    [2, 5, 1], [3, 5, 1], [4, 5, 1],
    [6, 7, 2], [6, 8, 2], [6, 9, 2],
    [2, 10, 3], [3, 11, 3], [4, 12, 3]
  ]
  for (const [x, y, color] of matches) board[y][x] = color
  board[7][3] = 4 // An unrelated occupied cell must not join the match.
  const candidates = captureClearCandidates(board)
  for (const [x, y] of matches) board[y][x] = -2
  const cells = markedClearFxCells(candidates, board)
  assert.equal(cells.length, matches.length)
  assert.deepEqual(cells.find(cell => cell.column === 1 && cell.row === 13), { column: 1, row: 13, color: 1 })
  assert.deepEqual(cells.find(cell => cell.column === 5 && cell.row === 10), { column: 5, row: 10, color: 2 })
  assert.deepEqual(cells.find(cell => cell.column === 3 && cell.row === 6), { column: 3, row: 6, color: 3 })
  assert.ok(!cells.some(cell => cell.column === 2 && cell.row === 11))
  assert.ok(Object.isFrozen(cells))
  assert.ok(cells.every(Object.isFrozen))
})

test('TetColor: previously marked cells do not reappear as new clear events', () => {
  const board = new Stakan(19, 9, 4)
  board[5][2] = -2
  board[5][3] = 2
  board[5][4] = 3
  const candidates = captureClearCandidates(board)
  board[5][3] = -2
  const cells = markedClearFxCells(candidates, board)
  assert.deepEqual(cells, [{ column: 2, row: 13, color: 2 }])
  board[5][4] = 0
  assert.deepEqual(markedClearFxCells(candidates, board), [{ column: 2, row: 13, color: 2 }])
})

test('TetColor: single-block clear produces only its own particle burst', () => {
  const board = new Stakan(19, 9, 4)
  for (let x = 2; x <= 4; x++) board[5][x] = x
  const before = captureClearCandidates(board)
  for (let x = 2; x <= 4; x++) board[5][x] = -2
  const all = markedClearFxCells(before, board)
  assert.deepEqual(clearStepFxCells(all, 'tetcolor', 3, 5, board), [{ column: 2, row: 13, color: 3 }])
  assert.deepEqual(clearStepFxCells(all, 'tetcolor', 2, 5, board), [{ column: 1, row: 13, color: 2 }])
  assert.deepEqual(clearStepFxCells(all, 'tetcolor', 1, 5, board), [])
})

test('Classic: line-clear step includes all 10 colored cells in exactly that row', () => {
  const board = new Stakan(21, 12, 4)
  for (let x = 1; x < 11; x++) {
    board[9][x] = x % 7 + 1
    board[10][x] = 6
  }
  const candidates = captureClearCandidates(board)
  for (let x = 1; x < 11; x++) {
    board[9][x] = -2
    board[10][x] = -2
  }
  const cells = markedClearFxCells(candidates, board)
  assert.equal(cells.length, 20)
  const first = clearStepFxCells(cells, 'classic', 1, 10, board)
  const second = clearStepFxCells(cells, 'classic', 1, 9, board)
  assert.equal(first.length, 10)
  assert.equal(second.length, 10)
  assert.ok(first.every(cell => cell.row === 10))
  assert.ok(second.every(cell => cell.row === 11))
  assert.deepEqual([...first, ...second].map(cell => cell.color).sort(), cells.map(cell => cell.color).sort())
})

test('a top visible row match is captured even though the detector cannot mark it', () => {
  // getThreeBlock detects matches whose third cell sits on the top visible row
  // (y = height - 1) but its marking loop stops one row earlier, while the
  // removal compaction does delete that cell. Group membership is the source
  // of truth, not the -2 marks.
  const board = new Stakan(19, 9, 4)
  const top = board.height - 1
  board[top - 2][3] = 5
  board[top - 1][3] = 5
  board[top][3] = 5
  const candidates = captureClearCandidates(board)
  // Simulate the engine: all three cells are queued for removal, only the
  // lower two are marked -2.
  const group = new Set([3 * board.height + top - 2, 3 * board.height + top - 1, 3 * board.height + top])
  board[top - 2][3] = -2
  board[top - 1][3] = -2
  const cells = markedClearFxCells(candidates, board, (x, y) => group.has(x * board.height + y))
  assert.equal(cells.length, 3)
  assert.deepEqual(cells.find(cell => cell.row === 0), { column: 2, row: 0, color: 5 })
  // Step selection reaches the top cell too.
  assert.deepEqual(clearStepFxCells(cells, 'tetcolor', 3, top, board), [{ column: 2, row: 0, color: 5 }])
})

test('a batch-mode lock extends the pending snapshot instead of replacing it', () => {
  const board = new Stakan(19, 9, 4)
  const first = Object.freeze([{ column: 1, row: 17, color: 2 }, { column: 2, row: 17, color: 2 }])
  const fresh = Object.freeze([{ column: 4, row: 15, color: 3 }, { column: 1, row: 17, color: 2 }])
  const merged = mergeClearFxCells(first, fresh)
  assert.equal(merged.length, 3)
  assert.ok(merged.includes(first[0]) && merged.includes(first[1]) && merged.includes(fresh[0]))
  assert.ok(Object.isFrozen(merged))
  // Empty inputs keep the pending snapshot and never fabricate one.
  assert.equal(mergeClearFxCells(first, []), first)
  assert.equal(mergeClearFxCells(null, fresh), fresh)
  assert.deepEqual(mergeClearFxCells(null, []), [])
  // Overlapping duplicates are not double-counted.
  assert.equal(mergeClearFxCells(merged, fresh).length, 3)
})

test('clear snapshots handle boundaries and invalid/no-match input without phantom FX', () => {  const board = new Stakan(19, 9, 4)
  assert.deepEqual(captureClearCandidates(null), [])
  assert.deepEqual(markedClearFxCells(null, board), [])
  assert.deepEqual(clearStepFxCells([], 'tetcolor', 3, 5, board), [])
  assert.deepEqual(clearStepFxCells([{ row: 0, column: 0, color: 1 }], 'tetcolor', 0, 5, board), [])
  assert.deepEqual(markedClearFxCells(captureClearCandidates(board), board), [])
  board[1][1] = 1
  const prior = captureClearCandidates(board)
  board[1][1] = -2
  assert.deepEqual(markedClearFxCells(prior, board), [{ row: 17, column: 0, color: 1 }])
  assert.deepEqual(clearStepFxCells(markedClearFxCells(prior, board), 'tetcolor', 1, 1, board),
    [{ row: 17, column: 0, color: 1 }])
})

test('the existing clearing algorithms are wrapped, never replaced or delayed', () => {
  const engine = read('src/utils/game.js')
  assert.match(engine, /const detectClears = \(mode, detect\) =>/)
  assert.match(engine, /const candidates = track \? captureClearCandidates\(\$cells\) : null/)
  assert.match(engine, /const result = detect\(\)/)
  assert.match(engine, /const isDetected = result instanceof Set/)
  assert.match(engine, /clearFxCells = mergeClearFxCells\(clearFxCells, fresh\)/)
  assert.match(engine, /detectClears\('tetcolor', getThreeBlock\)/)
  assert.equal(engine.split("detectClears('tetcolor', getThreeBlock)").length - 1, 2, 'lock and cascade both emit clear events')
  assert.match(engine, /detectClears\('classic', \(\) => getSolidLines\(/)
  assert.match(engine, /emitClearStep\('tetcolor', x, xy - x \* \$cells\.height\)/)
  assert.match(engine, /emitClearStep\('classic', 1, \$lines\[\$lines\.length - 1\]\)/)
  assert.match(engine, /game\.singleBlock \? removeThreeBlockSorted\(\) \|\| 1 : removeThreeBlock\(\) \|\| \$three\.size/)
  assert.match(engine, /game\.singleBlock \? clearOneLine\(\) : clearAllLines\(\)/)
  assert.match(engine, /if \(!clearFxCells\.length \|\| !hasFxConsumer\('fx:clear-step'\)\) return/)
  assert.match(engine, /clearFxCells = EMPTY_FX_CELLS/)
})

test('clear FX overlay uses bounded cell animations with no new sound or gameplay work', () => {
  const overlay = read('src/components/VisualFxOverlay.vue')
  const css = read('src/styles/tetcolor-clear-fx.styl')
  const app = read('src/App.vue')
  assert.match(overlay, /\['fx:clear-start', payload => this\.onClearStart\(payload\)\]/)
  assert.match(overlay, /\['fx:clear-step', payload => this\.onClearStep\(payload\)\]/)
  assert.match(overlay, /this\.add\('charge', payload\.cells, \{ mode: payload\.mode \}\)/)
  assert.match(overlay, /order: values\.mode === 'classic' \? cell\.column : Math\.min\(order\+\+, 9\)/)
  assert.match(overlay, /this\.add\('clear', payload\.cells\)/)
  assert.match(overlay, /const MAX_EFFECTS = 24/)
  assert.match(overlay, /this\.reducedMotion \|\| this\.osReducedMotion/)
  assert.match(css, /\.jstet-app\.fx-enabled \.tetcolor-fx-cell--charge/)
  assert.match(css, /\.jstet-app\.fx-enabled \.tetcolor-fx-cell--clear/)
  assert.match(css, /@keyframes fx-clear-charge/)
  assert.match(css, /@keyframes fx-clear-release/)
  assert.match(css, /@keyframes fx-clear-particle-left/)
  assert.match(css, /@keyframes fx-clear-particle-right/)
  assert.match(css, /pointer-events none|background radial-gradient/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(app, /@import '\.\/styles\/tetcolor-clear-fx\.styl'/)
  assert.doesNotMatch(overlay, /sound:clear|sound:drop|setScore|setCells|game\.loop/)
})
