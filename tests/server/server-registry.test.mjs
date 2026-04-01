import assert from 'node:assert/strict';
import { runCase } from '../helpers.mjs';
import { parseServerRegistry } from '../../src/server/services/server-registry.js';

await runCase('parseServerRegistry applies ubuntu and windows defaults', () => {
  const servers = parseServerRegistry(JSON.stringify([
    {
      id: 'ubuntu-a',
      name: 'Ubuntu A',
      host: '127.0.0.1',
      port: 2201,
      username: 'root',
      authStrategy: 'agent',
      platform: 'ubuntu'
    },
    {
      id: 'windows-b',
      name: 'Windows B',
      host: '127.0.0.1',
      port: 2202,
      username: 'Administrator',
      authStrategy: 'password',
      platform: 'windows'
    }
  ]));

  assert.equal(servers[0].tmuxCommand, 'tmux');
  assert.equal(servers[1].tmuxCommand, 'wsl.exe -e tmux');
  assert.equal(servers[1].shellType, 'powershell');
});
