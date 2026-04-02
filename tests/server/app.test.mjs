import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runCase } from '../helpers.mjs';
import { createApp } from '../../src/server/app.js';
import { mapControlAction } from '../../src/server/services/session-stream.js';

process.env.WEBTMUX_PASSWORD = 'secret';

async function createTestApp(routes = {}) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'webtmux-app-test-'));
  const registryFile = path.join(tempDir, 'servers.json');
  await writeFile(registryFile, JSON.stringify([
    {
      id: 'server-a',
      name: 'Server A',
      host: 'example.com',
      port: 22,
      username: 'demo',
      authStrategy: 'agent',
      platform: 'ubuntu'
    }
  ]), 'utf8');
  process.env.WEBTMUX_REGISTRY_FILE = registryFile;

  const app = createApp({ routes });
  const login = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { password: 'secret' }
  });
  const cookies = login.cookies.reduce((acc, cookie) => {
    acc[cookie.name] = cookie.value;
    return acc;
  }, {});

  return { app, cookies };
}

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

await runCase('createApp exposes remote directory browse api', async () => {
  const { app, cookies } = await createTestApp({
    server: {
      gateway: {
        listDirectories: async () => [{ name: 'repo', path: '/home/test/repo' }]
      }
    }
  });

  const response = await app.inject({
    method: 'GET',
    url: '/api/servers/server-a/fs?path=%2Fhome%2Ftest',
    cookies
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    path: '/home/test',
    parentPath: '/home',
    directories: [{ name: 'repo', path: '/home/test/repo' }]
  });
  await app.close();
});

await runCase('createApp reports current path when browsing the default directory', async () => {
  const { app, cookies } = await createTestApp({
    server: {
      gateway: {
        listDirectories: async () => [{ name: 'repo', path: '/home/test/repo' }]
      }
    }
  });

  const response = await app.inject({
    method: 'GET',
    url: '/api/servers/server-a/fs',
    cookies
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    path: '/home/test',
    parentPath: '/home',
    directories: [{ name: 'repo', path: '/home/test/repo' }]
  });
  await app.close();
});

await runCase('createApp returns / as the parent path for root-adjacent POSIX paths', async () => {
  const { app, cookies } = await createTestApp({
    server: {
      gateway: {
        listDirectories: async () => [{ name: 'repo', path: '/home/repo' }]
      }
    }
  });

  const response = await app.inject({
    method: 'GET',
    url: '/api/servers/server-a/fs?path=%2Fhome',
    cookies
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().parentPath, '/');
  await app.close();
});

await runCase('createApp returns the drive root as the parent path for Windows paths', async () => {
  const { app, cookies } = await createTestApp({
    server: {
      gateway: {
        listDirectories: async () => [{ name: 'repo', path: 'C:\\Users\\repo' }]
      }
    }
  });

  const response = await app.inject({
    method: 'GET',
    url: '/api/servers/server-a/fs?path=' + encodeURIComponent('C:\\Users'),
    cookies
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().parentPath, 'C:\\');
  await app.close();
});

await runCase('createApp exposes session create api', async () => {
  const { app, cookies } = await createTestApp({
    session: {
      gateway: {
        ensureWorkspaceDirectory: async () => true,
        createCliWindow: async () => ({
          sessionName: 'webtmux',
          windowName: 'codex-cli:webtmux',
          paneIndex: '0',
          paneId: '%9',
          workspacePath: '/home/test/webtmux'
        })
      }
    }
  });

  const response = await app.inject({
    method: 'POST',
    url: '/api/session/create',
    cookies,
    payload: {
      serverId: 'server-a',
      cliType: 'codex-cli',
      workspacePath: '/home/test/webtmux',
      launchCommand: 'codex'
    }
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    serverId: 'server-a',
    sessionName: 'webtmux',
    windowName: 'codex-cli:webtmux',
    paneIndex: '0',
    paneId: '%9',
    workspacePath: '/home/test/webtmux',
    cliType: 'codex-cli',
    paneTitle: 'codex-cli:webtmux'
  });
  await app.close();
});

await runCase('createApp returns 404 when session create server is missing', async () => {
  const { app, cookies } = await createTestApp({
    session: {
      gateway: {
        ensureWorkspaceDirectory: async () => true,
        createCliWindow: async () => {
          throw new Error('should not be called');
        }
      }
    }
  });

  const response = await app.inject({
    method: 'POST',
    url: '/api/session/create',
    cookies,
    payload: {
      serverId: 'missing-server',
      cliType: 'codex-cli',
      workspacePath: '/home/test/missing',
      launchCommand: 'codex'
    }
  });

  assert.equal(response.statusCode, 404);
  await app.close();
});

await runCase('createApp returns 400 when session workspace is not a directory', async () => {
  const { app, cookies } = await createTestApp({
    session: {
      gateway: {
        ensureWorkspaceDirectory: async () => false,
        createCliWindow: async () => {
          throw new Error('should not be called');
        }
      }
    }
  });

  const response = await app.inject({
    method: 'POST',
    url: '/api/session/create',
    cookies,
    payload: {
      serverId: 'server-a',
      cliType: 'codex-cli',
      workspacePath: '/home/test/missing',
      launchCommand: 'codex'
    }
  });

  assert.equal(response.statusCode, 400);
  await app.close();
});

await runCase('createApp accepts existing session input control keys', async () => {
  const sentKeys = [];
  const { app, cookies } = await createTestApp({
    session: {
      gateway: {
        capturePane: async () => [],
        sendKeys: async (_server, target, keys) => {
          sentKeys.push({ target, keys });
        }
      }
    }
  });

  const response = await app.inject({
    method: 'POST',
    url: '/api/session/input',
    cookies,
    payload: {
      serverId: 'server-a',
      target: '%1',
      control: 'tab'
    }
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(sentKeys, [{ target: '%1', keys: ['Tab'] }]);
  await app.close();
});

await runCase('mapControlAction maps ctrl-c to tmux control key', () => {
  assert.deepEqual(mapControlAction('ctrl-c'), ['C-c']);
});