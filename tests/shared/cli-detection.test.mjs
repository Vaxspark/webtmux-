import assert from 'node:assert/strict';
import { runCase } from '../helpers.mjs';
import { detectCliType, getCliCommands } from '../../src/shared/cli-detection.js';

await runCase('detectCliType prefers process name matches', () => {
  assert.equal(detectCliType({ processName: 'claude', paneTitle: '' }), 'claude-code');
});

await runCase('detectCliType falls back to pane title matches', () => {
  assert.equal(detectCliType({ processName: 'node', paneTitle: 'codex-main' }), 'codex-cli');
});

await runCase('getCliCommands returns slash commands for copilot', () => {
  const commands = getCliCommands('copilot-cli');
  assert.equal(commands[0]?.command.startsWith('/'), true);
});
