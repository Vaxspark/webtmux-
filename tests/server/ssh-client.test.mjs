import assert from 'node:assert/strict';
import { runCase } from '../helpers.mjs';
import { buildSshConnectOptions } from '../../src/server/services/ssh-client.js';

await runCase('buildSshConnectOptions uses password auth when configured', () => {
  const options = buildSshConnectOptions({
    host: '127.0.0.1',
    port: 22,
    username: 'root',
    authStrategy: 'password',
    password: 'secret'
  });

  assert.equal(options.password, 'secret');
  assert.equal('agent' in options, false);
  assert.equal('privateKey' in options, false);
});

await runCase('buildSshConnectOptions loads private key auth when configured', () => {
  const options = buildSshConnectOptions({
    host: '127.0.0.1',
    port: 22,
    username: 'root',
    authStrategy: 'private-key',
    privateKeyPath: 'tests/fixtures/id_test'
  });

  assert.match(String(options.privateKey), /BEGIN OPENSSH PRIVATE KEY/);
});
