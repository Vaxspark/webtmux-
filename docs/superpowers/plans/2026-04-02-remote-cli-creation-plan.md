# Remote CLI Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `New CLI` flow that lets the user browse a remote server directory, choose a workspace, and create a persistent tmux-backed Claude Code, Codex CLI, or Copilot CLI window that opens immediately in WebTmux.

**Architecture:** Keep the current Fastify plus static `public/app.js` architecture. Extend the tmux gateway with remote directory browsing, workspace validation, reusable-session creation, and CLI window creation; add one browse API and one create API; then extend the overview UI with a modal dialog that drives the new server-side flow.

**Tech Stack:** Node.js 22, Fastify, `ssh2`, Zod, tmux, plain browser JavaScript in `public/app.js`, CSS in `public/styles.css`, custom `.test.mjs` test runner via `node scripts/run-tests.mjs`

---

## File Map

- Modify: `src/server/services/tmux-gateway.js`
  Responsibility: remote directory browsing, workspace validation, reusable tmux session management, new CLI window creation.
- Modify: `src/server/services/remote-platform.js`
  Responsibility: add platform-aware quoting helpers for path navigation and directory listing commands.
- Modify: `src/server/routes/session-routes.js`
  Responsibility: add `POST /api/session/create` and keep session input behavior unchanged.
- Modify: `src/server/routes/server-routes.js`
  Responsibility: add `GET /api/servers/:serverId/fs` for remote directory browsing.
- Modify: `src/server/app.js`
  Responsibility: keep route registration stable while exposing the new APIs through the existing app.
- Modify: `public/app.js`
  Responsibility: add overview-level create-dialog state, workspace browser requests, launch command defaults, submit behavior, and immediate open-on-create flow.
- Modify: `public/styles.css`
  Responsibility: add dialog, directory browser, selected path, and action styles without regressing overview or session UI.
- Modify: `tests/server/tmux-gateway.test.mjs`
  Responsibility: cover tmux helper parsing and creation command assembly.
- Modify: `tests/server/app.test.mjs`
  Responsibility: cover new browse and create APIs through Fastify inject.
- Modify: `tests/web/app.test.mjs`
  Responsibility: cover the new overview dialog rendering, launch-command defaults, and workspace-browser HTML.

### Task 1: Add tmux gateway support for directory browsing and CLI window creation

**Files:**
- Modify: `tests/server/tmux-gateway.test.mjs`
- Modify: `src/server/services/remote-platform.js`
- Modify: `src/server/services/tmux-gateway.js`

- [ ] **Step 1: Write the failing tmux-gateway tests**

Add these imports at the top of `tests/server/tmux-gateway.test.mjs`:

```js
import {
  buildCliWindowName,
  parseDirectoryRows,
  parseCreatedPaneRow,
  parsePaneLines,
  parsePaneRow
} from '../../src/server/services/tmux-gateway.js';
```

Append these failing tests to `tests/server/tmux-gateway.test.mjs`:

```js
await runCase('parseDirectoryRows keeps only non-empty directory rows', () => {
  assert.deepEqual(parseDirectoryRows('repo\nnotes\n'), ['repo', 'notes']);
});

await runCase('parseCreatedPaneRow splits tmux created-window output', () => {
  assert.deepEqual(parseCreatedPaneRow('webtmux\tcodex:webtmux\t0\t%9'), {
    sessionName: 'webtmux',
    windowName: 'codex:webtmux',
    paneIndex: '0',
    paneId: '%9'
  });
});

await runCase('buildCliWindowName derives a stable tmux window label', () => {
  assert.equal(buildCliWindowName('codex-cli', '/srv/work/webtmux'), 'codex-cli:webtmux');
});
```

- [ ] **Step 2: Run the tmux-gateway test file and verify failure**

Run:

```bash
node tests/server/tmux-gateway.test.mjs
```

Expected:

```text
SyntaxError: The requested module '../../src/server/services/tmux-gateway.js' does not provide an export named 'buildCliWindowName'
```

- [ ] **Step 3: Implement minimal parsing and naming helpers**

Add these helpers near the top of `src/server/services/tmux-gateway.js` after `parsePaneRow`:

