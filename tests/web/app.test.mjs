import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { runCase } from '../helpers.mjs';
import {
  filterCommands,
  getDefaultLaunchCommand,
  focusCreateCliDialog,
  handleCreateCliDialogKeydown,
  renderCreateCliDialog,
  renderDirectoryBrowser,
  renderOverviewFilterBar,
  renderOverviewPaneCard,
  shouldOpenCommandPalette
} from '../../public/app.js';

await runCase('filterCommands returns matching slash commands for codex', () => {
  const commands = filterCommands('codex-cli', '/pl');
  assert.equal(commands.some((command) => command.command === '/plan'), true);
});

await runCase('shouldOpenCommandPalette only opens on slash-prefixed input', () => {
  assert.equal(shouldOpenCommandPalette('/'), true);
  assert.equal(shouldOpenCommandPalette('hello'), false);
});

await runCase('renderOverviewPaneCard moves rename into the card header', () => {
  const html = renderOverviewPaneCard({
    cliType: 'codex-cli',
    paneId: '%1',
    paneIndex: 0,
    paneTitle: 'workspace',
    preview: ['line 1'],
    serverId: 'server-a',
    sessionName: 'cli-main',
    windowName: 'node'
  }, { isHidden: false });

  assert.match(html, /card__title-row/);
  assert.match(html, /card__rename-btn/);
  assert.match(html, /data-action="rename-pane"/);
  assert.doesNotMatch(html, />Rename</);
});

await runCase('renderOverviewFilterBar uses the shared control style for show hidden', () => {
  const html = renderOverviewFilterBar({
    hiddenCount: 1,
    selectedCli: 'all',
    selectedServer: 'all',
    serverIds: ['all', 'server-a'],
    showHidden: false
  });

  assert.match(html, /data-action="toggle-hidden"/);
  assert.match(html, /class="filter-control"/);
  assert.match(html, /New CLI/);
  assert.doesNotMatch(html, /class="btn-ghost"/);
});
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
await runCase('renderCreateCliDialog renders create errors only once', () => {
  const html = renderCreateCliDialog({
    createCli: {
      creating: false,
      directories: [],
      error: 'Workspace not found',
      loading: false,
      open: true,
      parentPath: '/',
      selectedCli: 'codex-cli',
      selectedServer: 'server-a',
      workspacePath: '/home/demo',
      launchCommand: 'codex'
    },
    servers: [{ id: 'server-a', name: 'Server A' }]
  });

  assert.equal((html.match(/Workspace not found/g) || []).length, 1);
});

await runCase('renderCreateCliDialog uses an accessible close button label', () => {
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

  assert.match(html, /data-action="close-create-cli"/);
  assert.match(html, /aria-label="Close"/);
  assert.match(html, />Close<\/button>/);
});

await runCase('focusCreateCliDialog focuses the first enabled control', () => {
  let focused = '';
  const first = { disabled: false, focus: () => { focused = 'first'; } };
  const second = { disabled: false, focus: () => { focused = 'second'; } };
  const dialog = {
    querySelectorAll: () => [first, second]
  };

  focusCreateCliDialog(dialog);

  assert.equal(focused, 'first');
});

await runCase('handleCreateCliDialogKeydown traps tab and closes on escape', () => {
  let focused = '';
  const first = { disabled: false, focus: () => { focused = 'first'; } };
  const second = { disabled: false, focus: () => { focused = 'second'; } };
  const dialog = {
    ownerDocument: { activeElement: first },
    querySelectorAll: () => [first, second]
  };

  let tabPrevented = false;
  const tabEvent = {
    key: 'Tab',
    shiftKey: false,
    preventDefault: () => { tabPrevented = true; }
  };

  handleCreateCliDialogKeydown(tabEvent, dialog);
  assert.equal(tabPrevented, true);
  assert.equal(focused, 'second');

  let escapePrevented = false;
  const escapeEvent = {
    key: 'Escape',
    preventDefault: () => { escapePrevented = true; }
  };

  assert.equal(handleCreateCliDialogKeydown(escapeEvent, dialog), 'close');
  assert.equal(escapePrevented, true);
});




await runCase('renderDirectoryBrowser does not show an empty state while loading', () => {
  const html = renderDirectoryBrowser({
    currentPath: '/home/demo',
    directories: [],
    error: '',
    loading: true
  });

  assert.match(html, /Loading directories/);
  assert.doesNotMatch(html, /No subdirectories found/);
});

await runCase('web app module keeps its browser bootstrap block', async () => {
  const source = await readFile(new URL('../../public/app.js', import.meta.url), 'utf8');

  assert.match(source, /if \(typeof document !== 'undefined'\) \{/);
  assert.match(source, /attachListeners\(\);/);
  assert.match(source, /render\(\);/);
});
