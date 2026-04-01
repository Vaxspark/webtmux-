import assert from 'node:assert/strict';
import { runCase } from '../helpers.mjs';
import { buildRemoteCommand } from '../../src/server/services/remote-platform.js';

await runCase('buildRemoteCommand keeps ubuntu commands direct', () => {
  assert.equal(
    buildRemoteCommand({ platform: 'ubuntu', shellType: 'posix', tmuxCommand: 'tmux' }, ['list-sessions', '-F', '#S']),
    'tmux list-sessions -F #S'
  );
});

await runCase('buildRemoteCommand wraps windows commands in powershell', () => {
  assert.match(
    buildRemoteCommand({ platform: 'windows', shellType: 'powershell', tmuxCommand: 'wsl.exe -e tmux' }, ['list-sessions', '-F', '#S']),
    /powershell -NoProfile -Command/
  );
});

await runCase('buildRemoteCommand quotes literal arguments with spaces', () => {
  assert.equal(
    buildRemoteCommand({ platform: 'ubuntu', shellType: 'posix', tmuxCommand: 'tmux' }, ['send-keys', '-l', 'hello world']),
    "tmux send-keys -l 'hello world'"
  );
});
