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

function shouldElevateForTmuxUser(server, respectTmuxUser) {
  return respectTmuxUser && !isWindowsShell(server) && server.tmuxUser && server.tmuxUser !== server.username;
}

function quoteRemoteCommandArg(server, value) {
  return isWindowsShell(server) ? quotePowershell(value) : quotePosixArg(value);
}

export function quoteShellArg(server, value) {
  return quoteRemoteCommandArg(server, value);
}

export function buildDirectoryListCommand(server, targetPath) {
  if (isWindowsShell(server)) {
    const directory = targetPath ? quoteShellArg(server, targetPath) : '$HOME';
    const script = `Get-ChildItem -LiteralPath ${directory} -Directory | Select-Object -ExpandProperty FullName`;
    return `powershell -NoProfile -Command ${quotePowershell(script)}`;
  }

  const directory = targetPath ? quotePosixArg(targetPath) : '$HOME';
  const script = `find ${directory} -mindepth 1 -maxdepth 1 -type d -printf '%p\\n'`;
  return `sh -lc ${quotePosixArg(script)}`;
}

export function buildWorkspaceNavigationCommand(server, workspacePath) {
  const quotedPath = quoteShellArg(server, workspacePath);
  if (isWindowsShell(server)) {
    return `Set-Location -LiteralPath ${quotedPath}`;
  }
  return `cd ${quotedPath}`;
}

export function buildWorkspaceValidationCommand(server, workspacePath) {
  const quotedPath = quoteShellArg(server, workspacePath);
  if (isWindowsShell(server)) {
    return `powershell -NoProfile -Command ${quotePowershell(`if (Test-Path -LiteralPath ${quotedPath} -PathType Container) { exit 0 } else { exit 1 }`)}`;
  }

  const shellCommand = `test -d ${quotedPath}`;
  if (shouldElevateForTmuxUser(server, true)) {
    return `sudo -u ${quotePosixArg(server.tmuxUser)} sh -lc ${quotePosixArg(shellCommand)}`;
  }
  return `sh -lc ${quotePosixArg(shellCommand)}`;
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
