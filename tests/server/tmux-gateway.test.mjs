import assert from 'node:assert/strict';
import { runCase } from '../helpers.mjs';
import {
  buildCurrentDirectoryCommand,
  buildDirectoryListCommand,
  buildRemoteCommand,
  buildWorkspaceNavigationCommand,
  buildWorkspaceValidationCommand
} from '../../src/server/services/remote-platform.js';
import {
  buildCliWindowName,
  buildDirectoryEntries,
  createCliWindow,
  resolveDirectoryPath,
  ensureWebTmuxSession,
  ensureWorkspaceDirectory,
  parseCreatedPaneRow,
  parseDirectoryRows,
  parsePaneLines,
  parsePaneRow,
  PANE_FIELD_SEPARATOR
} from '../../src/server/services/tmux-gateway.js';

await runCase('parsePaneLines normalizes capture-pane output', () => {
  assert.deepEqual(parsePaneLines('one\ntwo\n'), ['one', 'two']);
});

await runCase('parsePaneRow splits tmux rows with field separator', () => {
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
  const server = { platform: 'windows', shellType: 'powershell', tmuxCommand: 'tmux' };
  const command = buildRemoteCommand(server, ['send-keys', '-t', '%1', "O'Brien"]);
  assert.match(command, /O''''Brien/);
});

await runCase('wsl-backed windows tmux uses posix command bodies', () => {
  const server = { platform: 'windows', shellType: 'powershell', username: 'ssh-user', tmuxUser: 'tmux-user', tmuxCommand: 'wsl.exe -e tmux' };
  const remoteCommand = buildRemoteCommand(server, ['send-keys', '-t', '%1', "O'Brien"]);
  assert.ok(remoteCommand.includes('wsl.exe -e tmux send-keys -t %1'));
  assert.ok(remoteCommand.includes("O''\"''\"''Brien"));
  assert.match(buildWorkspaceNavigationCommand(server, '/srv/work/webtmux'), /^cd /);
  assert.ok(buildWorkspaceValidationCommand(server, '/srv/work/webtmux').includes('wsl.exe -e sh -lc'));
  assert.ok(buildDirectoryListCommand(server, '/srv/work/webtmux').includes('wsl.exe -e sh -lc'));
});

await runCase('wsl.exe -d Ubuntu tmux uses posix tmux-targeted commands', () => {
  const server = { platform: 'windows', shellType: 'powershell', username: 'ssh-user', tmuxUser: 'tmux-user', tmuxCommand: 'wsl.exe -d Ubuntu -e tmux' };
  assert.match(buildWorkspaceNavigationCommand(server, '/srv/work/webtmux'), /^cd /);
  assert.ok(buildWorkspaceValidationCommand(server, '/srv/work/webtmux').includes('wsl.exe -d Ubuntu -e sh -lc'));
  assert.ok(buildDirectoryListCommand(server, '/srv/work/webtmux').includes('wsl.exe -d Ubuntu -e sh -lc'));
  assert.ok(buildRemoteCommand(server, ['send-keys', '-t', '%1', 'pwd']).includes('wsl.exe -d Ubuntu -e tmux'));
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

await runCase('ensureWorkspaceDirectory returns false for missing and throws on infrastructure errors', async () => {
  const missing = await ensureWorkspaceDirectory(
    { platform: 'ubuntu', shellType: 'posix', username: 'ssh-user', tmuxUser: 'tmux-user' },
    '/srv/work/webtmux',
    {
      runCommand: async () => ({ code: 1, stdout: '', stderr: '' })
    }
  );
  assert.equal(missing, false);

  await assert.rejects(
    () => ensureWorkspaceDirectory(
      { platform: 'ubuntu', shellType: 'posix', username: 'ssh-user', tmuxUser: 'tmux-user' },
      '/srv/work/webtmux',
      {
        runCommand: async () => ({ code: 2, stdout: '', stderr: 'permission denied' })
      }
    ),
    /workspace validation failed with exit code 2: permission denied/
  );
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

await runCase('createCliWindow uses posix navigation for wsl-backed windows tmux', async () => {
  const sentKeys = [];
  const server = { platform: 'windows', shellType: 'powershell', username: 'ssh-user', tmuxCommand: 'wsl.exe -e tmux' };
  await createCliWindow(server, {
    cliType: 'codex-cli',
    launchCommand: 'codex',
    sessionName: 'webtmux',
    workspacePath: '/srv/work/webtmux'
  }, {
    runCommand: async (_server, command) => {
      if (command.includes('has-session')) return { code: 1, stdout: '', stderr: '' };
      if (command.includes('new-session')) return { code: 0, stdout: '', stderr: '' };
      if (command.includes('new-window')) {
        return { code: 0, stdout: ['webtmux', 'codex-cli:webtmux', '0', '%9'].join(PANE_FIELD_SEPARATOR), stderr: '' };
      }
      return { code: 0, stdout: '', stderr: '' };
    },
    sendKeys: async (_server, _target, keys) => {
      sentKeys.push(keys.join(' '));
    }
  });
  assert.equal(sentKeys[0], 'cd /srv/work/webtmux');
});

await runCase('buildCurrentDirectoryCommand resolves the default home path', () => {
  const command = buildCurrentDirectoryCommand({ platform: 'ubuntu', shellType: 'posix' }, '');
  assert.match(command, /^sh -lc /);
  assert.ok(command.includes('"$HOME"'));
});

await runCase('resolveDirectoryPath returns the resolved remote path', async () => {
  const path = await resolveDirectoryPath(
    { platform: 'ubuntu', shellType: 'posix', tmuxCommand: 'tmux' },
    '',
    {
      runCommand: async () => ({ code: 0, stdout: '/home/demo\n', stderr: '' })
    }
  );

  assert.equal(path, '/home/demo');
});
