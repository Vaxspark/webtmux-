# WebTmux

WebTmux is a small single-user web app for resuming existing tmux-based Claude Code, Codex CLI, and Copilot CLI sessions from a phone or desktop browser.

## What it does

- Login with a single site password
- Scan registered servers over SSH
- Read tmux sessions, windows, and panes
- Open a pane in a mobile-friendly session view
- Send text, Enter, Ctrl+C, and Esc back into the active pane
- Show static `/command` completion for Claude Code, Codex CLI, and Copilot CLI

## Supported server types

- Ubuntu or other Linux hosts where `tmux` is available directly in the SSH shell
- Windows hosts reachable over SSH where tmux is exposed through a wrapper such as `wsl.exe -e tmux`
- Reverse-tunnel setups are supported by pointing the server record at the VPS-side host and port that forwards into the target machine

## Configuration

Copy `config/servers.example.json` to `config/servers.json` and edit the entries.

Environment variables:

- `PORT`: HTTP port, default `3000`
- `WEBTMUX_PASSWORD`: login password for the site
- `WEBTMUX_REGISTRY_FILE`: path to the server registry JSON file, default `config/servers.json`

## Install

```bash
npm install --cache .npm-cache --ignore-scripts
```

`--ignore-scripts` is recommended in restricted Windows environments where optional native dependency install scripts are blocked.

## Run

```bash
npm start
```

For local development with auto-restart:

```bash
npm run dev
```

## Test

```bash
npm test
```

## Current limitations

- Session output refresh uses polling, not WebSocket streaming yet
- Windows support assumes tmux is available through WSL or a similar wrapper command
- The site manages existing tmux sessions only; creating new sessions from the browser is not included yet
