# WebTmux MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-user WebTmux MVP that connects to registered Ubuntu and Windows SSH targets, discovers existing tmux panes, and lets the user continue Claude Code, Codex CLI, and Copilot CLI conversations from a mobile-friendly web UI.

**Architecture:** Implement a single TypeScript codebase with a Fastify backend and a Vite React frontend. The backend owns password auth, server registry loading, SSH execution, platform-aware tmux command construction, pane overview aggregation, and session input forwarding. The frontend is a mobile-first SPA with login, overview, session view toggle, and a static `/command` palette for the three supported CLIs.

**Tech Stack:** Node.js 22, npm, TypeScript, Fastify, `@fastify/cookie`, `@fastify/jwt`, `@fastify/websocket`, `ssh2`, React, React Router, Vite, Vitest, React Testing Library

---

## File Map

- Root: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`, `.gitignore`, `.env.example`, `README.md`
- Shared: `src/shared/types.ts`, `src/shared/cli-commands.ts`, `src/shared/cli-detection.ts`
- Backend: `src/server/index.ts`, `src/server/app.ts`, `src/server/config.ts`, `src/server/auth.ts`, `src/server/routes/auth-routes.ts`, `src/server/routes/overview-routes.ts`, `src/server/routes/session-routes.ts`, `src/server/services/server-registry.ts`, `src/server/services/remote-platform.ts`, `src/server/services/ssh-client.ts`, `src/server/services/tmux-gateway.ts`, `src/server/services/session-stream.ts`
- Frontend: `src/web/main.tsx`, `src/web/App.tsx`, `src/web/styles.css`, `src/web/lib/api.ts`, `src/web/lib/auth-store.ts`, `src/web/components/command-palette.tsx`, `src/web/components/output-panel.tsx`, `src/web/components/session-input.tsx`, `src/web/pages/login-page.tsx`, `src/web/pages/overview-page.tsx`, `src/web/pages/session-page.tsx`
- Tests: `tests/shared/cli-detection.test.ts`, `tests/server/server-registry.test.ts`, `tests/server/remote-platform.test.ts`, `tests/server/tmux-gateway.test.ts`, `tests/server/app.test.ts`, `tests/web/setup.ts`, `tests/web/overview-page.test.tsx`, `tests/web/command-palette.test.tsx`, `tests/web/session-input.test.tsx`

### Task 1: Bootstrap the repository and toolchain

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/server/index.ts`
- Create: `src/server/app.ts`
- Create: `src/web/main.tsx`
- Create: `src/web/App.tsx`

- [ ] **Step 1: Initialize git and branch**
Run:
```bash
git init -b main
git checkout -b codex/webtmux-mvp
```
Expected:
```text
Initialized empty Git repository
Switched to a new branch 'codex/webtmux-mvp'
```

- [ ] **Step 2: Create the root package manifest**
Write `package.json` with `dev`, `dev:server`, `build`, `test`, and `check` scripts.

- [ ] **Step 3: Install runtime and test dependencies**
Run:
```bash
npm install fastify @fastify/cookie @fastify/jwt @fastify/static @fastify/websocket react react-dom react-router-dom ssh2 zod
npm install -D @testing-library/jest-dom @testing-library/react @testing-library/user-event @types/node @types/react @types/react-dom @vitejs/plugin-react jsdom tsx typescript vite vitest
```
Expected:
```text
added ... packages
found 0 vulnerabilities
```

- [ ] **Step 4: Create TypeScript and entrypoints**
Write minimal `src/server/app.ts`, `src/server/index.ts`, `src/web/main.tsx`, and `src/web/App.tsx` files so the build can start.

- [ ] **Step 5: Run baseline verification**
Run:
```bash
npm run check
npm test
```
Expected:
```text
Found 0 errors
No test files found
```

- [ ] **Step 6: Commit**
```bash
git add .
git commit -m "chore: bootstrap webtmux workspace"
```

### Task 2: Add shared domain types, CLI metadata, and detection

**Files:**
- Create: `src/shared/types.ts`
- Create: `src/shared/cli-commands.ts`
- Create: `src/shared/cli-detection.ts`
- Create: `tests/shared/cli-detection.test.ts`

