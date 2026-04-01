import { getCliCommands } from './cli-commands.js';

export function detectCliType({ processName, paneTitle }) {
  const processValue = String(processName ?? '').toLowerCase();
  const titleValue = String(paneTitle ?? '').toLowerCase();

  if (processValue.includes('claude')) return 'claude-code';
  if (processValue.includes('codex')) return 'codex-cli';
  if (processValue.includes('copilot')) return 'copilot-cli';

  if (titleValue.includes('claude')) return 'claude-code';
  if (titleValue.includes('codex')) return 'codex-cli';
  if (titleValue.includes('copilot')) return 'copilot-cli';

  return 'unknown';
}

export { getCliCommands };
