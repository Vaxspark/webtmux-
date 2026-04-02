const COMMANDS = {
  'claude-code': [
    { command: '/help', description: 'Show help and available commands', group: 'session' },
    { command: '/clear', description: 'Clear conversation history and free up context', group: 'session' },
    { command: '/compact', description: 'Compact conversation with optional focus instructions', group: 'session' },
    { command: '/model', description: 'Select or change the AI model', group: 'session' },
    { command: '/cost', description: 'Show token usage statistics', group: 'session' },
    { command: '/status', description: 'Show version, model, account, and connectivity info', group: 'session' },
    { command: '/context', description: 'Visualize current context usage as a colored grid', group: 'session' },
    { command: '/effort', description: 'Set model effort level (low/medium/high/max)', group: 'session' },
    { command: '/fast', description: 'Toggle fast mode on or off', group: 'session' },
    { command: '/resume', description: 'Resume a conversation by ID or name', group: 'navigation' },
    { command: '/branch', description: 'Create a branch of the current conversation', group: 'navigation' },
    { command: '/rewind', description: 'Rewind conversation and/or code to a previous point', group: 'navigation' },
    { command: '/diff', description: 'Open interactive diff viewer for uncommitted changes', group: 'navigation' },
    { command: '/copy', description: 'Copy the last assistant response to clipboard', group: 'navigation' },
    { command: '/export', description: 'Export the current conversation as plain text', group: 'navigation' },
    { command: '/init', description: 'Initialize project with a CLAUDE.md guide', group: 'project' },
    { command: '/memory', description: 'Edit CLAUDE.md memory files', group: 'project' },
    { command: '/config', description: 'Open Settings interface (theme, model, output style)', group: 'project' },
    { command: '/permissions', description: 'View or update tool permissions', group: 'project' },
    { command: '/add-dir', description: 'Add a working directory for file access', group: 'project' },
    { command: '/plan', description: 'Enter plan mode with optional task description', group: 'project' },
    { command: '/mcp', description: 'Manage MCP server connections', group: 'tools' },
    { command: '/doctor', description: 'Diagnose and verify installation and settings', group: 'tools' },
    { command: '/skills', description: 'List available skills', group: 'tools' },
    { command: '/hooks', description: 'View hook configurations for tool events', group: 'tools' },
    { command: '/terminal-setup', description: 'Configure terminal keybindings', group: 'tools' },
    { command: '/plugin', description: 'Manage Claude Code plugins', group: 'tools' },
    { command: '/batch', description: 'Orchestrate large-scale changes across codebase in parallel', group: 'advanced' },
    { command: '/debug', description: 'Enable debug logging and troubleshoot issues', group: 'advanced' },
    { command: '/simplify', description: 'Review changed files for code reuse and quality issues', group: 'advanced' },
    { command: '/loop', description: 'Run a prompt repeatedly on an interval', group: 'advanced' },
    { command: '/security-review', description: 'Analyze pending changes for security vulnerabilities', group: 'advanced' },
    { command: '/pr-comments', description: 'Fetch and display comments from a GitHub PR', group: 'advanced' },
    { command: '/schedule', description: 'Create, update, list, or run Cloud scheduled tasks', group: 'advanced' },
    { command: '/login', description: 'Sign in to your Anthropic account', group: 'account' },
    { command: '/logout', description: 'Sign out from your Anthropic account', group: 'account' },
    { command: '/bug', description: 'Submit feedback about Claude Code', group: 'account' },
    { command: '/vim', description: 'Toggle between Vim and Normal editing modes', group: 'account' },
    { command: '/theme', description: 'Change the color theme', group: 'account' },
    { command: '/usage', description: 'Show plan usage limits and rate limit status', group: 'account' },
    { command: '/release-notes', description: 'View the full changelog', group: 'account' }
  ],
  'codex-cli': [
    { command: '/help', description: 'Show available commands', group: 'session' },
    { command: '/clear', description: 'Clear conversation history', group: 'session' },
    { command: '/compact', description: 'Compact conversation context', group: 'session' },
    { command: '/model', description: 'Change the AI model', group: 'session' },
    { command: '/fast', description: 'Toggle fast mode (1.5x speed, 2x credits)', group: 'session' },
    { command: '/plan', description: 'Enter plan mode to plan before coding', group: 'session' },
    { command: '/diff', description: 'Show pending changes', group: 'code' },
    { command: '/undo', description: 'Undo the last file change', group: 'code' },
    { command: '/approval', description: 'Set approval mode (suggest/auto-edit/full-auto)', group: 'config' },
    { command: '/history', description: 'Show command history', group: 'config' },
    { command: '/skills', description: 'List available skills', group: 'config' },
    { command: '/hooks', description: 'Manage hook configurations', group: 'config' },
    { command: '/mcp', description: 'Manage MCP server connections', group: 'config' },
    { command: '/bug', description: 'Report a bug', group: 'account' }
  ],
  'copilot-cli': [
    { command: '/help', description: 'Show available commands', group: 'session' },
    { command: '/clear', description: 'Clear conversation context', group: 'session' },
    { command: '/compact', description: 'Manually compress conversation context', group: 'session' },
    { command: '/model', description: 'Select or change the AI model', group: 'session' },
    { command: '/context', description: 'Show detailed token usage breakdown', group: 'session' },
    { command: '/plan', description: 'Enter plan mode for structured implementation', group: 'session' },
    { command: '/mcp', description: 'Manage MCP server connections', group: 'tools' },
    { command: '/allow-all', description: 'Allow all tools without manual approval', group: 'tools' },
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

const CLI_MODES = {
  'claude-code': [
    { label: 'Plan', command: '/plan', description: 'Plan before coding' },
    { label: 'Fast', command: '/fast', description: 'Toggle fast mode' },
    { label: 'Max Effort', command: '/effort max', description: 'Maximum effort' },
  ],
  'codex-cli': [
    { label: 'Suggest', command: '/approval suggest', description: 'Suggest changes only' },
    { label: 'Auto-edit', command: '/approval auto-edit', description: 'Auto-edit files' },
    { label: 'Full-auto', command: '/approval full-auto', description: 'Fully automatic' },
  ],
  'copilot-cli': [
    { label: 'Autopilot', command: '/allow-all', description: 'Auto-approve all tools' },
  ],
};

const STORAGE_KEY = 'webtmux.authenticated';
const HIDDEN_KEY = 'webtmux.hidden_panes';
const NAMES_KEY = 'webtmux.custom_names';
const state = {
  authenticated: readAuth(),
  panes: [],
  failures: [],
  loading: false,
  loginError: '',
  overviewError: '',
  sessionError: '',
  selectedServer: 'all',
  selectedCli: 'all',
  session: null,
  sessionLines: [],
  inputValue: '',
  commandOpen: false,
  sessionPoll: null,
  view: 'overview',       // 'overview' | 'session' | 'settings'
  servers: [],
  serverFormError: '',
  showHidden: false,
  sidebarOpen: false,
  createCli: {
    open: false,
    selectedServer: '',
    selectedCli: 'codex-cli',
    workspacePath: '',
    directories: [],
    parentPath: '',
    loading: false,
    error: '',
    launchCommand: 'codex',
    creating: false
  }
};

let listenersAttached = false;

function readAuth() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeAuth(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  } catch {
    // ignore storage failures
  }
}

function readHiddenPanes() {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeHiddenPanes(list) {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function hidePaneId(key) {
  const list = readHiddenPanes();
  if (!list.includes(key)) {
    list.push(key);
    writeHiddenPanes(list);
  }
}

function unhidePaneId(key) {
  writeHiddenPanes(readHiddenPanes().filter((k) => k !== key));
}

function readCustomNames() {
  try {
    return JSON.parse(localStorage.getItem(NAMES_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeCustomName(key, name) {
  try {
    const names = readCustomNames();
    if (name) {
      names[key] = name;
    } else {
      delete names[key];
    }
    localStorage.setItem(NAMES_KEY, JSON.stringify(names));
  } catch {
    // ignore
  }
}

function getPaneName(pane) {
  const names = readCustomNames();
  const key = paneKey(pane);
  return names[key] || pane.paneTitle || pane.sessionName;
}

function paneKey(pane) {
  return `${pane.serverId}/${pane.paneId}`;
}

async function loadServers() {
  try {
    const payload = await api('/api/servers');
    state.servers = payload.servers ?? [];
  } catch {
    state.servers = [];
  }
}

export function getDefaultLaunchCommand(cliType) {
  if (cliType === 'claude-code') return 'claude-code';
  if (cliType === 'copilot-cli') return 'github-copilot-cli';
  return 'codex';
}

const CREATE_CLI_FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function createCliDialogFocusableElements(dialog) {
  if (!dialog?.querySelectorAll) return [];
  return Array.from(dialog.querySelectorAll(CREATE_CLI_FOCUSABLE_SELECTOR)).filter((element) => !element.disabled && (typeof element.getAttribute !== 'function' || element.getAttribute('aria-hidden') !== 'true'));
}

export function focusCreateCliDialog(dialog = typeof document !== 'undefined' ? document.querySelector('[data-create-cli-dialog]') : null) {
  const first = createCliDialogFocusableElements(dialog).find((element) => typeof element.focus === 'function');
  first?.focus?.();
  return first ?? null;
}

export function handleCreateCliDialogKeydown(event, dialog = typeof document !== 'undefined' ? document.querySelector('[data-create-cli-dialog]') : null, activeElement = dialog?.ownerDocument?.activeElement ?? (typeof document !== 'undefined' ? document.activeElement : null)) {
  if (!event || !dialog) return false;

  if (event.key === 'Escape') {
    event.preventDefault();
    return 'close';
  }

  if (event.key !== 'Tab') return false;

  const focusables = createCliDialogFocusableElements(dialog);
  if (focusables.length === 0) return false;

  event.preventDefault();
  const currentIndex = focusables.indexOf(activeElement);
  const nextIndex = event.shiftKey
    ? (currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1)
    : (currentIndex < 0 || currentIndex === focusables.length - 1 ? 0 : currentIndex + 1);
  focusables[nextIndex]?.focus?.();
  return 'tab';
}

function closeCreateCliDialog() {
  state.createCli.open = false;
  state.createCli.error = '';
  state.createCli.creating = false;
  state.createCli.loading = false;
  render();
}
async function browseRemoteDirectory(path = '') {
  if (!state.createCli.selectedServer) return;

  state.createCli.loading = true;
  state.createCli.error = '';
  render();

  try {
    const query = path ? `?path=${encodeURIComponent(path)}` : '';
    const payload = await api(`/api/servers/${encodeURIComponent(state.createCli.selectedServer)}/fs${query}`);
    state.createCli.workspacePath = payload.path ?? path ?? state.createCli.workspacePath;
    state.createCli.parentPath = payload.parentPath ?? '';
    state.createCli.directories = payload.directories ?? [];
  } catch (error) {
    state.createCli.error = error.message;
  } finally {
    state.createCli.loading = false;
    render();
  }
}

async function submitCreateCli() {
  if (!state.createCli.selectedServer || !state.createCli.workspacePath) return;

  state.createCli.creating = true;
  state.createCli.error = '';
  render();

  try {
    const created = await api('/api/session/create', {
      method: 'POST',
      body: JSON.stringify({
        serverId: state.createCli.selectedServer,
        cliType: state.createCli.selectedCli,
        workspacePath: state.createCli.workspacePath,
        launchCommand: state.createCli.launchCommand
      })
    });
    state.createCli.open = false;
    state.createCli.creating = false;
    state.createCli.loading = false;
    state.createCli.error = '';
    await loadOverview();
    await loadSession(created);
  } catch (error) {
    state.createCli.error = error.message;
    state.createCli.creating = false;
    render();
  }
}
export function shouldOpenCommandPalette(value) {
  return String(value ?? '').trimStart().startsWith('/');
}

export function filterCommands(cliType, query) {
  const search = String(query ?? '').toLowerCase();
  const list = COMMANDS[cliType] ?? allCommandsMerged();
  return list.filter((item) => item.command.includes(search) || item.description.toLowerCase().includes(search));
}

function allCommandsMerged() {
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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    },
    credentials: 'same-origin',
    ...options
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message ?? `Request failed: ${response.status}`);
  }

  return payload;
}

async function login(password) {
  await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password })
  });

  state.authenticated = true;
  state.loginError = '';
  writeAuth(true);
  await loadOverview();
}

