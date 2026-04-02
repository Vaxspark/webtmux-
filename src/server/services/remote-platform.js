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

export function quoteShellArg(server, value) {
  return isWindowsShell(server) ? quotePowershell(value) : quotePosixArg(value);
}

export function buildDirectoryListCommand(server, targetPath) {
  if (isWindowsShell(server)) {
    const directory = targetPath ? quoteShellArg(server, targetPath) : '$HOME';
    const script = `Get-ChildItem -LiteralPath ${directory} -Directory | Select-Object -ExpandProperty Name`;
    return `powershell -NoProfile -Command ${quotePowershell(script)}`;
  }

  const directory = targetPath ? quotePosixArg(targetPath) : '$HOME';
  const script = `cd ${directory} && find . -mindepth 1 -maxdepth 1 -type d -printf '%f\\n'`;
  return `sh -lc ${quotePosixArg(script)}`;
}

export function buildWorkspaceNavigationCommand(server, workspacePath) {
  const quotedPath = quoteShellArg(server, workspacePath);
  if (isWindowsShell(server)) {
    return `Set-Location -LiteralPath ${quotedPath}`;
  }
  return `cd ${quotedPath}`;
}

export function buildRemoteCommand(server, args) {
  let tmuxCmd = server.tmuxCommand;
  // If tmuxUser is specified and differs from the SSH connection user,
  // use their tmux socket path to only see that user's sessions
  if (server.tmuxUser && server.tmuxUser !== server.username) {
    // Access the target user's default tmux socket
    tmuxCmd = `sudo -u ${quotePosixArg(server.tmuxUser)} ${tmuxCmd}`;
  }
  const command = `${tmuxCmd} ${args.map(quotePosixArg).join(' ')}`.trim();
  if (isWindowsShell(server)) {
    return `powershell -NoProfile -Command ${quotePowershell(command)}`;
  }
  return command;
}


