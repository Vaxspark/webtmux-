import assert from 'node:assert/strict';
import { runCase } from '../helpers.mjs';
import { createApp } from '../../src/server/app.js';
import { mapControlAction } from '../../src/server/services/session-stream.js';

process.env.WEBTMUX_PASSWORD = 'secret';

await runCase('createApp rejects invalid login credentials', async () => {
  const app = createApp();
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { password: 'wrong' }
  });

  assert.equal(response.statusCode, 401);
  await app.close();
});

await runCase('mapControlAction maps ctrl-c to tmux control key', () => {
  assert.deepEqual(mapControlAction('ctrl-c'), ['C-c']);
});