async function loadOverview() {
  state.loading = true;
  state.overviewError = '';
  render();

  try {
    const payload = await api('/api/overview');
    state.panes = [...(payload.panes ?? [])].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    state.failures = payload.failures ?? [];
  } catch (error) {
    state.overviewError = error.message;
  } finally {
    state.loading = false;
    render();
  }
}

async function refreshSession() {
  if (!state.session) return;

  try {
    const payload = await api(`/api/session/${encodeURIComponent(state.session.serverId)}/${encodeURIComponent(state.session.paneId)}`);
    state.sessionLines = payload.lines ?? [];
    renderSessionOnly();
  } catch (error) {
    state.sessionError = error.message;
    render();
  }
}

async function loadSession(session) {
  state.session = session;
  state.sessionError = '';
  state.inputValue = '';
  state.commandOpen = false;
  render();
  await refreshSession();
  scheduleSessionPoll();
}

function scheduleSessionPoll() {
  clearSessionPoll();
  if (!state.session) return;

  state.sessionPoll = setInterval(() => {
    refreshSession().catch(() => {
      // foreground flow already handles visible errors
    });
  }, 3000);
}

function clearSessionPoll() {
  if (state.sessionPoll) {
    clearInterval(state.sessionPoll);
    state.sessionPoll = null;
  }
}