```js
export function parseDirectoryRows(output) {
  return String(output)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseCreatedPaneRow(row) {
  const [sessionName, windowName, paneIndex, paneId] = String(row).split('\t');
  return { sessionName, windowName, paneIndex, paneId };
}

export function buildCliWindowName(cliType, workspacePath) {
  const normalized = String(workspacePath ?? '').replace(/\\/g, '/').replace(/\/+$/, '');
  const base = normalized.split('/').filter(Boolean).pop() || 'workspace';
  return `${cliType}:${base}`;
}
```

Add these platform helpers to `src/server/services/remote-platform.js` after `buildRemoteCommand()`:

```js
export function quoteShellArg(server, value) {
  if (server.platform === 'windows' || server.shellType === 'powershell') {
    return quotePowershell(value);
  }
  return quotePosixArg(value);
}

export function buildDirectoryListCommand(server, targetPath) {
  const quoted = quoteShellArg(server, targetPath);
  if (server.platform === 'windows' || server.shellType === 'powershell') {
    return `powershell -NoProfile -Command ${quotePowershell(`Get-ChildItem -LiteralPath ${targetPath ? quotePowershell(targetPath) : '$HOME'} -Directory | Select-Object -ExpandProperty Name`)}`;
  }
  const pathArg = targetPath ? quotePosixArg(targetPath) : '$HOME';
  return `sh -lc ${quotePosixArg(`cd ${pathArg} && find . -mindepth 1 -maxdepth 1 -type d -printf '%f\\n'`)}`;
}
```

- [ ] **Step 4: Add directory browse and CLI window creation helpers**

Append these exports to `src/server/services/tmux-gateway.js` after `sendKeys()`:

```js
import { buildDirectoryListCommand, buildRemoteCommand, quoteShellArg } from './remote-platform.js';
import { runRemoteCommand } from './ssh-client.js';

export async function listDirectories(server, targetPath) {
  const command = buildDirectoryListCommand(server, targetPath);
  const result = await runRemoteCommand(server, command);
  return parseDirectoryRows(result.stdout).map((name) => ({
    name,
    path: joinRemotePath(server, targetPath, name)
  }));
}

export async function ensureWorkspaceDirectory(server, workspacePath) {
  const quoted = quoteShellArg(server, workspacePath);
  const command = server.platform === 'windows' || server.shellType === 'powershell'
    ? `powershell -NoProfile -Command ${quoteShellArg(server, `(Test-Path -LiteralPath ${quoted} -PathType Container)`)} `
    : `sh -lc ${quoteShellArg(server, `test -d ${quoted}`)}`;
  const result = await runRemoteCommand(server, command);
  return result.code === 0;
}

export async function ensureWebTmuxSession(server, sessionName = 'webtmux') {
  const hasSession = buildRemoteCommand(server, ['has-session', '-t', sessionName]);
  const existing = await runRemoteCommand(server, hasSession);
  if (existing.code === 0) return sessionName;
  const createSession = buildRemoteCommand(server, ['new-session', '-d', '-s', sessionName]);
  await runRemoteCommand(server, createSession);
  return sessionName;
}

export async function createCliWindow(server, { cliType, launchCommand, sessionName = 'webtmux', workspacePath }) {
  await ensureWebTmuxSession(server, sessionName);
  const windowName = buildCliWindowName(cliType, workspacePath);
  const createWindow = buildRemoteCommand(server, [
    'new-window',
    '-P',
    '-F',
    '#{session_name}\t#{window_name}\t#{pane_index}\t#{pane_id}',
    '-t',
    sessionName,
    '-n',
    windowName
  ]);
  const created = await runRemoteCommand(server, createWindow);
  const pane = parseCreatedPaneRow(created.stdout.trim());
  await sendKeys(server, pane.paneId, [`cd ${workspacePath}`]);
  await sendKeys(server, pane.paneId, ['Enter']);
  await sendKeys(server, pane.paneId, [launchCommand]);
  await sendKeys(server, pane.paneId, ['Enter']);
  return { ...pane, workspacePath };
}
```

Also add this helper above `listDirectories()` in the same file:

```js
function joinRemotePath(server, parentPath, childName) {
  if (!parentPath) {
    return server.platform === 'windows' || server.shellType === 'powershell'
      ? childName
      : `/${childName}`;
  }
  const separator = parentPath.includes('\\') ? '\\' : '/';
  return `${String(parentPath).replace(/[\\/]+$/, '')}${separator}${childName}`;
}
```

