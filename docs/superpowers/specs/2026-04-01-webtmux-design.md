# WebTmux Design

Date: 2026-04-01
Status: Draft for review

## Summary

WebTmux is a lightweight, single-user web app for resuming existing AI CLI conversations that are already running inside tmux on remote servers. The product is optimized for phone use first, with clean desktop support second.

The app is not a general-purpose web terminal, and it is not a full agent platform. It only needs to do four things well:

1. Connect to registered servers through SSH.
2. Discover existing tmux sessions, windows, and panes.
3. Open a selected pane in the browser and continue the conversation.
4. Provide a mobile-friendly input layer tailored to Claude Code, Codex CLI, and Copilot CLI.

## Goals

- Work well on a low-spec VPS.
- Support both direct SSH connections and reverse-tunnel SSH connections through the same model.
- Scan registered servers for tmux sessions without requiring a daemon on each server.
- Let the user switch across many servers and many AI CLI sessions from one web UI.
- Provide a mobile-first chat view with a better input experience than a raw terminal.
- Support CLI-specific `/command` completion for Claude Code, Codex CLI, and Copilot CLI.
- Keep deployment and operations simple for a single personal user.

## Non-Goals

- Multi-user accounts, teams, or permissions.
- Git worktree management.
- PR, CI, issue tracker, or container orchestration features.
- Full terminal emulation as the primary user experience.
- Deep protocol integration with Claude Code, Codex CLI, or Copilot CLI internals.
- Creating new tmux sessions in v1.

## Product Scope

### V1

- Single-user site with password-based access.
- VPS-hosted web app with browser access from desktop and mobile.
- Manual server registry.
- Unified SSH access model for direct and reverse-tunnel targets.
- tmux discovery:
  - sessions
  - windows
  - panes
- Pane opening and interaction.
- Two viewing modes:
  - Chat view as the default
  - Terminal view as a fallback
- CLI detection for Claude Code, Codex CLI, and Copilot CLI.
- Static `/command` completion per supported CLI.
- Common control actions such as Enter, Ctrl+C, and Esc.
- Recent-output previews on the overview page.

### V2 Candidates

- Create new tmux sessions from the web UI.
- One-time login tokens.
- Favorites and pinned sessions.
- Better pane status detection.
- More complete terminal emulation.
- Saved command snippets or templates.

## Primary User Workflow

1. The user opens the site on a phone or desktop browser.
2. The user unlocks the site with a password.
3. The overview page loads registered servers and scans each reachable server for tmux sessions.
4. The UI shows a flat, activity-oriented overview of discovered AI panes across all servers.
5. The user opens a pane.
6. The pane opens in chat view by default.
7. The user types text, inserts a supported `/command`, or sends a control key.
8. The backend forwards the input to the remote tmux pane.
9. The output stream refreshes in near real time.
10. The user can switch to terminal view when the raw terminal output matters more than the chat layout.

## Information Architecture

### Overview Page

The overview page is the default landing page after login.

Primary presentation:

- Flat list sorted by recent activity.
- Quick filters for server and CLI type.
- Each card represents a pane, not only a server or session.

Each pane card shows:

- CLI type
- server name
- tmux path in `session/window/pane` form
- recent output preview
- connection or activity status

This page is optimized for fast switching across many active conversations.

### Session Page

The session page focuses on one pane at a time.

Top area:

- pane title
- server name
- tmux path
- CLI type badge
- chat or terminal view toggle

Main area:

- live output stream

Bottom area:

- large input box
- send action
- `/command` button
- common control-key actions

## Interaction Model

### Chat View

Chat view is the default and mobile-first mode.

Design intent:

- prioritize readability over terminal fidelity
- keep the input area large and stable
- minimize taps for switching and sending

The output area shows a readable stream of pane content rather than attempting to preserve every terminal layout detail perfectly.

### Terminal View

Terminal view is the fallback for cases where the user needs to inspect raw terminal behavior.

Design intent:

- preserve more of the pane output shape
- expose a closer terminal feel without making it the primary interaction model

### Command Completion

When the current CLI type is known, typing `/` or tapping the `/command` button opens a searchable static command list for that CLI.

V1 behavior:

- show commands for the active CLI only
- filter by keyword as the user types
- tap to insert into the input box
- inserted command remains editable before sending

This is intentionally simple. It solves the mobile entry problem without attempting context-aware suggestions.

### Supported CLI Detection

CLI detection uses a three-step fallback chain:

1. inspect the current process for the pane
2. infer from tmux naming conventions
3. let the user manually override the detected type

If detection fails, the pane still works in a generic mode without CLI-specific completion.

## System Architecture

### Overview

The system consists of one VPS-hosted web app and many remote servers that already run tmux sessions. No persistent agent process is required on the remote servers.

Core backend modules:

1. Auth module
2. Server registry
3. SSH adapter
4. tmux gateway
5. session streaming service
6. CLI metadata service
7. API and WebSocket server

### Auth Module

The auth module provides simple single-user access control.

V1 design:

- password login form
- signed session cookie

This keeps the product easy to deploy while still avoiding an open internet terminal endpoint.

### Server Registry

The server registry stores manually configured targets.

Suggested fields:

- display name
- host
- port
- user
- auth method
- mode: direct or reverse-tunnel
- optional tags