async function postSessionInput(payload) {
  if (!state.session) return;
  await api('/api/session/input', {
    method: 'POST',
    body: JSON.stringify({
      serverId: state.session.serverId,
      target: state.session.paneId,
      ...payload
    })
  });
}

async function sendMessage() {
  const value = state.inputValue.trim();
  if (!value || !state.session) return;

  try {
    await postSessionInput({ text: state.inputValue });
    await postSessionInput({ control: 'enter' });
    state.inputValue = '';
    state.commandOpen = false;
    render();
    await refreshSession();
  } catch (error) {
    state.sessionError = error.message;
    render();
  }
}

async function sendControl(control) {
  if (!state.session) return;

  try {
    await postSessionInput({ control });
    await refreshSession();
  } catch (error) {
    state.sessionError = error.message;
    render();
  }
}

function visiblePanes() {
  const hidden = readHiddenPanes();
  return state.panes.filter((pane) => {
    if (!state.showHidden && hidden.includes(paneKey(pane))) return false;
    if (state.selectedServer !== 'all' && pane.serverId !== state.selectedServer) return false;
    if (state.selectedCli !== 'all' && pane.cliType !== state.selectedCli) return false;
    return true;
  });
}

function serverOptions() {
  return ['all', ...new Set(state.panes.map((pane) => pane.serverId))];
}

function pencilIconSvg() {
  return `
    <svg class="icon-pencil" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M10.54 2.54a1.5 1.5 0 1 1 2.12 2.12l-7.03 7.03-2.92.8.8-2.92 7.03-7.03Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25"></path>
      <path d="m9.5 3.5 3 3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25"></path>
    </svg>`;
}

function renamePaneButtonHtml({ className = '', currentName, key, title = 'Rename session' }) {
  const classes = ['icon-button'];
  if (className) classes.push(className);
  const label = escapeHtml(title);
  return `<button class="${classes.join(' ')}" type="button" data-action="rename-pane" data-pane-key="${escapeHtml(key)}" data-current-name="${escapeHtml(currentName)}" title="${label}" aria-label="${label}">${pencilIconSvg()}</button>`;
}

export function renderOverviewFilterBar({ hiddenCount, selectedCli, selectedServer, serverIds, showHidden }) {
  return `
    <section class="filter-bar">
      <select id="server-filter" class="field filter-control">${serverIds.map((serverId) => `<option value="${escapeHtml(serverId)}" ${serverId === selectedServer ? 'selected' : ''}>${serverId === 'all' ? 'All servers' : escapeHtml(serverId)}</option>`).join('')}</select>
      <select id="cli-filter" class="field filter-control">
        <option value="all" ${selectedCli === 'all' ? 'selected' : ''}>All CLIs</option>
        <option value="claude-code" ${selectedCli === 'claude-code' ? 'selected' : ''}>Claude Code</option>
        <option value="codex-cli" ${selectedCli === 'codex-cli' ? 'selected' : ''}>Codex CLI</option>
        <option value="copilot-cli" ${selectedCli === 'copilot-cli' ? 'selected' : ''}>Copilot CLI</option>
        <option value="unknown" ${selectedCli === 'unknown' ? 'selected' : ''}>Unknown</option>
      </select>
      ${hiddenCount > 0 ? `<button class="filter-control" type="button" data-action="toggle-hidden">${showHidden ? 'Hide hidden (' + hiddenCount + ')' : 'Show hidden (' + hiddenCount + ')'}</button>` : ''}
      <button class="btn-primary" type="button" data-action="open-create-cli">New CLI</button>
    </section>`;
}

