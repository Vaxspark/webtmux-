const COMMANDS = {
  'claude-code': [
    { command: '/help', description: 'Show available Claude Code commands' },
    { command: '/model', description: 'Switch the current Claude model' }
  ],
  'codex-cli': [
    { command: '/help', description: 'Show available Codex CLI commands' },
    { command: '/plan', description: 'Ask Codex to produce a plan first' }
  ],
  'copilot-cli': [
    { command: '/help', description: 'Show available Copilot CLI commands' },
    { command: '/clear', description: 'Clear the current Copilot context' }
  ]
};

export function getCliCommands(cliType) {
  return COMMANDS[cliType] ?? [];
}