- [ ] **Step 5: Run the tmux-gateway test file and verify pass**

Run:

```bash
node tests/server/tmux-gateway.test.mjs
```

Expected:

```text
PASS parsePaneLines normalizes capture-pane output
PASS parsePaneRow splits tmux tab-delimited rows
PASS parseDirectoryRows keeps only non-empty directory rows
PASS parseCreatedPaneRow splits tmux created-window output
PASS buildCliWindowName derives a stable tmux window label
```

- [ ] **Step 6: Commit**

```bash
git add tests/server/tmux-gateway.test.mjs src/server/services/remote-platform.js src/server/services/tmux-gateway.js
git commit -m "feat: add tmux cli creation helpers"
```

### Task 2: Expose remote directory browse and CLI creation APIs

**Files:**
- Modify: `tests/server/app.test.mjs`
- Modify: `src/server/routes/server-routes.js`
- Modify: `src/server/routes/session-routes.js`

- [ ] **Step 1: Write the failing API tests**

Add these imports near the top of `tests/server/app.test.mjs`:

```js
import * as gateway from '../../src/server/services/tmux-gateway.js';
```

Append these tests to `tests/server/app.test.mjs`:

```js
await runCase('createApp exposes remote directory browse api', async () => {
  const originalListDirectories = gateway.listDirectories;
  gateway.listDirectories = async () => [{ name: 'repo', path: '/home/test/repo' }];

  const app = createApp();
  const login = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { password: 'secret' } });
  const response = await app.inject({
    method: 'GET',
    url: '/api/servers/server-a/fs?path=%2Fhome%2Ftest',
    cookies: login.cookies.reduce((acc, cookie) => ({ ...acc, [cookie.name]: cookie.value }), {})
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json().directories, [{ name: 'repo', path: '/home/test/repo' }]);
  gateway.listDirectories = originalListDirectories;
  await app.close();
});

await runCase('createApp exposes session create api', async () => {
  const originalEnsureWorkspaceDirectory = gateway.ensureWorkspaceDirectory;
  const originalCreateCliWindow = gateway.createCliWindow;
  gateway.ensureWorkspaceDirectory = async () => true;
  gateway.createCliWindow = async () => ({ sessionName: 'webtmux', windowName: 'codex-cli:webtmux', paneIndex: '0', paneId: '%9' });

  const app = createApp();
  const login = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { password: 'secret' } });
  const response = await app.inject({
    method: 'POST',
    url: '/api/session/create',
    cookies: login.cookies.reduce((acc, cookie) => ({ ...acc, [cookie.name]: cookie.value }), {}),
    payload: {
      serverId: 'server-a',
      cliType: 'codex-cli',
      workspacePath: '/home/test/webtmux',
      launchCommand: 'codex'
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().paneId, '%9');
  gateway.ensureWorkspaceDirectory = originalEnsureWorkspaceDirectory;
  gateway.createCliWindow = originalCreateCliWindow;
  await app.close();
});
```

- [ ] **Step 2: Run the app test file and verify failure**

Run:

```bash
node tests/server/app.test.mjs
```

Expected:

```text
TypeError: Cannot assign to read only property 'listDirectories' of object '[object Module]'
```

- [ ] **Step 3: Refactor route modules to allow gateway dependency injection**

At the top of `src/server/routes/server-routes.js`, replace direct imports with a gateway bundle:

```js
import * as tmuxGateway from '../services/tmux-gateway.js';
```

Change the route registration signature to accept optional overrides:

```js
export async function registerServerRoutes(app, dependencies = {}) {
  const gateway = dependencies.gateway ?? tmuxGateway;
```

Add the browse route inside `registerServerRoutes()`:

```js
  app.get('/api/servers/:serverId/fs', { preHandler: requireAuth }, async (request, reply) => {
    const params = z.object({ serverId: z.string().min(1) }).parse(request.params ?? {});
    const query = z.object({ path: z.string().optional() }).parse(request.query ?? {});
    const config = getConfig();
    const server = loadServerRegistry(config.registryFile).find((entry) => entry.id === params.serverId);

    if (!server) {
      return reply.code(404).send({ message: 'Server not found' });
    }

    const directories = await gateway.listDirectories(server, query.path);
    return {
      path: query.path ?? null,
      parentPath: query.path ? query.path.replace(/[\\/][^\\/]+$/, '') || null : null,
      directories
    };
  });
```

