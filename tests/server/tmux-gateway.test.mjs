import assert from 'node:assert/strict';
import { runCase } from '../helpers.mjs';
import { parsePaneLines } from '../../src/server/services/tmux-gateway.js';

await runCase('parsePaneLines normalizes capture-pane output', () => {
  assert.deepEqual(parsePaneLines('one\ntwo\n'), ['one', 'two']);
});
