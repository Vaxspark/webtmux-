import assert from 'node:assert/strict';
import { runCase } from '../helpers.mjs';
import { filterCommands, shouldOpenCommandPalette } from '../../public/app.js';

await runCase('filterCommands returns matching slash commands for codex', () => {
  const commands = filterCommands('codex-cli', '/pl');
  assert.equal(commands.some((command) => command.command === '/plan'), true);
});

await runCase('shouldOpenCommandPalette only opens on slash-prefixed input', () => {
  assert.equal(shouldOpenCommandPalette('/'), true);
  assert.equal(shouldOpenCommandPalette('hello'), false);
});
