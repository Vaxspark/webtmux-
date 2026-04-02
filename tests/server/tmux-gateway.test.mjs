import assert from 'node:assert/strict';
import { runCase } from '../helpers.mjs';
import {
  buildDirectoryListCommand,
  buildRemoteCommand,
  buildWorkspaceNavigationCommand,
  buildWorkspaceValidationCommand
} from '../../src/server/services/remote-platform.js';
import {
  assertRemoteCommandSucceeded,
  buildCliWindowName,
  buildDirectoryEntries,
  parseCreatedPaneRow,
  parseDirectoryRows,
  parsePaneLines,
  parsePaneRow,
  PANE_FIELD_SEPARATOR
} from '../../src/server/services/tmux-gateway.js';

await runCase('parsePaneLines normalizes capture-pane output', () => {
  assert.deepEqual(parsePaneLines('one\ntwo\n'), ['one', 'two']);
});

await runCase('parsePaneRow splits tmux rows with unit separator', () => {
  const parsed = parsePaneRow(['cli-main', 'node', '0', 'workspace', 'node', '%0'].join(PANE_FIELD_SEPARATOR));
  assert.deepEqual(parsed, {
    sessionName: 'cli-main',
    windowName: 'node',
    paneIndex: '0',
    paneTitle: 'workspace',
    processName: 'node',
    paneId: '%0'
  });
});

await runCase('parseDirectoryRows keeps directory content intact', () => {
  assert.deepEqual(parseDirectoryRows(' repo \n\nnotes\n'), [' repo ', 'notes']);
});

await runCase('parseCreatedPaneRow splits tmux created-window output', () => {
  assert.deepEqual(parseCreatedPaneRow(['webtmux', 'codex:webtmux', '0', '%9'].join(PANE_FIELD_SEPARATOR)), {
    sessionName: 'webtmux',
    windowName: 'codex:webtmux',
    paneIndex: '0',
    paneId: '%9'
  });
});

await runCase('buildCliWindowName derives a stable tmux window label', () => {
  assert.equal(buildCliWindowName('codex-cli', '/srv/work/webtmux'), 'codex-cli:webtmux');
});

await runCase('buildDirectoryListCommand returns absolute child paths for home-root browsing', () => {
  const server = { platform: 'ubuntu', shellType: 'posix' };
  const command = buildDirectoryListCommand(server, '');
  assert.match(command, /^sh -lc /);
  assert.ok(command.includes('find $HOME -mindepth 1 -maxdepth 1 -type d -printf'));
  assert.ok(command.includes("%p\\n"));
});

await runCase('buildWorkspaceNavigationCommand assembles a platform-aware cd command', () => {
  const server = { platform: 'windows', shellType: 'powershell' };
  assert.equal(
    buildWorkspaceNavigationCommand(server, 'C:/Users/demo/webtmux'),
    "Set-Location -LiteralPath 'C:/Users/demo/webtmux'"
  );
});

await runCase('buildDirectoryEntries preserves absolute child paths', () => {
  assert.deepEqual(buildDirectoryEntries(['/home/demo/repo', '/home/demo/notes']), [
    { name: 'repo', path: '/home/demo/repo' },
    { name: 'notes', path: '/home/demo/notes' }
  ]);
});

await runCase('assertRemoteCommandSucceeded throws on non-zero exit codes', () => {
  assert.throws(
    () => assertRemoteCommandSucceeded({ code: 2, stderr: 'boom' }, 'tmux send-keys'),
    /tmux send-keys failed with exit code 2: boom/
  );
});

await runCase('buildRemoteCommand uses powershell quoting for apostrophes on windows', () => {
  const server = { platform: 'windows', shellType: 'powershell', tmuxCommand: 'wsl.exe -e tmux' };
  const command = buildRemoteCommand(server, ['send-keys', '-t', '%1', "O'Brien"]);
  assert.match(command, /O''''Brien/);
});

await runCase('buildWorkspaceValidationCommand ignores tmuxUser for posix validation', () => {
  const server = { platform: 'ubuntu', shellType: 'posix', username: 'ssh-user', tmuxUser: 'tmux-user' };
  const command = buildWorkspaceValidationCommand(server, '/srv/work/webtmux');
  assert.ok(!command.includes('sudo -u'));
  assert.match(command, /^sh -lc /);
});