export function renderOverviewPaneCard(pane, { isHidden = false } = {}) {
  const key = paneKey(pane);
  const displayName = getPaneName(pane);
  const preview = pane.preview ?? [];
  return `
    <article class="card ${isHidden ? 'card--hidden' : ''}">
      <div class="card__top">
        <div class="card__main">
          <div class="card__title-row">
            <h3>${escapeHtml(displayName)}</h3>
            ${renamePaneButtonHtml({ className: 'card__rename-btn', currentName: displayName, key, title: `Rename ${displayName}` })}
          </div>
          <div class="card__path">${escapeHtml(pane.serverId)} &rsaquo; ${escapeHtml(`${pane.sessionName}/${pane.windowName}/${pane.paneIndex}`)}</div>
        </div>
        <span class="tag">${escapeHtml(pane.cliType)}</span>
      </div>
      <ul class="preview">${preview.length ? preview.map((line) => `<li>${escapeHtml(line)}</li>`).join('') : '<li class="preview-empty">No preview</li>'}</ul>
      <div class="session-toolbar">
        <button class="btn-primary" type="button" data-action="open-session" data-pane='${escapeHtml(JSON.stringify(pane))}'>Open</button>
        ${isHidden
          ? `<button class="btn-ghost" type="button" data-action="unhide-pane" data-pane-key="${escapeHtml(key)}">Restore</button>`
          : `<button class="btn-ghost" type="button" data-action="hide-pane" data-pane-key="${escapeHtml(key)}">Hide</button>`}
      </div>
    </article>`;
}

export function renderDirectoryBrowser({ currentPath, parentPath = '', directories = [], error = '', loading = false }) {
  return `
    <section class="cli-browser">
      <div class="cli-browser__header">
        <div class="cli-browser__path">${escapeHtml(currentPath || 'Select a workspace directory')}</div>
        ${parentPath ? `<button class="btn-ghost cli-browser__up" type="button" data-action="browse-directory" data-path="${escapeHtml(parentPath)}">Up</button>` : ''}
      </div>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
      ${loading ? '<div class="panel empty">Loading directories...</div>' : ''}
      <div class="cli-browser__list">
        ${directories.length ? directories.map((entry) => `<button class="cli-browser__row" type="button" data-action="browse-directory" data-path="${escapeHtml(entry.path)}"><span class="cli-browser__row-name">${escapeHtml(entry.name)}</span><span class="cli-browser__row-path">${escapeHtml(entry.path)}</span></button>`).join('') : '<div class="panel empty">No subdirectories found.</div>'}
      </div>
    </section>`;
}

export function renderCreateCliDialog({ createCli, servers }) {
  if (!createCli?.open) return '';
  const serverOptions = servers.length ? servers : [{ id: '', name: 'No servers available' }];

  return `
    <div class="modal-backdrop" data-action="close-create-cli"></div>
    <div class="modal" data-create-cli-dialog role="dialog" aria-modal="true" aria-labelledby="create-cli-title">
      <div class="modal__header">
        <div>
          <h2 id="create-cli-title">New CLI</h2>
          <p class="modal__subtitle">Choose a server, workspace, and launch command.</p>
        </div>
        <button class="icon-button" type="button" data-action="close-create-cli" aria-label="Close">Close</button>
      </div>
      <div class="modal__body stack">
        <label class="stack">
          <span class="muted">Server</span>
          <select id="create-cli-server" class="field" ${servers.length ? '' : 'disabled'}>
            ${serverOptions.map((server) => `<option value="${escapeHtml(server.id)}" ${server.id === createCli.selectedServer ? 'selected' : ''}>${escapeHtml(server.name || server.id || 'No servers available')}</option>`).join('')}
          </select>
        </label>
        <label class="stack">
          <span class="muted">CLI type</span>
          <select id="create-cli-type" class="field">
            <option value="claude-code" ${createCli.selectedCli === 'claude-code' ? 'selected' : ''}>Claude Code</option>
            <option value="codex-cli" ${createCli.selectedCli === 'codex-cli' ? 'selected' : ''}>Codex CLI</option>
            <option value="copilot-cli" ${createCli.selectedCli === 'copilot-cli' ? 'selected' : ''}>Copilot CLI</option>
          </select>
        </label>
        ${renderDirectoryBrowser({
          currentPath: createCli.workspacePath,
          parentPath: createCli.parentPath,
          directories: createCli.directories,
          error: createCli.error,
          loading: createCli.loading
        })}
        <label class="stack">
          <span class="muted">Launch command</span>
          <textarea id="create-cli-command" rows="2" class="field" placeholder="Launch command">${escapeHtml(createCli.launchCommand)}</textarea>
        </label>
        <div class="session-toolbar">
          <button class="btn-primary" type="button" data-action="submit-create-cli" ${createCli.creating || createCli.loading || !createCli.selectedServer || !createCli.workspacePath ? 'disabled' : ''}>${createCli.creating ? 'Creating...' : 'Create CLI'}</button>
        </div>
      </div>
    </div>`;
}

// Detect interactive menu items in output lines
// Matches patterns like: "> 1. Option text", "  2. Option text"
const MENU_ITEM_RE = /^(\s*[\u203a>]?\s*)(\d+)\.\s+(.+)$/;