Apply the same dependency-injection pattern in `src/server/routes/session-routes.js`:

```js
import * as tmuxGateway from '../services/tmux-gateway.js';

const createSessionSchema = z.object({
  serverId: z.string().min(1),
  cliType: z.enum(['claude-code', 'codex-cli', 'copilot-cli']),
  workspacePath: z.string().min(1),
  launchCommand: z.string().min(1)
});

export async function registerSessionRoutes(app, dependencies = {}) {
  const gateway = dependencies.gateway ?? tmuxGateway;
```

Add the create route before `/api/session/input`:

```js
  app.post('/api/session/create', { preHandler: requireAuth }, async (request, reply) => {
    const body = createSessionSchema.parse(request.body ?? {});
    const config = getConfig();
    const server = loadServerRegistry(config.registryFile).find((entry) => entry.id === body.serverId);

    if (!server) {
      return reply.code(404).send({ message: 'Server not found' });
    }

    const validWorkspace = await gateway.ensureWorkspaceDirectory(server, body.workspacePath);
    if (!validWorkspace) {
      return reply.code(400).send({ message: 'Workspace path must be an existing directory' });
    }

    const created = await gateway.createCliWindow(server, body);
    return {
      serverId: server.id,
      ...created,
      cliType: body.cliType,
      paneTitle: created.windowName
    };
  });
```

- [ ] **Step 4: Update `createApp()` to pass injectable route dependencies in tests**

Change the exported app factory in `src/server/app.js` to:

```js
export function createApp(dependencies = {}) {
  const app = Fastify({ logger: false });
  const config = getConfig();
  const routeDependencies = dependencies.routes ?? {};
```

Update the route registration calls to:

```js
  app.register(async (instance) => registerServerRoutes(instance, routeDependencies.server ?? {}));
  app.register(async (instance) => registerSessionRoutes(instance, routeDependencies.session ?? {}));
```

Update the new tests in `tests/server/app.test.mjs` to use dependency injection instead of mutating imported modules:

```js
const app = createApp({
  routes: {
    server: { gateway: { listDirectories: async () => [{ name: 'repo', path: '/home/test/repo' }] } },
    session: {
      gateway: {
        ensureWorkspaceDirectory: async () => true,
        createCliWindow: async () => ({ sessionName: 'webtmux', windowName: 'codex-cli:webtmux', paneIndex: '0', paneId: '%9' })
      }
    }
  }
});
```

- [ ] **Step 5: Run the app test file and verify pass**

Run:

```bash
node tests/server/app.test.mjs
```

Expected:

```text
PASS createApp rejects invalid login credentials
PASS mapControlAction maps ctrl-c to tmux control key
PASS createApp exposes remote directory browse api
PASS createApp exposes session create api
```

- [ ] **Step 6: Commit**

```bash
git add tests/server/app.test.mjs src/server/routes/server-routes.js src/server/routes/session-routes.js src/server/app.js
git commit -m "feat: add remote cli creation api"
```

### Task 3: Add overview dialog, workspace browser, and create flow in the static frontend

**Files:**
- Modify: `tests/web/app.test.mjs`
- Modify: `public/app.js`
- Modify: `public/styles.css`

- [ ] **Step 1: Write the failing web tests**

Add these imports to `tests/web/app.test.mjs`:

```js
import {
  getDefaultLaunchCommand,
  renderCreateCliDialog,
  renderDirectoryBrowser
} from '../../public/app.js';
```

Append these failing tests:

