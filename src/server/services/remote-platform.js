function quotePosixArg(value) {
  const stringValue = String(value ?? '');
  if (/^[A-Za-z0-9_./:%@+=,#-]+$/.test(stringValue)) {
    return stringValue;
  }
  return "'" + stringValue.replace(/'/g, "'\"'\"'") + "'";
}

function quotePowershell(value) {
  return `'${String(value ?? '').replace(/'/g, "''")}'`;
}

function isWindowsShell(server) {
  return server.platform === 'windows' || server.shellType === 'powershell';
}

function isWslBackedTmux(server) {
  return isWindowsShell(server) && /^wsl(?:\.exe)?(?:\s+-[^\s]+(?:\s+(?!-e\b)[^\s]+)?)*\s+-e\s+tmux(?:\s|$)/i.test(String(server.tmuxCommand ?? '').trim());
}

function isPosixTmuxEnvironment(server) {
  return !isWindowsShell(server) || isWslBackedTmux(server);
}


function getWslShellPrefix(server) {
  const command = String(server.tmuxCommand ?? '').trim();
  const match = command.match(/^(wsl(?:\.exe)?(?:\s+-[^\s]+(?:\s+(?!-e\b)[^\s]+)?)*\s+-e)\s+tmux(?:\s|$)/i);
  return match ? match[1] : 'wsl.exe -e';
}

function buildWslShellCommand(server, shellCommand) {
  return `powershell -NoProfile -Command ${quotePowershell(`${getWslShellPrefix(server)} sh -lc ${quotePosixArg(shellCommand)}`)}`;
}

function shouldElevateForTmuxUser(server, respectTmuxUser) {
  return respectTmuxUser && !isWindowsShell(server) && server.tmuxUser && server.tmuxUser !== server.username;
}

function quoteRemoteCommandArg(server, value) {
  return isPosixTmuxEnvironment(server) ? quotePosixArg(value) : quotePowershell(value);
}

export function quoteShellArg(server, value) {
  return quoteRemoteCommandArg(server, value);
}

export function buildDirectoryListCommand(server, targetPath) {
  if (isPosixTmuxEnvironment(server)) {
    const directory = targetPath ? quotePosixArg(targetPath) : '$HOME';
    const script = `find ${directory} -mindepth 1 -maxdepth 1 -type d -printf '%p\\n'`;
    if (isWindowsShell(server)) {
      return buildWslShellCommand(server, script);
    }
    return `sh -lc ${quotePosixArg(script)}`;
  }

  const directory = targetPath ? quotePowershell(targetPath) : '$HOME';
  const script = `Get-ChildItem -LiteralPath ${directory} -Directory | Select-Object -ExpandProperty FullName`;
  return `powershell -NoProfile -Command ${quotePowershell(script)}`;
}

export function buildCurrentDirectoryCommand(server, targetPath) {
  if (isPosixTmuxEnvironment(server)) {
    const shellCommand = targetPath
      ? `cd ${quotePosixArg(targetPath)} && pwd`
      : 'printf "%s\\n" "$HOME"';

    if (shouldElevateForTmuxUser(server, true)) {
      return `sudo -u ${quotePosixArg(server.tmuxUser)} sh -lc ${quotePosixArg(shellCommand)}`;
    }
    if (isWindowsShell(server)) {
      return buildWslShellCommand(server, shellCommand);
    }
    return `sh -lc ${quotePosixArg(shellCommand)}`;
  }

  const script = targetPath
    ? `Get-Item -LiteralPath ${quotePowershell(targetPath)} | Select-Object -ExpandProperty FullName`
    : 'Get-Item -LiteralPath $HOME | Select-Object -ExpandProperty FullName';
  return `powershell -NoProfile -Command ${quotePowershell(script)}`;
}

export function buildWorkspaceNavigationCommand(server, workspacePath) {
  const quotedPath = quotePosixArg(workspacePath);
  if (isPosixTmuxEnvironment(server)) {
    return `cd ${quotedPath}`;
  }
  return `Set-Location -LiteralPath ${quotePowershell(workspacePath)}`;
}

export function buildWorkspaceValidationCommand(server, workspacePath) {
  const quotedPath = quotePosixArg(workspacePath);
  if (isPosixTmuxEnvironment(server)) {
    const shellCommand = `test -d ${quotedPath}`;
    if (shouldElevateForTmuxUser(server, true)) {
      return `sudo -u ${quotePosixArg(server.tmuxUser)} sh -lc ${quotePosixArg(shellCommand)}`;
    }
    if (isWindowsShell(server)) {
      return buildWslShellCommand(server, shellCommand);
    }
    return `sh -lc ${quotePosixArg(shellCommand)}`;
  }

  const script = `if (Test-Path -LiteralPath ${quotePowershell(workspacePath)} -PathType Container) { exit 0 } else { exit 1 }`;
  return `powershell -NoProfile -Command ${quotePowershell(script)}`;
}

export function buildRemoteCommand(server, args, options = {}) {
  const { respectTmuxUser = true } = options;
  let tmuxCmd = server.tmuxCommand;
  if (shouldElevateForTmuxUser(server, respectTmuxUser)) {
    tmuxCmd = `sudo -u ${quotePosixArg(server.tmuxUser)} ${tmuxCmd}`;
  }
  const quotedArgs = args.map((arg) => quoteRemoteCommandArg(server, arg));
  const command = `${tmuxCmd} ${quotedArgs.join(' ')}`.trim();
  if (isWindowsShell(server)) {
    return `powershell -NoProfile -Command ${quotePowershell(command)}`;
  }
  return command;
}