function detectMenuItems(lines) {
  const items = [];
  let foundMenu = false;
  for (let i = lines.length - 1; i >= 0 && i >= lines.length - 30; i--) {
    const match = lines[i].match(MENU_ITEM_RE);
    if (match) {
      const isSelected = lines[i].includes('\u203a') || lines[i].includes('>');
      items.unshift({ index: i, number: parseInt(match[2], 10), label: match[3].trim(), selected: isSelected });
      foundMenu = true;
    } else if (foundMenu && items.length > 0) {
      // Stop when we hit a non-menu line after finding items
      break;
    }
  }
  return items.length >= 2 ? items : [];
}

function renderOutputHtml(lines) {
  if (!lines.length) {
    return '<pre class="output__terminal-block">Waiting for pane output\u2026</pre>';
  }
  return `<pre class="output__terminal-block">${lines.map(escapeHtml).join('\n')}</pre>`;
}

function renderMenuActionsHtml(lines) {
  const menuItems = detectMenuItems(lines);
  if (menuItems.length === 0) return '';
  return '<div class="menu-actions">' +
    menuItems.map((item) =>
      `<button class="menu-chip ${item.selected ? 'menu-chip--selected' : ''}" data-action="select-menu-item" data-number="${item.number}">
        <span class="menu-chip__num">${item.number}</span>
        <span class="menu-chip__label">${escapeHtml(item.label)}</span>
      </button>`
    ).join('') + '</div>';
}

function commandPaletteHtml() {
  if (!state.commandOpen || !state.session) return '';
  const commands = filterCommands(state.session.cliType, state.inputValue.toLowerCase());
  if (commands.length === 0) {
    return '<div class="command-palette"><div class="empty">No matching commands</div></div>';
  }

  // Group commands by category
  const groups = new Map();
  for (const item of commands) {
    const group = item.group || 'other';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(item);
  }

  let html = '<div class="command-palette">';
  for (const [group, items] of groups) {
    const label = GROUP_LABELS[group] || group;
    html += `<div class="command-group"><div class="command-group__label">${escapeHtml(label)}</div>`;
    html += items.map((item) => `
      <div class="command-row">
        <button type="button" class="command-row__insert" data-action="insert-command" data-command="${escapeHtml(item.command)}">
          <strong>${escapeHtml(item.command)}</strong>
          <span>${escapeHtml(item.description)}</span>
        </button>
        <button type="button" class="command-row__send" data-action="send-command" data-command="${escapeHtml(item.command)}" title="Send now">\u23CE</button>
      </div>`).join('');
    html += '</div>';
  }
  html += '</div>';

  return html;
}

function loginHtml() {
  return `
    <div class="auth-layout">
      <form class="auth-card stack" id="login-form">
        <span class="badge">Single user</span>
        <h1>WebTmux</h1>
        <p>Resume Claude Code, Codex CLI, and Copilot CLI sessions from any phone or desktop browser.</p>
        <input class="field" type="password" name="password" placeholder="Site password" autocomplete="current-password" />
        ${state.loginError ? `<div class="error">${escapeHtml(state.loginError)}</div>` : ''}
        <button class="primary" type="submit">Unlock workspace</button>
      </form>
    </div>`;
}

function sidebarHtml() {
  const allPanes = visiblePanes();
  return `
    <nav class="sidebar ${state.sidebarOpen ? 'sidebar--open' : ''}">
      <div class="sidebar__header">
        <h2>WebTmux</h2>
        <button class="btn-icon mobile-only" type="button" data-action="close-sidebar">\u2715</button>
      </div>
      <div class="sidebar__menu">
        <button class="nav-item ${state.view === 'overview' && !state.session ? 'nav-item--active' : ''}" type="button" data-action="nav-overview">
          <span class="icon">\u229E</span> Overview
        </button>
        <div class="nav-section">SESSIONS</div>
        ${allPanes.map((p) => {
          const isActive = state.session && state.session.paneId === p.paneId && state.session.serverId === p.serverId;
          const key = paneKey(p);
          const displayName = getPaneName(p);
          return `
            <div class="nav-session-row ${isActive ? 'nav-session-row--active' : ''}">
              <button class="nav-item nav-item--session" type="button" data-action="open-session" data-pane='${escapeHtml(JSON.stringify(p))}'>
                <span class="icon">\uD83D\uDDE8</span>
                <span class="nav-item__label">${escapeHtml(displayName)}</span>
              </button>
              ${renamePaneButtonHtml({ className: 'nav-rename-btn', currentName: displayName, key, title: `Rename ${displayName}` })}
            </div>
          `;
        }).join('')}
      </div>
      <div class="sidebar__footer">
        <button class="nav-item ${state.view === 'settings' ? 'nav-item--active' : ''}" type="button" data-action="open-settings">
          <span class="icon">\u2699</span> Settings
        </button>
        <button class="nav-item" type="button" data-action="logout">
          <span class="icon">\uD83D\uDD12</span> Lock
        </button>
      </div>
    </nav>
    ${state.sidebarOpen ? `<div class="sidebar-backdrop" data-action="close-sidebar"></div>` : ''}
  `;
}
function layoutHtml(contentHtml, title, subtitle = '') {
  return `
    <div class="app-layout">
      ${sidebarHtml()}
      <div class="main-content">
        <header class="main-header">
          <button class="btn-icon mobile-only block" type="button" data-action="open-sidebar">\u2630</button>
          <div class="main-header__titles">
            <h1 class="main-title">${escapeHtml(title)}</h1>
            ${subtitle ? `<p class="sub-title">${escapeHtml(subtitle)}</p>` : ''}
          </div>
        </header>
        <div class="view-content">
          ${contentHtml}
        </div>
      </div>
    </div>
  `;
}

