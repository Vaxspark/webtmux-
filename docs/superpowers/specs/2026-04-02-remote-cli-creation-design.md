# Remote CLI Creation Design

Date: 2026-04-02
Status: Draft for review

## Summary

This design adds the ability to create a new persistent AI CLI conversation on an already connected remote server from the WebTmux overview UI.

The flow is:

1. Open a `New CLI` dialog from the overview page.
2. Select a registered server.
3. Select one of the supported CLI types.
4. Browse remote directories and choose a workspace.
5. Review or edit the default launch command.
6. Create a new tmux window inside a reusable per-server session.
7. Open the new pane immediately in the browser.

The new capability stays aligned with the current product boundary: WebTmux remains a focused tmux-backed remote AI CLI companion, not a general terminal or file manager.

## Goals

- Let the user create a new remote Claude Code, Codex CLI, or Copilot CLI session from the web UI.
- Let the user choose the workspace through remote directory browsing instead of manual path entry.
- Reuse a stable tmux session on each server and create a new window for each new CLI conversation.
- Allow the user to edit the launch command before creation.
- Return directly into the new pane after creation.

## Non-Goals

- Full remote file management.
- Editing files or creating directories from the browser.
- Arbitrary shell access beyond the CLI launch command field.
- Creating a brand new tmux session for each new CLI.
- Complex tree-style file explorers in v1 of this feature.

## User Workflow

1. The user opens the overview page.
2. The user clicks `New CLI`.
3. The dialog opens with server selection, CLI selection, workspace browser, and launch command.
4. The user picks a server.
5. The app loads the starting remote directory and shows child directories only.
6. The user drills down through directories until the target workspace is selected.
7. The app fills a default launch command for the selected CLI type.
8. The user optionally edits the command.
9. The user clicks `Create`.
10. The backend validates the workspace, ensures the reusable tmux session exists, creates a new tmux window, sends the launch sequence, and returns the new pane target.
11. The frontend refreshes overview state and opens the new pane.

## Product Scope

### Included

- New overview action for creating a CLI.
- Modal-style creation dialog in the existing single-page UI.
- Remote directory browsing by listing directories one level at a time.
- Default launch commands for the three supported CLI types.
- Editable launch command field.
- Reusable tmux session per server.
- New tmux window creation within that session.

### Deferred

- Saved workspace favorites.
- Server-configured workspace presets.
- Full directory tree expansion UI.
- File listing or file opening in the workspace browser.
- Detecting whether the CLI process later exited successfully or failed.

## Interaction Design

### Entry Point

The overview filter bar gains a `New CLI` primary action on the right side. This keeps the feature close to the session discovery surface without introducing a separate route.

### Create Dialog

The dialog contains four sections in this order:

1. Server selector
2. CLI type selector
3. Remote workspace browser
4. Launch command field

The dialog stays in one step. The user should not navigate through multiple wizard screens because the flow is short and the selected workspace should remain visible while reviewing the launch command.

### Workspace Browser

The workspace browser is intentionally limited to directories.

UI elements:

- current path
- parent/up action
- scrollable list of child directories
- selected workspace indicator
- loading and error states

Behavior:

- selecting a server loads an initial directory
- clicking a directory navigates into it
- the current directory shown in the browser is always the selected workspace used for creation
- files are hidden

This is not a general-purpose browser. The feature only needs enough remote filesystem visibility to choose a working directory safely.

### Launch Command

The command field is prefilled from CLI type selection and remains editable.

Initial defaults:

- `claude-code`
- `codex`
- `github-copilot-cli`

These defaults are intentionally simple. The user already chose that custom command editing is required because installed binary names may differ across servers.

## Backend Design

### New APIs

#### `GET /api/servers/:serverId/fs`

Purpose:

- return the current directory context and immediate child directories for the workspace browser

Request:

- path parameter: `serverId`
- query parameter: optional `path`

Response shape:

- `path`: normalized current path
- `parentPath`: nullable parent path
- `directories`: array of directory entries with `name` and `path`

Constraints:

- only registered servers are allowed
- only authenticated users are allowed
- only directories are returned

#### `POST /api/session/create`

Purpose:

- create a new CLI-backed tmux window on a selected server

Request shape:

- `serverId`
- `cliType`
- `workspacePath`
- `launchCommand`

Response shape:

