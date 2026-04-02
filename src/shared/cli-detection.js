import { getCliCommands } from './cli-commands.js';

export function detectCliType({ processName, paneTitle, previewLines }) {
  const processValue = String(processName ?? '').toLowerCase();
  const titleValue = String(paneTitle ?? '').toLowerCase();

  if (processValue.includes('claude')) return 'claude-code';
  if (processValue.includes('codex')) return 'codex-cli';
  if (processValue.includes('copilot')) return 'copilot-cli';

  if (titleValue.includes('claude')) return 'claude-code';
  if (titleValue.includes('codex')) return 'codex-cli';
  if (titleValue.includes('copilot')) return 'copilot-cli';

  // Detect from tmux pane content (preview lines)
  if (Array.isArray(previewLines) && previewLines.length > 0) {
    const content = previewLines.join('\n').toLowerCase();
    // Claude Code markers
    if (content.includes('claude') || content.includes('anthropic') || content.includes('claude.md') || content.includes('/compact') || content.includes('sonnet') || content.includes('opus')) return 'claude-code';
    // Codex CLI markers
    if (content.includes('codex') || content.includes('openai') || content.includes('gpt-') || content.includes('o3-') || content.includes('o4-')) return 'codex-cli';
    // Copilot CLI markers
    if (content.includes('copilot') || content.includes('github.com') || content.includes('autopilot')) return 'copilot-cli';
  }

  return 'unknown';
}

export { getCliCommands };
