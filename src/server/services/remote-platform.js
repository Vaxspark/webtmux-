function quotePosixArg(value) {
  const stringValue = String(value ?? '');
  if (/^[A-Za-z0-9_./:%@+=,#-]+$/.test(stringValue)) {
    return stringValue;
  }
  return `'${stringValue.replace(/'/g, `'"'"'`)}'`;
}

function quotePowershell(value) {
  return `'${String(value ?? '').replace(/'/g, "''")}'`;
}

export function buildRemoteCommand(server, args) {
  const command = `${server.tmuxCommand} ${args.map(quotePosixArg).join(' ')}`.trim();
  if (server.platform === 'windows' || server.shellType === 'powershell') {
    return `powershell -NoProfile -Command ${quotePowershell(command)}`;
  }
  return command;
}

