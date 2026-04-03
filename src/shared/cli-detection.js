import { getCliCommands } from './cli-commands.js';

export function detectCliType({ processName, paneTitle, windowName, previewLines }) {
  const processValue = String(processName ?? '').toLowerCase();
  const titleValue = String(paneTitle ?? '').toLowerCase();
  const windowValue = String(windowName ?? '').toLowerCase();

  if (processValue.includes('claude')) return 'claude-code';
  if (processValue.includes('codex')) return 'codex-cli';
  if (processValue.includes('copilot')) return 'copilot-cli';

  // windowName is set when the CLI was created via webtmux (e.g. "copilot-cli:workspace")
  // and is more reliable than preview content detection
  if (windowValue.includes('copilot-cli')) return 'copilot-cli';
  if (windowValue.includes('codex-cli')) return 'codex-cli';
  if (windowValue.includes('claude-code')) return 'claude-code';

  if (titleValue.includes('claude')) return 'claude-code';
  if (titleValue.includes('codex')) return 'codex-cli';
  if (titleValue.includes('copilot')) return 'copilot-cli';

  // Detect from tmux pane content (preview lines)
  if (Array.isArray(previewLines) && previewLines.length > 0) {
    const content = previewLines.join('\n').toLowerCase();
    // Codex CLI markers (check before claude to avoid false-positive from model names in copilot output)
    if (content.includes('codex') || content.includes('openai') || content.includes('gpt-') || content.includes('o3-') || content.includes('o4-')) return 'codex-cli';
    // Copilot CLI markers
    if (content.includes('copilot') || content.includes('autopilot') || content.includes('github.com')) return 'copilot-cli';
    // Claude Code markers
    if (content.includes('claude') || content.includes('anthropic') || content.includes('claude.md') || content.includes('/compact') || content.includes('sonnet') || content.includes('opus')) return 'claude-code';
  }

  return 'unknown';
}

export { getCliCommands };
