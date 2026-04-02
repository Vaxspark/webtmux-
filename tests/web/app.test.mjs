import assert from 'node:assert/strict';
import { runCase } from '../helpers.mjs';
import {
  filterCommands,
  getDefaultLaunchCommand,
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


