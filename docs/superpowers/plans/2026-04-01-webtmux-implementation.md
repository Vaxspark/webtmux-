# WebTmux MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-user WebTmux MVP that connects to registered Ubuntu and Windows SSH targets, discovers existing tmux panes, and lets the user continue Claude Code, Codex CLI, and Copilot CLI conversations from a mobile-friendly web UI.

**Architecture:** Implement a single TypeScript codebase with a Fastify backend and a Vite React frontend. The backend owns password auth, server registry loading, SSH execution, platform-aware tmux command construction, pane overview aggregation, and session input forwarding. The frontend is a mobile-first SPA with login, overview, session view toggle, and a static `/command` palette for the three supported CLIs.

**Tech Stack:** Node.js 22, npm, TypeScript, Fastify, `@fastify/cookie`, `@fastify/jwt`, `@fastify/websocket`, `ssh2`, React, React Router, Vite, Vitest, React Testing Library

---

## Planned File Structure

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `README.md`
- Create: `src/shared/types.ts`
- Create: `src/shared/cli-commands.ts`
- Create: `src/shared/cli-detection.ts`
- Create: `src/server/index.ts`
- Create: `src/server/app.ts`
- Create: `src/server/config.ts`
- Create: `src/server/auth.ts`
- Create: `src/server/routes/auth-routes.ts`
- Create: `src/server/routes/overview-routes.ts`
- Create: `src/server/routes/session-routes.ts`
- Create: `src/server/services/server-registry.ts`
- Create: `src/server/services/remote-platform.ts`
- Create: `src/server/services/ssh-client.ts`
- Create: `src/server/services/tmux-gateway.ts`
- Create: `src/server/services/session-stream.ts`
- Create: `src/web/main.tsx`
- Create: `src/web/App.tsx`
- Create: `src/web/styles.css`
- Create: `src/web/lib/api.ts`
- Create: `src/web/lib/auth-store.ts`
- Create: `src/web/components/command-palette.tsx`
- Create: `src/web/components/output-panel.tsx`
- Create: `src/web/components/session-input.tsx`
- Create: `src/web/pages/login-page.tsx`
- Create: `src/web/pages/overview-page.tsx`
- Create: `src/web/pages/session-page.tsx`
- Create: `tests/shared/cli-detection.test.ts`
- Create: `tests/server/server-registry.test.ts`
- Create: `tests/server/remote-platform.test.ts`
- Create: `tests/server/tmux-gateway.test.ts`
- Create: `tests/server/app.test.ts`
- Create: `tests/web/setup.ts`
- Create: `tests/web/overview-page.test.tsx`
- Create: `tests/web/command-palette.test.tsx`
- Create: `tests/web/session-input.test.tsx`

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

Write `package.json`:

```json
{
  "name": "webtmux",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "dev:server": "tsx watch src/server/index.ts",
    "build": "tsc -p tsconfig.node.json && vite build",
    "test": "vitest run",
    "check": "tsc -p tsconfig.node.json --noEmit && tsc --noEmit"
  }
}
```

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

- [ ] **Step 4: Create TypeScript and entrypoint files**

Write `src/server/app.ts`:

```ts
import Fastify from 'fastify';

export function createApp() {
  return Fastify({ logger: false });
}
```

Write `src/server/index.ts`:

```ts
import { createApp } from './app.js';

createApp().listen({ host: '0.0.0.0', port: 3000 });
```

Write `src/web/App.tsx`:

```tsx
export function App() {
  return <div>WebTmux</div>;
}
```

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