```js
await runCase('getDefaultLaunchCommand returns cli-specific defaults', () => {
  assert.equal(getDefaultLaunchCommand('claude-code'), 'claude-code');
  assert.equal(getDefaultLaunchCommand('codex-cli'), 'codex');
  assert.equal(getDefaultLaunchCommand('copilot-cli'), 'github-copilot-cli');
});

await runCase('renderDirectoryBrowser shows the current path and subdirectories', () => {
  const html = renderDirectoryBrowser({
    currentPath: '/home/demo',
    directories: [{ name: 'repo', path: '/home/demo/repo' }],
    error: '',
    loading: false
  });

  assert.match(html, /\/home\/demo/);
  assert.match(html, /repo/);
  assert.match(html, /data-action="browse-directory"/);
});

await runCase('renderCreateCliDialog includes server, cli, workspace, and launch controls', () => {
  const html = renderCreateCliDialog({
    createCli: {
      creating: false,
      directories: [],
      error: '',
      loading: false,
      open: true,
      selectedCli: 'codex-cli',
      selectedServer: 'server-a',
      workspacePath: '/home/demo',
      launchCommand: 'codex'
    },
    servers: [{ id: 'server-a', name: 'Server A' }]
  });

  assert.match(html, /New CLI/);
  assert.match(html, /server-a/);
  assert.match(html, /codex/);
  assert.match(html, /Create CLI/);
});
```

- [ ] **Step 2: Run the web test file and verify failure**

Run:

```bash
node tests/web/app.test.mjs
```

Expected:

```text
SyntaxError: The requested module '../../public/app.js' does not provide an export named 'getDefaultLaunchCommand'
```

- [ ] **Step 3: Add create-dialog state and render helpers**

Extend the root `state` object in `public/app.js` with:

```js
  createCli: {
    open: false,
    selectedServer: '',
    selectedCli: 'codex-cli',
    workspacePath: '',
    directories: [],
    loading: false,
    error: '',
    launchCommand: 'codex',
    creating: false
  }
```

Add these exports near the existing overview helpers:

```js
export function getDefaultLaunchCommand(cliType) {
  if (cliType === 'claude-code') return 'claude-code';
  if (cliType === 'copilot-cli') return 'github-copilot-cli';
  return 'codex';
}

export function renderDirectoryBrowser({ currentPath, directories, error, loading }) {
  return `
    <section class="cli-browser">
      <div class="cli-browser__path">${escapeHtml(currentPath || 'Loading workspace...')}</div>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
      ${loading ? '<div class="panel empty">Loading directories¡­</div>' : ''}
      <div class="cli-browser__list">
        ${directories.map((entry) => `<button class="cli-browser__row" type="button" data-action="browse-directory" data-path="${escapeHtml(entry.path)}">${escapeHtml(entry.name)}</button>`).join('') || '<div class="panel empty">No subdirectories found.</div>'}
      </div>
    </section>`;
}

export function renderCreateCliDialog({ createCli, servers }) {
  if (!createCli.open) return '';
  return `
    <div class="modal-backdrop" data-action="close-create-cli"></div>
    <div class="modal">
      <div class="modal__header">
        <h2>New CLI</h2>
        <button class="icon-button" type="button" data-action="close-create-cli" aria-label="Close">¡Á</button>
      </div>
      <div class="modal__body stack">
        <select id="create-cli-server" class="field">${servers.map((server) => `<option value="${escapeHtml(server.id)}" ${server.id === createCli.selectedServer ? 'selected' : ''}>${escapeHtml(server.name || server.id)}</option>`).join('')}</select>
        <select id="create-cli-type" class="field">
          <option value="claude-code" ${createCli.selectedCli === 'claude-code' ? 'selected' : ''}>Claude Code</option>
          <option value="codex-cli" ${createCli.selectedCli === 'codex-cli' ? 'selected' : ''}>Codex CLI</option>
          <option value="copilot-cli" ${createCli.selectedCli === 'copilot-cli' ? 'selected' : ''}>Copilot CLI</option>
        </select>
        ${renderDirectoryBrowser({
          currentPath: createCli.workspacePath,
          directories: createCli.directories,
          error: createCli.error,
          loading: createCli.loading
        })}
        <textarea id="create-cli-command" rows="2" class="field" placeholder="Launch command">${escapeHtml(createCli.launchCommand)}</textarea>
        <button class="btn-primary" type="button" data-action="submit-create-cli" ${createCli.creating ? 'disabled' : ''}>Create CLI</button>
      </div>
    </div>`;
}
```

- [ ] **Step 4: Wire the overview UI to browse and create**

Update `renderOverviewFilterBar()` in `public/app.js` so the returned HTML ends with:

```js
      <button class="btn-primary" type="button" data-action="open-create-cli">New CLI</button>
```

Update `overviewHtml()` to append the dialog after the cards section:

