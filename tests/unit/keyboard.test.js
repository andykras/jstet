import test from 'node:test'
import assert from 'node:assert/strict'
import { shouldIgnoreGameInput } from '../../src/utils/keyboard.js'

test('keyboard input is ignored for editable controls and dialogs', () => {
  assert.equal(shouldIgnoreGameInput({ tagName: 'input' }), true)
  assert.equal(shouldIgnoreGameInput({ tagName: 'INPUT', type: 'text' }), true)
  assert.equal(shouldIgnoreGameInput({ tagName: 'INPUT', type: 'button' }), false)
  assert.equal(shouldIgnoreGameInput({ tagName: 'INPUT', type: 'checkbox' }), false)
  assert.equal(shouldIgnoreGameInput({ tagName: 'TEXTAREA' }), true)
  assert.equal(shouldIgnoreGameInput({ tagName: 'select' }), true)
  assert.equal(shouldIgnoreGameInput({ tagName: 'DIV', isContentEditable: true }), true)
  assert.equal(shouldIgnoreGameInput({ tagName: 'BUTTON', closest: () => ({}) }), true)
  assert.equal(shouldIgnoreGameInput({ tagName: 'BUTTON', closest: () => null }), false)
  assert.equal(shouldIgnoreGameInput(null), false)
})