function overviewHtml() {
  const panes = visiblePanes();
  const hidden = readHiddenPanes();
  const hiddenCount = state.panes.filter((pane) => hidden.includes(paneKey(pane))).length;

  const content = `
    <div class="scroll-container">
      ${renderOverviewFilterBar({
        hiddenCount,
        selectedCli: state.selectedCli,
        selectedServer: state.selectedServer,
        serverIds: serverOptions(),
        showHidden: state.showHidden
      })}
      ${state.overviewError ? `<div class="panel error">${escapeHtml(state.overviewError)}</div>` : ''}
      ${state.failures.length ? `<div class="panel muted">${state.failures.map((failure) => `Failed to load ${escapeHtml(failure.serverId)}: ${escapeHtml(failure.message)}`).join('<br />')}</div>` : ''}
      ${state.loading ? '<div class="panel empty">Loading sessions\u2026</div>' : ''}
      <section class="cards">
        ${panes.length
          ? panes.map((pane) => renderOverviewPaneCard(pane, { isHidden: hidden.includes(paneKey(pane)) })).join('')
          : '<div class="panel empty">No panes matched the current filters.</div>'}
      </section>
    </div>
    ${renderCreateCliDialog({ createCli: state.createCli, servers: state.servers })}
  `;

  return layoutHtml(content, 'Overview', 'All active sessions');
}
function settingsHtml() {
  const content = `
    <div class="scroll-container">
      <section class="panel settings-guide">
        <h2>How to add a server</h2>
        <ol class="guide-list">
          <li><strong>SSH Agent</strong> &mdash; Set <em>Auth Strategy</em> to <code>agent</code>. Make sure <code>ssh-agent</code> is running on the machine hosting this app and has your key loaded (<code>ssh-add ~/.ssh/id_rsa</code>).</li>
          <li><strong>Private Key</strong> &mdash; Set <em>Auth Strategy</em> to <code>private-key</code> and fill in the <em>Private Key Path</em> on this server (e.g. <code>/home/user/.ssh/id_rsa</code>).</li>
          <li><strong>Password</strong> &mdash; Set <em>Auth Strategy</em> to <code>password</code> and fill in the <em>SSH Password</em> field.</li>
          <li><strong>Tmux User</strong> &mdash; Optional. If you connect as <code>root</code> but need another user&rsquo;s tmux sessions, fill in <em>Tmux User</em> (runs <code>sudo -u &lt;user&gt; tmux</code>).</li>
          <li><strong>Server ID</strong> &mdash; A short unique key with no spaces (used internally). <em>Display Name</em> is shown in the UI.</li>
        </ol>
      </section>
      ${state.serverFormError ? `<div class="panel error">${escapeHtml(state.serverFormError)}</div>` : ''}
      <section class="panel">
        <h2>Add Server</h2>
        <form class="server-form stack" id="add-server-form">
          <div class="form-row">
            <input class="field" name="id" placeholder="Server ID (e.g. my-server)" required />
            <input class="field" name="name" placeholder="Display Name" required />
          </div>
          <div class="form-row">
            <input class="field" name="host" placeholder="Host / IP" required />
            <input class="field" name="port" type="number" placeholder="SSH Port" value="22" required />
          </div>
          <div class="form-row">
            <input class="field" name="username" placeholder="SSH Username" required />
            <select class="field" name="authStrategy" required>
              <option value="agent">SSH Agent</option>
              <option value="private-key">Private Key</option>
              <option value="password">Password</option>
            </select>
          </div>
          <div class="form-row">
            <select class="field" name="platform" required>
              <option value="ubuntu">Linux / Ubuntu</option>
              <option value="windows">Windows</option>
            </select>
            <input class="field" name="tmuxUser" placeholder="Tmux User (optional, defaults to SSH user)" />
          </div>
          <div class="form-row">
            <input class="field" name="privateKeyPath" placeholder="Private Key Path (for private-key auth)" />
            <input class="field" name="password" type="password" placeholder="SSH Password (for password auth)" />
          </div>
          <button class="btn-primary" type="submit">Add Server</button>
        </form>
      </section>
      <section class="cards">
        ${state.servers.length ? state.servers.map((srv) => `
          <article class="card">
            <div class="card__top">
              <div>
                <h3>${escapeHtml(srv.name)}</h3>
                <div class="card__path">${escapeHtml(srv.id)} &mdash; ${escapeHtml(srv.host)}:${srv.port} (${escapeHtml(srv.username)}${srv.tmuxUser ? ' \u2192 tmux:' + escapeHtml(srv.tmuxUser) : ''})</div>
              </div>
              <span class="tag">${escapeHtml(srv.platform)}</span>
            </div>
            <div class="session-toolbar">
              <span class="muted">${escapeHtml(srv.authStrategy)}</span>
              <button class="btn-danger" type="button" data-action="delete-server" data-server-id="${escapeHtml(srv.id)}">Delete</button>
            </div>
          </article>`).join('') : '<div class="panel empty">No servers configured. Add one above.</div>'}
      </section>
    </div>
  `;
  return layoutHtml(content, 'Settings', 'Manage SSH connections');
}

function modeBarHtml() {
  if (!state.session) return '';
  const modes = CLI_MODES[state.session.cliType];
  if (!modes || modes.length === 0) return '';
  return `<div class="mode-bar">${modes.map((m) =>
    `<button class="mode-chip" data-action="mode-command" data-command="${escapeHtml(m.command)}" title="${escapeHtml(m.description)}">${escapeHtml(m.label)}</button>`
  ).join('')}</div>`;
}