The UI does not care whether the target is direct or tunneled. That distinction stays inside the backend config.

### SSH Adapter

The SSH adapter normalizes remote access into one interface:

- connect
- run command
- stream command output when needed

Both direct SSH and reverse-tunnel targets become the same logical shape once configured as host, port, and user.

### Tmux Gateway

The tmux gateway is the core integration point with the remote servers.

It wraps tmux commands such as:

- `list-sessions`
- `list-windows`
- `list-panes`
- `capture-pane`
- `send-keys`
- `display-message`

Its job is to return structured data instead of raw shell output, and to hide tmux command details from the rest of the app.

### Session Streaming Service

The session page uses a live connection from browser to backend, ideally over WebSocket.

The backend does not attempt a heavy PTY bridge in v1. Instead, it focuses on:

- frequent pane capture
- incremental updates where practical
- low-latency input forwarding

This keeps the system light enough for a small VPS while still feeling responsive.

### CLI Metadata Service

This service maps supported CLI types to:

- display labels
- command lists
- command grouping
- optional default control actions

This module is intentionally static in v1.

## Data Flow

### Overview Load

1. Browser requests overview data.
2. Backend reads registered servers.
3. Backend connects to each reachable server through SSH.
4. Backend queries tmux sessions, windows, and panes.
5. Backend detects supported CLI type when possible.
6. Backend captures a small preview from each pane.
7. Backend returns a flattened list of pane cards sorted by recent activity.

### Open Session

1. Browser opens a pane.
2. Backend resolves the server and pane identifiers.
3. Backend establishes a live session channel.
4. Backend captures the latest pane content.
5. Browser renders chat view by default.

### Send Input

1. User types plain text or inserts a `/command`.
2. Browser sends the input event to the backend.
3. Backend forwards the action to tmux using `send-keys`.
4. Backend captures updated pane output.
5. Browser receives the updated output and refreshes the view.

### Send Control Action

1. User taps a control action such as Enter, Ctrl+C, or Esc.
2. Browser sends a structured control event.
3. Backend maps it to the correct tmux key sequence.
4. Backend forwards it through tmux.
5. Browser receives the refreshed pane output.

## Error Handling

### SSH Failures

- A failed server should degrade independently.
- The overview page must still load other reachable servers.
- Failed servers show an offline or unavailable state rather than breaking the whole page.

### Missing tmux Targets

- If a session, window, or pane disappears between overview and open, the session page should show a clear "target no longer exists" state.
- The user should be able to return to the overview in one action.

### Unknown CLI Type

- Unknown panes fall back to generic mode.
- Generic mode still supports plain text send and control keys.

### Streaming Errors

- The session page should surface reconnecting or refresh-failed states.
- A manual refresh action should exist.
- The app should not require a full page reload for transient stream issues.

## Performance Constraints

The target deployment environment is a low-spec VPS. The design should optimize for this explicitly.

Principles:

- keep server-side state minimal
- avoid long-lived heavy per-pane processes
- poll or stream only the pane the user is actively viewing at high frequency
- keep overview refresh lower-frequency than session refresh
- avoid full-terminal emulation complexity unless required

## Security Model

This is a personal tool, but it still exposes remote command control through the browser. The minimum acceptable security model is:

- password-protected site
- secure session cookie
- server-side storage of SSH connection metadata
- no client-side exposure of SSH credentials
- deployment behind TLS on the VPS

Multi-user permissions are deliberately out of scope.

## UI Design Direction

The UI should feel clean, compact, and calm rather than developer-tool noisy.

Principles:

- mobile-first layout
- fast switching across many conversations
- low visual clutter
- clear distinction between overview and focused session mode
- touch-friendly sizing for primary actions
- strong support for bottom-fixed input on mobile

Desktop behavior should expand naturally into a wider layout, but mobile ergonomics drive the design.

## Testing Strategy

### Unit Tests

- server registry parsing and validation
- CLI detection logic
- tmux output parsing
- command insertion behavior
- control-key mapping

### Integration Tests

- SSH adapter against a controlled test target
- tmux gateway behavior with sample tmux fixtures
- overview aggregation across multiple registered servers
- pane open and input-send workflow

### UI Tests

- overview rendering with mixed reachable and unreachable servers
- chat view input behavior on narrow screens
- `/command` panel opening, filtering, and insertion
- session-to-session switching

### Manual Verification

- phone browser behavior
- desktop browser behavior
- reverse-tunnel target access
- direct SSH target access
- Claude Code, Codex CLI, and Copilot CLI detection and command list behavior

## Open Decisions Already Resolved

- v1 focuses on taking over existing tmux sessions, not creating them
- server setup is manual registration plus automatic tmux scanning
- both direct SSH and reverse-tunnel SSH are supported behind one abstraction
- the product is single-user with password or token style access, starting with password
- users can browse sessions, windows, and panes
- the default experience is chat-optimized with a terminal fallback
- overview defaults to recent activity across all panes
- CLI-specific support is limited to Claude Code, Codex CLI, and Copilot CLI
- `/command` completion is static and searchable in v1

## Implementation Guidance

The project should be built as a narrowly scoped personal utility, not as a platform. Any implementation choice that increases flexibility at the cost of deployment simplicity should be treated with suspicion unless it directly improves the phone and desktop experience for the three supported CLIs.