- `serverId`
- `paneId`
- `sessionName`
- `windowName`
- `paneIndex`

The response should contain enough metadata for the frontend to open the new pane immediately without requiring a second discovery round-trip first, although the overview should still refresh afterward.

## Tmux Gateway Design

The tmux gateway becomes responsible for three additional capabilities.

### Directory Listing

Add a function that lists directories under a target path on a remote server.

Requirements:

- return only directories
- support Linux and PowerShell-compatible Windows hosts through the existing remote command abstraction
- normalize output into structured records

### Workspace Validation

Add a function that verifies a workspace path exists and is a directory before tmux creation proceeds.

Failure at this stage should block creation with a clear validation error.

### CLI Window Creation

Add a function that:

1. ensures the reusable tmux session exists
2. creates a new window in that session
3. obtains the pane id for the created window
4. sends a launch sequence that changes into the selected workspace and runs the chosen command
5. returns the created pane metadata

## tmux Organization

### Reusable Session

Each server uses one stable tmux session name for windows created by WebTmux:

- `webtmux`

Behavior:

- if the session does not exist, create it with `new-session -d -s webtmux`
- if it exists, reuse it
- each new CLI uses `new-window -t webtmux`

This matches the chosen product behavior: do not create a new tmux session per CLI, only a new window.

### Window Naming

Default window name format:

- `<cliType>:<workspaceBasename>`

Examples:

- `codex:webtmux`
- `claude-code:repo`

The existing rename capability remains the customization path after creation.

## Command Execution Design

The creation flow must not build an ad hoc shell pipeline separately for each platform. It should reuse the existing server platform abstraction as much as possible.

Launch sequence behavior:

1. create the target tmux window
2. send `cd <workspace>` into the new pane
3. send Enter
4. send the launch command
5. send Enter

This mirrors the already shipped input-forwarding model and keeps escaping rules understandable. It also avoids forcing a single monolithic shell command through tmux at creation time.

## Initial Directory Strategy

The first directory shown by the workspace browser should be the SSH user home directory where possible.

If home directory resolution fails, the backend may fall back to:

- current remote working directory for the SSH session
- `/` on Linux
- the user profile directory on Windows if available

This fallback must be explicit in implementation and tests so behavior is deterministic.

## Error Handling

### Directory Browser Errors

- server not found: return `404`
- unreadable path: return validation-style error for the dialog
- SSH or remote command failure: show inline error in the dialog and preserve existing selections

### Create Errors

- invalid CLI type: reject request
- empty launch command: reject request
- workspace does not exist or is not a directory: reject request
- tmux unavailable: return actionable error
- window creation failure: return error and do not claim success

### CLI Process Exit

If the command starts and exits immediately, the backend should still treat tmux window creation as successful. The pane remains available so the user can inspect output directly.

## Security Constraints

- do not expose SSH credentials to the client
- restrict filesystem browsing to authenticated users
- limit the browser API to directory discovery only
- keep the launch command explicit and user-visible rather than implicitly generating hidden shell behavior

The editable launch command is intentionally powerful, but it remains within the trust boundary of a single-user self-hosted tool.

## Testing Strategy

### Unit Tests

- request validation for filesystem browsing route
- request validation for session creation route
- tmux gateway parsing for directory listing output
- tmux gateway command construction for reusable session creation
- tmux gateway command construction for new window launch

### Integration Tests

- browse initial remote directory
- browse into a child directory
- reject non-directory workspace
- create window when reusable session does not yet exist
- create window when reusable session already exists

### UI Tests

- `New CLI` action renders in overview
- dialog loads server and CLI defaults correctly
- workspace browser renders returned directory list
- clicking a directory triggers a nested browse request
- create submission sends expected payload

## Implementation Notes

- Keep the new frontend state local to the overview page rather than introducing a global state store.
- Keep the new backend logic inside existing route and service boundaries:
  - route for validation and request parsing
  - tmux gateway for tmux lifecycle operations
  - remote platform abstraction for cross-platform command handling
- Avoid turning the workspace browser into a generic remote shell abstraction. Scope discipline matters here.

## Resolved Decisions

- supported CLI selection is preset-based but editable
- workspace selection uses remote directory browsing
- new CLI instances are created as tmux windows inside a reusable session
- the reusable session name is `webtmux`
- the create flow opens the new pane immediately after successful creation