```js
      </section>
      ${renderCreateCliDialog({ createCli: state.createCli, servers: state.servers })}
```

Add these helpers below `loadServers()`:

```js
async function browseRemoteDirectory(path) {
  if (!state.createCli.selectedServer) return;
  state.createCli.loading = true;
  state.createCli.error = '';
  render();
  try {
    const query = path ? `?path=${encodeURIComponent(path)}` : '';
    const payload = await api(`/api/servers/${encodeURIComponent(state.createCli.selectedServer)}/fs${query}`);
    state.createCli.workspacePath = payload.path ?? state.createCli.workspacePath;
    state.createCli.directories = payload.directories ?? [];
  } catch (error) {
    state.createCli.error = error.message;
  } finally {
    state.createCli.loading = false;
    render();
  }
}

async function submitCreateCli() {
  state.createCli.creating = true;
  state.createCli.error = '';
  render();
  try {
    const created = await api('/api/session/create', {
      method: 'POST',
      body: JSON.stringify({
        serverId: state.createCli.selectedServer,
        cliType: state.createCli.selectedCli,
        workspacePath: state.createCli.workspacePath,
        launchCommand: state.createCli.launchCommand
      })
    });
    state.createCli.open = false;
    await loadOverview();
    await loadSession(created);
  } catch (error) {
    state.createCli.error = error.message;
    state.createCli.creating = false;
    render();
  }
}
```

Change the existing `change` listener signature to `document.addEventListener('change', async (event) => {`, then add:

```js
    if (event.target.id === 'create-cli-server') {
      state.createCli.selectedServer = event.target.value;
      await loadServers();
      await browseRemoteDirectory('');
      return;
    }

    if (event.target.id === 'create-cli-type') {
      state.createCli.selectedCli = event.target.value;
      state.createCli.launchCommand = getDefaultLaunchCommand(event.target.value);
      render();
      return;
    }
```

In the existing `input` listener, add:

```js
    if (event.target.id === 'create-cli-command') {
      state.createCli.launchCommand = event.target.value;
      return;
    }
```

In the existing `click` listener, add:

```js
    if (action === 'open-create-cli') {
      await loadServers();
      state.createCli.open = true;
      state.createCli.selectedServer = state.servers[0]?.id ?? '';
      state.createCli.selectedCli = 'codex-cli';
      state.createCli.launchCommand = getDefaultLaunchCommand('codex-cli');
      state.createCli.workspacePath = '';
      state.createCli.directories = [];
      state.createCli.error = '';
      if (state.createCli.selectedServer) {
        await browseRemoteDirectory('');
      }
      render();
      return;
    }

    if (action === 'close-create-cli') {
      state.createCli.open = false;
      state.createCli.error = '';
      render();
      return;
    }

    if (action === 'browse-directory') {
      await browseRemoteDirectory(target.getAttribute('data-path') ?? '');
      return;
    }

    if (action === 'submit-create-cli') {
      await submitCreateCli();
      return;
    }
```

- [ ] **Step 5: Add the dialog and browser styles**

Append these rules to `public/styles.css`:

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.42);
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  width: min(40rem, calc(100vw - 2rem));
  max-height: calc(100vh - 2rem);
  transform: translate(-50%, -50%);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  z-index: 60;
}

