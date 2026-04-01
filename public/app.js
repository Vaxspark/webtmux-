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

const STORAGE_KEY = 'webtmux.authenticated';
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
  sessionView: 'chat',
  inputValue: '',
  commandOpen: false,
  sessionPoll: null
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

export function shouldOpenCommandPalette(value) {
  return String(value ?? '').trimStart().startsWith('/');
}

export function filterCommands(cliType, query) {
  const search = String(query ?? '').toLowerCase();
  return (COMMANDS[cliType] ?? []).filter((item) => item.command.includes(search));
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
  return state.panes.filter((pane) => {
    if (state.selectedServer !== 'all' && pane.serverId !== state.selectedServer) return false;
    if (state.selectedCli !== 'all' && pane.cliType !== state.selectedCli) return false;
    return true;
  });
}

function serverOptions() {
  return ['all', ...new Set(state.panes.map((pane) => pane.serverId))];
}

function commandPaletteHtml() {
  if (!state.commandOpen || !state.session) return '';
  const commands = filterCommands(state.session.cliType, state.inputValue.toLowerCase());
  if (commands.length === 0) {
    return '<div class="command-palette"><div class="empty">No matching commands</div></div>';
  }

  return `<div class="command-palette">${commands
    .map((item) => `
      <button type="button" data-action="insert-command" data-command="${escapeHtml(item.command)}">
        <strong>${escapeHtml(item.command)}</strong>
        <span>${escapeHtml(item.description)}</span>
      </button>`)
    .join('')}</div>`;
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

function overviewHtml() {
  const panes = visiblePanes();

  return `
    <main class="shell">
      <header class="shell__header">
        <div>
          <span class="badge">Recent activity</span>
          <h1 class="shell__title">WebTmux</h1>
          <p class="shell__subtitle">Switch between tmux-backed Claude Code, Codex CLI, and Copilot CLI sessions without leaving the browser.</p>
        </div>
        <button class="ghost" type="button" data-action="logout">Lock</button>
      </header>
      <section class="filter-bar">
        <input class="field" readonly value="Recent panes update automatically" />
        <select id="server-filter">${serverOptions().map((serverId) => `<option value="${escapeHtml(serverId)}" ${serverId === state.selectedServer ? 'selected' : ''}>${serverId === 'all' ? 'All servers' : escapeHtml(serverId)}</option>`).join('')}</select>
        <select id="cli-filter">
          <option value="all" ${state.selectedCli === 'all' ? 'selected' : ''}>All CLI types</option>
          <option value="claude-code" ${state.selectedCli === 'claude-code' ? 'selected' : ''}>Claude Code</option>
          <option value="codex-cli" ${state.selectedCli === 'codex-cli' ? 'selected' : ''}>Codex CLI</option>
          <option value="copilot-cli" ${state.selectedCli === 'copilot-cli' ? 'selected' : ''}>Copilot CLI</option>
          <option value="unknown" ${state.selectedCli === 'unknown' ? 'selected' : ''}>Unknown</option>
        </select>
      </section>
      ${state.overviewError ? `<div class="panel error">${escapeHtml(state.overviewError)}</div>` : ''}
      ${state.failures.length ? `<div class="panel muted">${state.failures.map((failure) => `Failed to load ${escapeHtml(failure.serverId)}: ${escapeHtml(failure.message)}`).join('<br />')}</div>` : ''}
      ${state.loading ? '<div class="panel empty">Loading sessions¡­</div>' : ''}
      <section class="cards">
        ${panes.length ? panes.map((pane) => `
          <article class="card">
            <div class="card__top">
              <div>
                <h3>${escapeHtml(pane.paneTitle || `${pane.sessionName}/${pane.windowName}/${pane.paneIndex}`)}</h3>
                <div class="card__path">${escapeHtml(`${pane.serverId} ¡¤ ${pane.sessionName}/${pane.windowName}/${pane.paneIndex}`)}</div>
              </div>
              <span class="badge">${escapeHtml(pane.cliType)}</span>
            </div>
            <ul class="preview">${pane.preview.length ? pane.preview.map((line) => `<li>${escapeHtml(line)}</li>`).join('') : '<li class="preview-empty">No preview lines yet</li>'}</ul>
            <div class="session-toolbar">
              <button class="primary" type="button" data-action="open-session" data-pane='${escapeHtml(JSON.stringify(pane))}'>Open session</button>
            </div>
          </article>`).join('') : '<div class="panel empty">No panes matched the current filters. Add servers to config/servers.json and refresh.</div>'}
      </section>
    </main>`;
}

function sessionHtml() {
  if (!state.session) return '';
  return `
    <main class="shell session-layout">
      <header class="shell__header">
        <div>
          <span class="badge">${escapeHtml(state.session.cliType)}</span>
          <h1 class="shell__title">${escapeHtml(state.session.paneTitle || 'Session')}</h1>
          <p class="shell__subtitle">${escapeHtml(`${state.session.serverId} ¡¤ ${state.session.sessionName}/${state.session.windowName}/${state.session.paneIndex}`)}</p>
        </div>
        <div class="session-toolbar">
          <button class="ghost" type="button" data-action="back">Back</button>
          <button class="ghost" type="button" data-action="toggle-view">${state.sessionView === 'chat' ? 'Terminal view' : 'Chat view'}</button>
        </div>
      </header>
      ${state.sessionError ? `<div class="panel error">${escapeHtml(state.sessionError)}</div>` : ''}
      <section class="panel">
        <div class="output ${state.sessionView === 'terminal' ? 'output--terminal' : ''}" id="session-output">
          ${(state.sessionLines.length ? state.sessionLines : ['Waiting for pane output¡­']).map((line) => `<pre>${escapeHtml(line)}</pre>`).join('')}
        </div>
      </section>
    </main>
    <section class="input-dock">
      <textarea id="session-input" placeholder="Send a message or start with / to open command completion">${escapeHtml(state.inputValue)}</textarea>
      <div id="command-palette-slot">${commandPaletteHtml()}</div>
      <div class="input-actions">
        <button class="ghost" type="button" data-action="toggle-commands">/command</button>
        <button class="ghost" type="button" data-action="send-control" data-control="ctrl-c">Ctrl+C</button>
        <button class="ghost" type="button" data-action="send-control" data-control="esc">Esc</button>
        <button class="ghost" type="button" data-action="send-control" data-control="enter">Enter</button>
        <button class="primary" type="button" data-action="send-message">Send</button>
      </div>
    </section>`;
}

function render() {
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML = state.authenticated ? (state.session ? sessionHtml() : overviewHtml()) : loginHtml();
}

function renderSessionOnly() {
  if (!state.session) return;
  const output = document.getElementById('session-output');
  if (!output) {
    render();
    return;
  }
  output.innerHTML = (state.sessionLines.length ? state.sessionLines : ['Waiting for pane output¡­'])
    .map((line) => `<pre>${escapeHtml(line)}</pre>`)
    .join('');
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
    const form = event.target.closest('#login-form');
    if (!form) return;
    event.preventDefault();
    const password = new FormData(form).get('password');
    try {
      await login(String(password ?? ''));
    } catch (error) {
      state.loginError = error.message;
      render();
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.id === 'server-filter') {
      state.selectedServer = event.target.value;
      render();
      return;
    }

    if (event.target.id === 'cli-filter') {
      state.selectedCli = event.target.value;
      render();
    }
  });

  document.addEventListener('input', (event) => {
    if (event.target.id !== 'session-input') return;
    state.inputValue = event.target.value;
    state.commandOpen = shouldOpenCommandPalette(state.inputValue) || state.commandOpen;
    syncCommandPalette();
  });

  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const action = target.getAttribute('data-action');
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
      render();
      return;
    }

    if (action === 'toggle-view') {
      state.sessionView = state.sessionView === 'chat' ? 'terminal' : 'chat';
      render();
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

    if (action === 'send-message') {
      await sendMessage();
      return;
    }

    if (action === 'send-control') {
      await sendControl(target.getAttribute('data-control'));
    }
  });
}

if (typeof document !== 'undefined') {
  attachListeners();
  render();
  if (state.authenticated) {
    loadOverview().catch((error) => {
      state.overviewError = error.message;
      render();
    });
  }
}
