import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runCase } from '../helpers.mjs';

await runCase('server entrypoint does not re-register health route', () => {
  const source = readFileSync('src/server/index.js', 'utf8');
  assert.equal(source.includes("app.get('/health'"), false);
});