function sessionHtml() {
  if (!state.session) return '';
  const cliOptions = ['claude-code', 'codex-cli', 'copilot-cli', 'unknown'];
  const content = `
    <div class="session-layout">
      ${modeBarHtml()}
      ${state.sessionError ? `<div class="panel error">${escapeHtml(state.sessionError)}</div>` : ''}
      <section class="panel output-panel">
        <div class="output output--terminal" id="session-output">
          ${renderOutputHtml(state.sessionLines)}
        </div>
      </section>
      
      <section class="input-dock">
        <div class="input-actions-row">
          <div id="menu-actions-slot">${renderMenuActionsHtml(state.sessionLines)}</div>
          <select id="cli-type-override" class="badge badge--select">${cliOptions.map((opt) => `<option value="${escapeHtml(opt)}" ${opt === state.session.cliType ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}</select>
        </div>
        <textarea id="session-input" rows="2" placeholder="Message or /command &#x2014; Enter to send">${escapeHtml(state.inputValue)}</textarea>
        <div id="command-palette-slot">${commandPaletteHtml()}</div>
        <div class="input-actions">
          <button class="btn-ghost" type="button" data-action="toggle-commands">/cmd</button>
          <button class="btn-ghost" type="button" data-action="send-control" data-control="ctrl-c">Ctrl+C</button>
          <button class="btn-ghost" type="button" data-action="send-control" data-control="esc">Esc</button>
          <button class="btn-ghost btn-ghost--arrow" type="button" data-action="send-control" data-control="up">\u2191</button>
          <button class="btn-ghost btn-ghost--arrow" type="button" data-action="send-control" data-control="down">\u2193</button>
          <button class="btn-ghost" type="button" data-action="send-control" data-control="tab">Tab</button>
          <button class="btn-ghost" type="button" data-action="send-control" data-control="enter">\u23CE</button>
        </div>
      </section>
    </div>`;

  const breadcrumbs = `${escapeHtml(state.session.serverId)} &rsaquo; ${escapeHtml(`${state.session.sessionName}/${state.session.windowName}/${state.session.paneIndex}`)}`;
  return layoutHtml(content, state.session.paneTitle || 'Session', breadcrumbs);
}

function render() {
  const root = document.getElementById('app');
  if (!root) return;
  if (!state.authenticated) {
    root.innerHTML = loginHtml();
    return;
  }
  if (state.view === 'settings') {
    root.innerHTML = settingsHtml();
    return;
  }
  if (state.session) {
    root.innerHTML = sessionHtml();
    return;
  }
  root.innerHTML = overviewHtml();
}

function renderSessionOnly() {
  if (!state.session) return;
  const output = document.getElementById('session-output');
  if (!output) {
    render();
    return;
  }
  output.innerHTML = renderOutputHtml(state.sessionLines);
  output.scrollTop = output.scrollHeight;
  const menuSlot = document.getElementById('menu-actions-slot');
  if (menuSlot) menuSlot.innerHTML = renderMenuActionsHtml(state.sessionLines);
}

function syncCommandPalette() {
  const slot = document.getElementById('command-palette-slot');
  if (!slot) return;
  slot.innerHTML = commandPaletteHtml();
}

function attachListeners() {
  if (listenersAttached || typeof document === 'undefined') return;
  listenersAttached = true;

  document.addEventListener('submit', async (event) => {
    const loginForm = event.target.closest('#login-form');
    if (loginForm) {
      event.preventDefault();
      const password = new FormData(loginForm).get('password');
      try {
        await login(String(password ?? ''));
      } catch (error) {
        state.loginError = error.message;
        render();
      }
      return;
    }

    const serverForm = event.target.closest('#add-server-form');
    if (serverForm) {
      event.preventDefault();
      const fd = new FormData(serverForm);
      const body = {
        id: fd.get('id'),
        name: fd.get('name'),
        host: fd.get('host'),
        port: parseInt(fd.get('port'), 10) || 22,
        username: fd.get('username'),
        authStrategy: fd.get('authStrategy'),
        platform: fd.get('platform')
      };
      const tmuxUser = fd.get('tmuxUser');
      if (tmuxUser) body.tmuxUser = tmuxUser;
      const privateKeyPath = fd.get('privateKeyPath');
      if (privateKeyPath) body.privateKeyPath = privateKeyPath;
      const sshPassword = fd.get('password');
      if (sshPassword) body.password = sshPassword;

      try {
        await api('/api/servers', { method: 'POST', body: JSON.stringify(body) });
        state.serverFormError = '';
        await loadServers();
        render();
      } catch (error) {
        state.serverFormError = error.message;
        render();
      }
    }
  });

  document.addEventListener('change', async (event) => {
    if (event.target.id === 'create-cli-server') {
      state.createCli.selectedServer = event.target.value;
      state.createCli.workspacePath = '';
      state.createCli.directories = [];
      state.createCli.parentPath = '';
      await loadServers();
      await browseRemoteDirectory('', true);
      return;
    }

    if (event.target.id === 'create-cli-type') {
      state.createCli.selectedCli = event.target.value;
      state.createCli.launchCommand = getDefaultLaunchCommand(event.target.value);
      render();
      return;
    }
    if (event.target.id === 'server-filter') {
      state.selectedServer = event.target.value;
      render();
      return;
    }

    if (event.target.id === 'cli-filter') {
      state.selectedCli = event.target.value;
      render();
    }

    if (event.target.id === 'cli-type-override' && state.session) {
      state.session.cliType = event.target.value;
      state.commandOpen = false;
      syncCommandPalette();
    }
  });

  document.addEventListener('input', (event) => {
    if (event.target.id === 'create-cli-command') {
      state.createCli.launchCommand = event.target.value;
      return;
    }
    if (event.target.id !== 'session-input') return;
    state.inputValue = event.target.value;
    state.commandOpen = shouldOpenCommandPalette(state.inputValue) || state.commandOpen;
    syncCommandPalette();
  });

  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const action = target.getAttribute('data-action');
    if (action === 'open-create-cli') {
      state.createCli.open = true;
      state.createCli.selectedServer = '';
      state.createCli.selectedCli = 'codex-cli';
      state.createCli.workspacePath = '';
      state.createCli.directories = [];
      state.createCli.parentPath = '';
      state.createCli.loading = false;
      state.createCli.error = '';
      state.createCli.launchCommand = getDefaultLaunchCommand('codex-cli');
      state.createCli.creating = false;
      render();
      await loadServers();
      state.createCli.selectedServer = state.servers[0]?.id ?? '';
      render();
      if (state.createCli.selectedServer) {
        await browseRemoteDirectory('');
      }
      focusCreateCliDialog();
      return;
    }
    if (action === 'close-create-cli') {
      closeCreateCliDialog();
      return;
    }

    if (action === 'browse-directory') {
      await browseRemoteDirectory(target.getAttribute('data-path') ?? '');
      return;
    }

    if (action === 'submit-create-cli') {
      await submitCreateCli();
      return;
    }
    
    // Sidebar Navigation actions
    if (action === 'nav-overview') {
      clearSessionPoll();
      state.session = null;
      state.sessionLines = [];
      state.view = 'overview';
      state.sidebarOpen = false;
      render();
      return;
    } else if (action === 'nav-settings') {
      state.view = 'settings';
      state.sidebarOpen = false;
      render();
      return;
    } else if (action === 'toggle-sidebar' || action === 'open-sidebar') {
      state.sidebarOpen = !state.sidebarOpen;
      render();
      return;
    } else if (action === 'close-sidebar') {
      state.sidebarOpen = false;
      render();
      return;
    }

    if (action === 'logout') {
      clearSessionPoll();
      state.authenticated = false;
      state.session = null;
      state.inputValue = '';
      writeAuth(false);
      render();
      return;
    }

    if (action === 'open-session') {
      const pane = JSON.parse(target.getAttribute('data-pane'));
      await loadSession(pane);
      return;
    }

    if (action === 'back') {
      clearSessionPoll();
      state.session = null;
      state.sessionLines = [];
      state.view = 'overview';
      render();
      return;
    }

    if (action === 'back-to-overview') {
      state.view = 'overview';
      state.serverFormError = '';
      render();
      await loadOverview();
      return;
    }

    if (action === 'open-settings') {
      state.view = 'settings';
      state.serverFormError = '';
      await loadServers();
      render();
      return;
    }

    if (action === 'hide-pane') {
      hidePaneId(target.getAttribute('data-pane-key'));
      render();
      return;
    }

    if (action === 'unhide-pane') {
      unhidePaneId(target.getAttribute('data-pane-key'));
      render();
      return;
    }

    if (action === 'toggle-hidden') {
      state.showHidden = !state.showHidden;
      render();
      return;
    }

    if (action === 'rename-pane') {
      const key = target.getAttribute('data-pane-key');
      const currentName = target.getAttribute('data-current-name') ?? '';
      const newName = window.prompt('Rename session:', currentName);
      if (newName !== null) {
        writeCustomName(key, newName.trim());
        render();
      }
      return;
    }

    if (action === 'delete-server') {
      const serverId = target.getAttribute('data-server-id');
      try {
        await api(`/api/servers/${encodeURIComponent(serverId)}`, { method: 'DELETE' });
        await loadServers();
        render();
      } catch (error) {
        state.serverFormError = error.message;
        render();
      }
      return;
    }

    if (action === 'toggle-commands') {
      state.commandOpen = !state.commandOpen;
      syncCommandPalette();
      return;
    }

    if (action === 'insert-command') {
      const command = target.getAttribute('data-command') ?? '';
      state.inputValue = command;
      state.commandOpen = false;
      const input = document.getElementById('session-input');
      if (input) {
        input.value = command;
        input.focus();
        input.setSelectionRange(command.length, command.length);
      }
      syncCommandPalette();
      return;
    }

    if (action === 'send-command') {
      const command = target.getAttribute('data-command') ?? '';
      state.inputValue = command;
      state.commandOpen = false;
      syncCommandPalette();
      await sendMessage();
      return;
    }

    if (action === 'send-message') {
      await sendMessage();
      return;
    }

    if (action === 'select-menu-item') {
      // Navigate to the menu item and select it
      const targetNumber = parseInt(target.getAttribute('data-number'), 10);
      const menuItems = detectMenuItems(state.sessionLines);
      const currentSelected = menuItems.find((m) => m.selected);
      const currentIndex = currentSelected ? menuItems.indexOf(currentSelected) : 0;
      const targetIndex = menuItems.findIndex((m) => m.number === targetNumber);
      if (targetIndex < 0) return;

      // Send the right number of up/down arrows to reach the target
      const diff = targetIndex - currentIndex;
      const direction = diff > 0 ? 'down' : 'up';
      const steps = Math.abs(diff);
      for (let i = 0; i < steps; i++) {
        await sendControl(direction);
      }
      // Then press Enter to confirm
      await sendControl('enter');
      return;
    }

    if (action === 'send-control') {
      await sendControl(target.getAttribute('data-control'));
    }

    if (action === 'mode-command') {
      const command = target.getAttribute('data-command') ?? '';
      state.inputValue = command;
      state.commandOpen = false;
      syncCommandPalette();
      await sendMessage();
    }
  });
  document.addEventListener('keydown', async (event) => {
    if (state.createCli.open) {
      const dialog = document.querySelector('[data-create-cli-dialog]');
      const handled = handleCreateCliDialogKeydown(event, dialog);
      if (handled === 'close') {
        closeCreateCliDialog();
      }
      if (handled) return;
    }

    if (event.target.id !== 'session-input') return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await sendMessage();
    }
  });
  if (state.authenticated) {
    loadOverview().catch((error) => {
      state.overviewError = error.message;
      render();
    });
  }
}




