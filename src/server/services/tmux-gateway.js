import { detectCliType } from '../../shared/cli-detection.js';
import {
  buildDirectoryListCommand,
  buildRemoteCommand,
  buildWorkspaceNavigationCommand,
  buildWorkspaceValidationCommand
} from './remote-platform.js';
import { runRemoteCommand } from './ssh-client.js';

export const PANE_FIELD_SEPARATOR = '\u001f';

function getRunner(dependencies = {}) {
  return dependencies.runCommand ?? runRemoteCommand;
}

function getSendKeys(dependencies = {}) {
  return dependencies.sendKeys ?? sendKeys;
}

async function runCheckedRemoteCommand(server, command, context, dependencies = {}) {
  const result = await getRunner(dependencies)(server, command);
  if (result.code === 0) {
    return result;
  }
  const details = result.stderr ? `: ${String(result.stderr).trim()}` : '';
  throw new Error(`${context} failed with exit code ${result.code}${details}`);
}

export function parsePaneLines(output) {
  return String(output)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

export function parsePaneRow(row, separator = PANE_FIELD_SEPARATOR) {
  const [sessionName, windowName, paneIndex, paneTitle, processName, paneId] = String(row).split(separator);
  return {
    sessionName,
    windowName,
    paneIndex,
    paneTitle,
    processName,
    paneId
  };
}

export function parseDirectoryRows(output) {
  return String(output)
    .split(/\r?\n/)
    .filter((line) => line.length > 0);
}

export function parseCreatedPaneRow(row, separator = PANE_FIELD_SEPARATOR) {
  const [sessionName, windowName, paneIndex, paneId] = String(row).split(separator);
  return {
    sessionName,
    windowName,
    paneIndex,
    paneId
  };
}

export function buildCliWindowName(cliType, workspacePath) {
  const normalized = String(workspacePath ?? '').replace(/\\/g, '/').replace(/\/+$/, '');
  const baseName = normalized.split('/').filter(Boolean).pop() || 'workspace';
  return `${cliType}:${baseName}`;
}

function getDirectoryEntryName(entryPath) {
  const normalized = String(entryPath ?? '').replace(/[\\/]+$/, '');
  return normalized.split(/[\\/]/).filter(Boolean).pop() || normalized;
}

export function buildDirectoryEntries(directoryPaths) {
  return directoryPaths.map((entryPath) => ({
    name: getDirectoryEntryName(entryPath),
    path: entryPath
  }));
}

export async function capturePane(server, target, dependencies = {}) {
  const command = buildRemoteCommand(server, ['capture-pane', '-p', '-t', target, '-S', '-120']);
  const result = await runCheckedRemoteCommand(server, command, 'tmux capture-pane', dependencies);
  return parsePaneLines(result.stdout);
}

export async function listPanes(server, dependencies = {}) {
  const format = `#{session_name}${PANE_FIELD_SEPARATOR}#{window_name}${PANE_FIELD_SEPARATOR}#{pane_index}${PANE_FIELD_SEPARATOR}#{pane_title}${PANE_FIELD_SEPARATOR}#{pane_current_command}${PANE_FIELD_SEPARATOR}#{pane_id}`;
  const listArgs = ['list-panes', '-a', '-F', format];
  const command = buildRemoteCommand(server, listArgs);
  const result = await runCheckedRemoteCommand(server, command, 'tmux list-panes', dependencies);
  const rows = parsePaneLines(result.stdout);

  return Promise.all(rows.map(async (row) => {
    const { sessionName, windowName, paneIndex, paneTitle, processName, paneId } = parsePaneRow(row);
    const preview = await capturePane(server, paneId, dependencies);
    return {
      serverId: server.id,
      paneId,
      sessionName,
      windowName,
      paneIndex,
      paneTitle,
      processName,
      cliType: detectCliType({ processName, paneTitle, previewLines: preview }),
      preview: preview.slice(-3),
      updatedAt: new Date().toISOString()
    };
  }));
}

export async function listDirectories(server, targetPath, dependencies = {}) {
  const command = buildDirectoryListCommand(server, targetPath);
  const result = await runCheckedRemoteCommand(server, command, 'directory listing', dependencies);
  return buildDirectoryEntries(parseDirectoryRows(result.stdout));
}

export async function ensureWorkspaceDirectory(server, workspacePath, dependencies = {}) {
  const command = buildWorkspaceValidationCommand(server, workspacePath);
  const result = await getRunner(dependencies)(server, command);
  if (result.code === 0) {
    return true;
  }
  if (result.code === 1) {
    return false;
  }
  const details = result.stderr ? `: ${String(result.stderr).trim()}` : '';
  throw new Error(`workspace validation failed with exit code ${result.code}${details}`);
}

export async function ensureWebTmuxSession(server, sessionName = 'webtmux', dependencies = {}) {
  const hasSession = buildRemoteCommand(server, ['has-session', '-t', sessionName]);
  const existing = await getRunner(dependencies)(server, hasSession);
  if (existing.code === 0) {
    return sessionName;
  }
  if (existing.code === 1) {
    const createSession = buildRemoteCommand(server, ['new-session', '-d', '-s', sessionName]);
    await runCheckedRemoteCommand(server, createSession, 'tmux session creation', dependencies);
    return sessionName;
  }
  throw new Error(`tmux session check failed with exit code ${existing.code}`);
}

export async function createCliWindow(server, { cliType, launchCommand, sessionName = 'webtmux', workspacePath }, dependencies = {}) {
  await ensureWebTmuxSession(server, sessionName, dependencies);
  const windowName = buildCliWindowName(cliType, workspacePath);
  const createWindow = buildRemoteCommand(server, [
    'new-window',
    '-P',
    '-F',
    `#{session_name}${PANE_FIELD_SEPARATOR}#{window_name}${PANE_FIELD_SEPARATOR}#{pane_index}${PANE_FIELD_SEPARATOR}#{pane_id}`,
    '-t',
    sessionName,
    '-n',
    windowName
  ]);
  const created = await runCheckedRemoteCommand(server, createWindow, 'tmux window creation', dependencies);
  const pane = parseCreatedPaneRow(created.stdout.trim());
  const sendKeysFn = getSendKeys(dependencies);
  await sendKeysFn(server, pane.paneId, [buildWorkspaceNavigationCommand(server, workspacePath)], dependencies);
  await sendKeysFn(server, pane.paneId, ['Enter'], dependencies);
  await sendKeysFn(server, pane.paneId, [launchCommand], dependencies);
  await sendKeysFn(server, pane.paneId, ['Enter'], dependencies);
  return { ...pane, workspacePath };
}

export async function sendKeys(server, target, keys, dependencies = {}) {
  const command = buildRemoteCommand(server, ['send-keys', '-t', target, ...keys]);
  await runCheckedRemoteCommand(server, command, 'tmux send-keys', dependencies);
}
