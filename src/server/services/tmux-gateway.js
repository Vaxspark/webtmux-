import { detectCliType } from '../../shared/cli-detection.js';
import { buildRemoteCommand } from './remote-platform.js';
import { runRemoteCommand } from './ssh-client.js';

export function parsePaneLines(output) {
  return String(output)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

export async function capturePane(server, target) {
  const command = buildRemoteCommand(server, ['capture-pane', '-p', '-t', target, '-S', '-120']);
  const result = await runRemoteCommand(server, command);
  return parsePaneLines(result.stdout);
}

export async function listPanes(server) {
  const format = '#{session_name}\t#{window_name}\t#{pane_index}\t#{pane_title}\t#{pane_current_command}\t#{pane_id}';
  const command = buildRemoteCommand(server, ['list-panes', '-a', '-F', JSON.stringify(format)]);
  const result = await runRemoteCommand(server, command);
  const rows = parsePaneLines(result.stdout);

  return Promise.all(rows.map(async (row) => {
    const [sessionName, windowName, paneIndex, paneTitle, processName, paneId] = row.split('\t');
    const preview = await capturePane(server, paneId);
    return {
      serverId: server.id,
      paneId,
      sessionName,
      windowName,
      paneIndex,
      paneTitle,
      processName,
      cliType: detectCliType({ processName, paneTitle }),
      preview: preview.slice(-3),
      updatedAt: new Date().toISOString()
    };
  }));
}

export async function sendKeys(server, target, keys) {
  const command = buildRemoteCommand(server, ['send-keys', '-t', target, ...keys]);
  await runRemoteCommand(server, command);
}
