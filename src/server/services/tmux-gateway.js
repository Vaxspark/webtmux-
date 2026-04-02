import { detectCliType } from '../../shared/cli-detection.js';
import {
  buildDirectoryListCommand,
  buildRemoteCommand,
  buildWorkspaceNavigationCommand,
  buildWorkspaceValidationCommand,
  quoteShellArg
} from './remote-platform.js';
import { runRemoteCommand } from './ssh-client.js';

export const PANE_FIELD_SEPARATOR = '\u001f';

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

function isWindowsServer(server) {
  return server.platform === 'windows' || server.shellType === 'powershell';
}

function quotePosixCommandArg(value) {
  const stringValue = String(value ?? '');
  if (/^[A-Za-z0-9_./:%@+=,#-]+$/.test(stringValue)) {
    return stringValue;
  }
  return "'" + stringValue.replace(/'/g, "'\"'\"'") + "'";
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

export function assertRemoteCommandSucceeded(result, context) {
  if (result.code === 0) {
    return result;
  }
  const details = result.stderr ? `: ${String(result.stderr).trim()}` : '';
  throw new Error(`${context} failed with exit code ${result.code}${details}`);
}

async function runCheckedRemoteCommand(server, command, context) {
  const result = await runRemoteCommand(server, command);
  return assertRemoteCommandSucceeded(result, context);
}

export async function capturePane(server, target) {
  const command = buildRemoteCommand(server, ['capture-pane', '-p', '-t', target, '-S', '-120']);
  const result = await runCheckedRemoteCommand(server, command, 'tmux capture-pane');
  return parsePaneLines(result.stdout);
}

export async function listPanes(server) {
  const format = `#{session_name}${PANE_FIELD_SEPARATOR}#{window_name}${PANE_FIELD_SEPARATOR}#{pane_index}${PANE_FIELD_SEPARATOR}#{pane_title}${PANE_FIELD_SEPARATOR}#{pane_current_command}${PANE_FIELD_SEPARATOR}#{pane_id}`;
  const listArgs = ['list-panes', '-a', '-F', format];
  const command = buildRemoteCommand(server, listArgs);
  const result = await runCheckedRemoteCommand(server, command, 'tmux list-panes');
  const rows = parsePaneLines(result.stdout);

  return Promise.all(rows.map(async (row) => {
    const { sessionName, windowName, paneIndex, paneTitle, processName, paneId } = parsePaneRow(row);
    const preview = await capturePane(server, paneId);
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

export async function listDirectories(server, targetPath) {
  const command = buildDirectoryListCommand(server, targetPath);
  const result = await runCheckedRemoteCommand(server, command, 'directory listing');
  return buildDirectoryEntries(parseDirectoryRows(result.stdout));
}

export async function ensureWorkspaceDirectory(server, workspacePath) {
  const command = buildWorkspaceValidationCommand(server, workspacePath);
  const result = await runRemoteCommand(server, command);
  return result.code === 0;
}

export async function ensureWebTmuxSession(server, sessionName = 'webtmux') {
  const hasSession = buildRemoteCommand(server, ['has-session', '-t', sessionName]);
  const existing = await runRemoteCommand(server, hasSession);
  if (existing.code === 0) {
    return sessionName;
  }
  if (existing.code === 1) {
    const createSession = buildRemoteCommand(server, ['new-session', '-d', '-s', sessionName]);
    await runCheckedRemoteCommand(server, createSession, 'tmux session creation');
    return sessionName;
  }
  throw new Error(`tmux session check failed with exit code ${existing.code}`);
}

export async function createCliWindow(server, { cliType, launchCommand, sessionName = 'webtmux', workspacePath }) {
  await ensureWebTmuxSession(server, sessionName);
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
  const created = await runCheckedRemoteCommand(server, createWindow, 'tmux window creation');
  const pane = parseCreatedPaneRow(created.stdout.trim());
  await sendKeys(server, pane.paneId, [buildWorkspaceNavigationCommand(server, workspacePath)]);
  await sendKeys(server, pane.paneId, ['Enter']);
  await sendKeys(server, pane.paneId, [launchCommand]);
  await sendKeys(server, pane.paneId, ['Enter']);
  return { ...pane, workspacePath };
}

export async function sendKeys(server, target, keys) {
  const command = buildRemoteCommand(server, ['send-keys', '-t', target, ...keys]);
  await runCheckedRemoteCommand(server, command, 'tmux send-keys');
}