- [ ] **Step 1: Write the failing shared-domain test**
Write tests that assert Claude detection by process name, Codex detection by pane title, and static Copilot commands.

- [ ] **Step 2: Run the test to verify it fails**
Run:
```bash
npm test -- tests/shared/cli-detection.test.ts
```
Expected:
```text
FAIL  tests/shared/cli-detection.test.ts
```

- [ ] **Step 3: Write minimal shared implementation**
Create:
```ts
export type CliType = 'claude-code' | 'codex-cli' | 'copilot-cli' | 'unknown';
export type RemotePlatform = 'ubuntu' | 'windows';
```
And implement `getCliCommands()` plus `detectCliType()` with process-name-first and pane-title fallback logic.

- [ ] **Step 4: Run the test to verify it passes**
Run:
```bash
npm test -- tests/shared/cli-detection.test.ts
```
Expected:
```text
PASS  tests/shared/cli-detection.test.ts
```

- [ ] **Step 5: Commit**
```bash
git add tests/shared/cli-detection.test.ts src/shared/types.ts src/shared/cli-commands.ts src/shared/cli-detection.ts
git commit -m "feat: add shared cli metadata"
```

### Task 3: Add server registry parsing and platform-aware tmux access

**Files:**
- Create: `src/server/config.ts`
- Create: `src/server/services/server-registry.ts`
- Create: `src/server/services/remote-platform.ts`
- Create: `src/server/services/ssh-client.ts`
- Create: `src/server/services/tmux-gateway.ts`
- Create: `.env.example`
- Create: `tests/server/server-registry.test.ts`
- Create: `tests/server/remote-platform.test.ts`
- Create: `tests/server/tmux-gateway.test.ts`

- [ ] **Step 1: Write failing backend service tests**
Add tests that assert Ubuntu defaults to `tmux`, Windows defaults to `wsl.exe -e tmux`, Ubuntu command building stays direct, Windows command building wraps through PowerShell, and pane capture output is normalized into lines.

- [ ] **Step 2: Run the tests to verify they fail**
Run:
```bash
npm test -- tests/server/server-registry.test.ts tests/server/remote-platform.test.ts tests/server/tmux-gateway.test.ts
```
Expected:
```text
FAIL  tests/server/server-registry.test.ts
FAIL  tests/server/remote-platform.test.ts
FAIL  tests/server/tmux-gateway.test.ts
```

- [ ] **Step 3: Implement registry defaults, remote command building, and tmux helpers**
Implement `getConfig()` with `WEBTMUX_PASSWORD` and `WEBTMUX_REGISTRY_FILE`, `parseServerRegistry()` with Ubuntu and Windows defaults, `buildRemoteCommand()` with PowerShell wrapping for Windows targets, `parsePaneLines()`, `capturePane()`, `listPanes()`, and `sendKeys()`.

- [ ] **Step 4: Run the tests to verify they pass**
Run:
```bash
npm test -- tests/server/server-registry.test.ts tests/server/remote-platform.test.ts tests/server/tmux-gateway.test.ts
```
Expected:
```text
PASS  tests/server/server-registry.test.ts
PASS  tests/server/remote-platform.test.ts
PASS  tests/server/tmux-gateway.test.ts
```

- [ ] **Step 5: Commit**
```bash
git add src/server/config.ts src/server/services/server-registry.ts src/server/services/remote-platform.ts src/server/services/ssh-client.ts src/server/services/tmux-gateway.ts .env.example tests/server/server-registry.test.ts tests/server/remote-platform.test.ts tests/server/tmux-gateway.test.ts
git commit -m "feat: add cross-platform tmux access"
```

### Task 4: Add auth, overview APIs, and session input APIs

**Files:**
- Create: `src/server/auth.ts`
- Create: `src/server/routes/auth-routes.ts`
- Create: `src/server/routes/overview-routes.ts`
- Create: `src/server/routes/session-routes.ts`
- Create: `src/server/services/session-stream.ts`
- Modify: `src/server/app.ts`
- Create: `tests/server/app.test.ts`

