import assert from 'node:assert/strict';
import { runCase } from '../helpers.mjs';
import {
  buildDirectoryListCommand,
  buildRemoteCommand,
  buildWorkspaceNavigationCommand,
  buildWorkspaceValidationCommand
} from '../../src/server/services/remote-platform.js';
import {
  buildCliWindowName,
  buildDirectoryEntries,
  createCliWindow,
  ensureWebTmuxSession,
  ensureWorkspaceDirectory,
  parseCreatedPaneRow,
  parseDirectoryRows,
  parsePaneLines,
  parsePaneRow,
  PANE_FIELD_SEPARATOR,
  listPanes
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

await runCase('buildRemoteCommand uses powershell quoting for apostrophes on windows', () => {
  const server = { platform: 'windows', shellType: 'powershell', tmuxCommand: 'wsl.exe -e tmux' };
  const command = buildRemoteCommand(server, ['send-keys', '-t', '%1', "O'Brien"]);
  assert.match(command, /O''''Brien/);
});

await runCase('buildWorkspaceValidationCommand respects tmuxUser for posix validation', () => {
  const server = { platform: 'ubuntu', shellType: 'posix', username: 'ssh-user', tmuxUser: 'tmux-user' };
  const command = buildWorkspaceValidationCommand(server, '/srv/work/webtmux');
  assert.ok(command.includes('sudo -u'));
  assert.match(command, /^sudo -u /);
});

await runCase('buildRemoteCommand and validation skip tmuxUser on windows', () => {
  const server = { platform: 'windows', shellType: 'powershell', username: 'ssh-user', tmuxUser: 'tmux-user', tmuxCommand: 'wsl.exe -e tmux' };
  assert.ok(!buildRemoteCommand(server, ['send-keys', '-t', '%1', 'echo']).includes('sudo -u'));
  assert.ok(!buildWorkspaceValidationCommand(server, 'C:/Users/demo').includes('sudo -u'));
});

await runCase('ensureWebTmuxSession creates on code 1 and throws on other failures', async () => {
  const commands = [];
  const server = { platform: 'ubuntu', shellType: 'posix', tmuxCommand: 'tmux' };
  const createResult = await ensureWebTmuxSession(server, 'webtmux', {
    runCommand: async (_server, command) => {
      commands.push(command);
      if (command.includes('has-session')) return { code: 1, stdout: '', stderr: '' };
      return { code: 0, stdout: '', stderr: '' };
    }
  });
  assert.equal(createResult, 'webtmux');
  assert.equal(commands.filter((command) => command.includes('new-session')).length, 1);

  await assert.rejects(
    () => ensureWebTmuxSession(server, 'webtmux', {
      runCommand: async () => ({ code: 2, stdout: '', stderr: 'boom' })
    }),
    /tmux session check failed with exit code 2/
  );
});

await runCase('ensureWorkspaceDirectory returns boolean based on validation command', async () => {
  const commands = [];
  const server = { platform: 'ubuntu', shellType: 'posix', username: 'ssh-user', tmuxUser: 'tmux-user' };
  const exists = await ensureWorkspaceDirectory(server, '/srv/work/webtmux', {
    runCommand: async (_server, command) => {
      commands.push(command);
      return { code: 0, stdout: '', stderr: '' };
    }
  });
  assert.equal(exists, true);
  assert.match(commands[0], /^sudo -u /);
});

await runCase('createCliWindow uses tmux field separator and command flow', async () => {
  const commands = [];
  const sentKeys = [];
  const server = { platform: 'ubuntu', shellType: 'posix', username: 'ssh-user', tmuxCommand: 'tmux' };
  const created = await createCliWindow(server, {
    cliType: 'codex-cli',
    launchCommand: 'codex',
    sessionName: 'webtmux',
    workspacePath: '/srv/work/webtmux'
  }, {
    runCommand: async (_server, command) => {
      commands.push(command);
      if (command.includes('has-session')) return { code: 1, stdout: '', stderr: '' };
      if (command.includes('new-session')) return { code: 0, stdout: '', stderr: '' };
      if (command.includes('new-window')) {
        return { code: 0, stdout: ['webtmux', 'codex-cli:webtmux', '0', '%9'].join(PANE_FIELD_SEPARATOR), stderr: '' };
      }
      if (command.includes('send-keys')) return { code: 0, stdout: '', stderr: '' };
      throw new Error(`unexpected command ${command}`);
    },
    sendKeys: async (_server, target, keys) => {
      sentKeys.push({ target, keys });
    }
  });
  assert.equal(created.paneId, '%9');
  assert.equal(sentKeys.length, 4);
  assert.ok(commands.some((command) => command.includes(PANE_FIELD_SEPARATOR)));
});
