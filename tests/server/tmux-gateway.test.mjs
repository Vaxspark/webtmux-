import assert from 'node:assert/strict';
import { runCase } from '../helpers.mjs';
import {
  buildDirectoryListCommand,
  buildRemoteCommand,
  buildWorkspaceNavigationCommand
} from '../../src/server/services/remote-platform.js';
import {
  assertRemoteCommandSucceeded,
  buildCliWindowName,
  buildDirectoryEntries,
  parseCreatedPaneRow,
  parseDirectoryRows,
  parsePaneLines,
  parsePaneRow
} from '../../src/server/services/tmux-gateway.js';

await runCase('parsePaneLines normalizes capture-pane output', () => {
  assert.deepEqual(parsePaneLines('one\ntwo\n'), ['one', 'two']);
});

await runCase('parsePaneRow splits tmux tab-delimited rows', () => {
  const parsed = parsePaneRow('cli-main\tnode\t0\tworkspace\tnode\t%0');
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