.modal__header,
.modal__body {
  padding: 1rem;
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.cli-browser {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cli-browser__path {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-secondary);
  padding: 0.65rem 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.cli-browser__list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 16rem;
  overflow-y: auto;
}

.cli-browser__row {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.65rem 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  text-align: left;
}

.cli-browser__row:hover {
  background: var(--bg-hover);
}
```

- [ ] **Step 6: Run the web test file and verify pass**

Run:

```bash
node tests/web/app.test.mjs
```

Expected:

```text
PASS filterCommands returns matching slash commands for codex
PASS shouldOpenCommandPalette only opens on slash-prefixed input
PASS renderOverviewPaneCard moves rename into the card header
PASS renderOverviewFilterBar uses the shared control style for show hidden
PASS getDefaultLaunchCommand returns cli-specific defaults
PASS renderDirectoryBrowser shows the current path and subdirectories
PASS renderCreateCliDialog includes server, cli, workspace, and launch controls
```

- [ ] **Step 7: Commit**

```bash
git add tests/web/app.test.mjs public/app.js public/styles.css
git commit -m "feat: add remote cli creation dialog"
```

### Task 4: Run full verification and close remaining integration gaps

**Files:**
- Modify: `tests/server/app.test.mjs`
- Modify: `tests/web/app.test.mjs`
- Modify: `public/app.js`
- Modify: `src/server/routes/server-routes.js`
- Modify: `src/server/routes/session-routes.js`
- Modify: `src/server/services/tmux-gateway.js`

- [ ] **Step 1: Add one failing regression per critical edge case**

Append these tests before final verification:

```js
await runCase('session create rejects a non-directory workspace', async () => {
  const app = createApp({
    routes: {
      session: {
        gateway: {
          ensureWorkspaceDirectory: async () => false,
          createCliWindow: async () => {
            throw new Error('should not run');
          }
        }
      }
    }
  });
  const login = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { password: 'secret' } });
  const response = await app.inject({
    method: 'POST',
    url: '/api/session/create',
    cookies: login.cookies.reduce((acc, cookie) => ({ ...acc, [cookie.name]: cookie.value }), {}),
    payload: { serverId: 'server-a', cliType: 'codex-cli', workspacePath: '/bad/path', launchCommand: 'codex' }
  });
  assert.equal(response.statusCode, 400);
  await app.close();
});
```

And in `tests/web/app.test.mjs` append:

```js
await runCase('renderCreateCliDialog returns empty html when dialog is closed', () => {
  const html = renderCreateCliDialog({
    createCli: { open: false },
    servers: []
  });
  assert.equal(html, '');
});
```

- [ ] **Step 2: Run targeted tests and verify failure then green**

Run first:

```bash
node tests/server/app.test.mjs
node tests/web/app.test.mjs
```

Expected before implementation tweaks:

```text
FAIL session create rejects a non-directory workspace
FAIL renderCreateCliDialog returns empty html when dialog is closed
```

Then make the minimal fixes required by those failures. The final code should include:

```js
if (!createCli.open) return '';
```

in `renderCreateCliDialog()` and:

```js
if (!validWorkspace) {
  return reply.code(400).send({ message: 'Workspace path must be an existing directory' });
}
```

in the create route.

- [ ] **Step 3: Run full repository verification**

Run:

```bash
node scripts/run-tests.mjs
```

Expected:

```text
PASS ...
PASS ...
PASS 8 test files
```

- [ ] **Step 4: Review the final diff before completion**

Run:

```bash
git diff -- src/server/services/tmux-gateway.js src/server/routes/server-routes.js src/server/routes/session-routes.js public/app.js public/styles.css tests/server/app.test.mjs tests/server/tmux-gateway.test.mjs tests/web/app.test.mjs
```

Expected:

```text
diff --git a/src/server/services/tmux-gateway.js ...
diff --git a/src/server/routes/server-routes.js ...
diff --git a/src/server/routes/session-routes.js ...
diff --git a/public/app.js ...
```

- [ ] **Step 5: Commit**

```bash
git add src/server/services/tmux-gateway.js src/server/routes/server-routes.js src/server/routes/session-routes.js public/app.js public/styles.css tests/server/app.test.mjs tests/server/tmux-gateway.test.mjs tests/web/app.test.mjs
git commit -m "feat: create remote cli windows from overview"
```

## Self-Review

### Spec coverage
- Overview `New CLI` entry point: Task 3
- Remote directory browsing API and UI: Task 2 and Task 3
- Editable launch command with CLI defaults: Task 3
- Reusable `webtmux` session plus new-window creation: Task 1
- Immediate open after create: Task 3
- Workspace validation and create errors: Task 2 and Task 4
- Testing across service, route, and UI layers: Task 1, Task 2, Task 3, Task 4

### Placeholder scan
- No `TODO`, `TBD`, or deferred implementation markers remain inside the tasks.
- Every task includes exact file paths, commands, and expected output.

### Type consistency
- `createCli` state keys are used consistently across renderer, event handlers, and submission logic.
- `serverId`, `cliType`, `workspacePath`, and `launchCommand` are the same property names in the plan, route schema, and frontend payload.
- `sessionName`, `windowName`, `paneIndex`, and `paneId` are introduced first in tmux-gateway helpers and reused unchanged by the API and frontend open-session flow.


