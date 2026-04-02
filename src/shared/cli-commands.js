const COMMANDS = {
  'claude-code': [
    // Session
    { command: '/help', description: 'Show help and available commands', group: 'session' },
    { command: '/clear', description: 'Clear conversation history and free up context', group: 'session' },
    { command: '/compact', description: 'Compact conversation with optional focus instructions', group: 'session' },
    { command: '/model', description: 'Select or change the AI model', group: 'session' },
    { command: '/cost', description: 'Show token usage statistics', group: 'session' },
    { command: '/status', description: 'Show version, model, account, and connectivity info', group: 'session' },
    { command: '/context', description: 'Visualize current context usage as a colored grid', group: 'session' },
    { command: '/effort', description: 'Set model effort level (low/medium/high/max)', group: 'session' },
    { command: '/fast', description: 'Toggle fast mode on or off', group: 'session' },
    // Navigation
    { command: '/resume', description: 'Resume a conversation by ID or name', group: 'navigation' },
    { command: '/branch', description: 'Create a branch of the current conversation', group: 'navigation' },
    { command: '/rewind', description: 'Rewind conversation and/or code to a previous point', group: 'navigation' },
    { command: '/diff', description: 'Open interactive diff viewer for uncommitted changes', group: 'navigation' },
    { command: '/copy', description: 'Copy the last assistant response to clipboard', group: 'navigation' },
    { command: '/export', description: 'Export the current conversation as plain text', group: 'navigation' },
    // Project
    { command: '/init', description: 'Initialize project with a CLAUDE.md guide', group: 'project' },
    { command: '/memory', description: 'Edit CLAUDE.md memory files', group: 'project' },
    { command: '/config', description: 'Open Settings interface (theme, model, output style)', group: 'project' },
    { command: '/permissions', description: 'View or update tool permissions', group: 'project' },
    { command: '/add-dir', description: 'Add a working directory for file access', group: 'project' },
    { command: '/plan', description: 'Enter plan mode with optional task description', group: 'project' },
    // Tools
    { command: '/mcp', description: 'Manage MCP server connections', group: 'tools' },
    { command: '/doctor', description: 'Diagnose and verify installation and settings', group: 'tools' },
    { command: '/skills', description: 'List available skills', group: 'tools' },
    { command: '/hooks', description: 'View hook configurations for tool events', group: 'tools' },
    { command: '/terminal-setup', description: 'Configure terminal keybindings', group: 'tools' },
    { command: '/plugin', description: 'Manage Claude Code plugins', group: 'tools' },
    // Advanced
    { command: '/batch', description: 'Orchestrate large-scale changes across codebase in parallel', group: 'advanced' },
    { command: '/debug', description: 'Enable debug logging and troubleshoot issues', group: 'advanced' },
    { command: '/simplify', description: 'Review changed files for code reuse and quality issues', group: 'advanced' },
    { command: '/loop', description: 'Run a prompt repeatedly on an interval', group: 'advanced' },
    { command: '/security-review', description: 'Analyze pending changes for security vulnerabilities', group: 'advanced' },
    { command: '/pr-comments', description: 'Fetch and display comments from a GitHub PR', group: 'advanced' },
    { command: '/schedule', description: 'Create, update, list, or run Cloud scheduled tasks', group: 'advanced' },
    // Account
    { command: '/login', description: 'Sign in to your Anthropic account', group: 'account' },
    { command: '/logout', description: 'Sign out from your Anthropic account', group: 'account' },
    { command: '/bug', description: 'Submit feedback about Claude Code', group: 'account' },
    { command: '/vim', description: 'Toggle between Vim and Normal editing modes', group: 'account' },
    { command: '/theme', description: 'Change the color theme', group: 'account' },
    { command: '/usage', description: 'Show plan usage limits and rate limit status', group: 'account' },
    { command: '/release-notes', description: 'View the full changelog', group: 'account' }
  ],
  'codex-cli': [
    // Session
    { command: '/help', description: 'Show available commands', group: 'session' },
    { command: '/clear', description: 'Clear conversation history', group: 'session' },
    { command: '/compact', description: 'Compact conversation context', group: 'session' },
    { command: '/model', description: 'Change the AI model', group: 'session' },
    { command: '/fast', description: 'Toggle fast mode (1.5x speed, 2x credits)', group: 'session' },
    // Code
    { command: '/diff', description: 'Show pending changes', group: 'code' },
    { command: '/undo', description: 'Undo the last file change', group: 'code' },
    // Config
    { command: '/approval', description: 'Set approval mode (suggest/auto-edit/full-auto)', group: 'config' },
    { command: '/history', description: 'Show command history', group: 'config' },
    { command: '/skills', description: 'List available skills', group: 'config' },
    { command: '/hooks', description: 'Manage hook configurations', group: 'config' },
    { command: '/mcp', description: 'Manage MCP server connections', group: 'config' },
    // Account
    { command: '/bug', description: 'Report a bug', group: 'account' },
    { command: '/plan', description: 'Enter plan mode to plan before coding', group: 'session' }
  ],
  'copilot-cli': [
    // Session
    { command: '/help', description: 'Show available commands', group: 'session' },
    { command: '/clear', description: 'Clear conversation context', group: 'session' },
    { command: '/compact', description: 'Manually compress conversation context', group: 'session' },
    { command: '/model', description: 'Select or change the AI model', group: 'session' },
    { command: '/context', description: 'Show detailed token usage breakdown', group: 'session' },
    { command: '/plan', description: 'Enter plan mode for structured implementation', group: 'session' },
    // Tools
    { command: '/mcp', description: 'Manage MCP server connections', group: 'tools' },
    { command: '/allow-all', description: 'Allow all tools without manual approval', group: 'tools' },
    // Account
    { command: '/feedback', description: 'Submit feedback, bug report, or feature suggestion', group: 'account' }
  ]
};

const GROUP_LABELS = {
  session: 'Session',
  navigation: 'Navigation',
  project: 'Project',
  tools: 'Tools',
  advanced: 'Advanced',
  code: 'Code',
  config: 'Config',
  account: 'Account'
};

export function getCliCommands(cliType) {
  return COMMANDS[cliType] ?? getAllCommands();
}

export function getAllCommands() {
  const seen = new Set();
  const merged = [];
  for (const commands of Object.values(COMMANDS)) {
    for (const cmd of commands) {
      if (!seen.has(cmd.command)) {
        seen.add(cmd.command);
        merged.push(cmd);
      }
    }
  }
  return merged;
}

export function getGroupLabel(group) {
  return GROUP_LABELS[group] ?? group;
}