- [ ] **Step 1: Write the failing app tests**
Add tests that reject invalid login credentials and map `ctrl-c` to `['C-c']`.

- [ ] **Step 2: Run the tests to verify they fail**
Run:
```bash
npm test -- tests/server/app.test.ts
```
Expected:
```text
FAIL  tests/server/app.test.ts
```

- [ ] **Step 3: Implement auth and session routes**
Implement `requireAuth()`, `mapControlAction()`, `/api/auth/login`, `/api/overview`, `/api/session/:serverId/:target`, and `/api/session/input`, then register them in `createApp()`.

- [ ] **Step 4: Run the tests to verify they pass**
Run:
```bash
npm test -- tests/server/app.test.ts
```
Expected:
```text
PASS  tests/server/app.test.ts
```

- [ ] **Step 5: Commit**
```bash
git add src/server/auth.ts src/server/routes/auth-routes.ts src/server/routes/overview-routes.ts src/server/routes/session-routes.ts src/server/services/session-stream.ts src/server/app.ts tests/server/app.test.ts
git commit -m "feat: add auth and session api"
```

### Task 5: Build the frontend shell, session view, and `/command` palette

**Files:**
- Create: `tests/web/setup.ts`
- Create: `src/web/lib/api.ts`
- Create: `src/web/lib/auth-store.ts`
- Create: `src/web/components/command-palette.tsx`
- Create: `src/web/components/output-panel.tsx`
- Create: `src/web/components/session-input.tsx`
- Create: `src/web/pages/login-page.tsx`
- Create: `src/web/pages/overview-page.tsx`
- Create: `src/web/pages/session-page.tsx`
- Modify: `src/web/App.tsx`
- Create: `src/web/styles.css`
- Create: `tests/web/overview-page.test.tsx`
- Create: `tests/web/command-palette.test.tsx`
- Create: `tests/web/session-input.test.tsx`
- Create: `README.md`

- [ ] **Step 1: Write the failing web tests**
Add tests that assert the login page renders a password field, the command palette can render `/plan`, and typing `/` opens the palette with `/help` visible.

- [ ] **Step 2: Run the tests to verify they fail**
Run:
```bash
npm test -- tests/web/overview-page.test.tsx tests/web/command-palette.test.tsx tests/web/session-input.test.tsx
```
Expected:
```text
FAIL  tests/web/overview-page.test.tsx
FAIL  tests/web/command-palette.test.tsx
FAIL  tests/web/session-input.test.tsx
```

- [ ] **Step 3: Implement the mobile-first SPA**
Create routes for `/login`, `/`, and `/session/:serverId/:target`, a password form that calls `/api/auth/login`, an overview page that shows recent panes, a session page with chat/terminal toggle, a fixed input bar with Ctrl+C/Esc/Send actions, and a searchable `CommandPalette` fed by `getCliCommands()`.

- [ ] **Step 4: Style the app and document setup**
Write `src/web/styles.css` with mobile-first layout tokens and `README.md` covering Ubuntu targets with `tmux` in the SSH shell plus Windows targets where tmux is exposed through a wrapper such as `wsl.exe -e tmux`.

- [ ] **Step 5: Run the final verification**
Run:
```bash
npm run check
npm test
npm run build
```
Expected:
```text
Found 0 errors
PASS ...
vite v...
```

- [ ] **Step 6: Commit**
```bash
git add src/web tests/web README.md
git commit -m "feat: build webtmux mvp ui"
```

## Self-Review

### Spec coverage
- Single-user password auth: Task 4
- Manual server registry: Task 3
- Ubuntu and Windows support: Task 3
- SSH and tmux access: Task 3 and Task 4
- Overview page: Task 4 and Task 5
- Session page with chat and terminal views: Task 5
- CLI-specific `/command` palette: Task 2 and Task 5
- Mobile-first UI: Task 5

### Placeholder scan
- No `TODO`, `TBD`, or deferred placeholders remain.
- Every task contains exact files, commands, and expected output.

### Type consistency
- `CliType` and `ServerRecord` are introduced before backend and frontend code consumes them.
- Platform-aware tmux access lands before API routes depend on it.
- CLI metadata lands before the command palette consumes it.
