/**
 * Server-side pane history accumulation.
 *
 * TUI applications (e.g. copilot-cli, claude-code using Ink) redraw the terminal
 * in-place using cursor movement escape sequences. When new messages appear, old
 * content is overwritten and never enters tmux's scrollback buffer. This module
 * accumulates successive captures and prepends lines that were "scrolled off" the
 * TUI viewport to reconstruct a full history.
 */

/** @type {Map<string, string[]>} */
const historyCache = new Map();

const MAX_HISTORY_LINES = 3000;
const MIN_OVERLAP_LINES = 3;
const MAX_CHROME_LINES = 8; // status bar, input bar, separator lines at bottom

/**
 * Find the largest k >= minLen such that the last k lines of `stored`
 * exactly equal the first k lines of `newer`.
 * @param {string[]} stored
 * @param {string[]} newer
 * @returns {number}
 */
function findSuffixPrefixOverlap(stored, newer) {
  const maxK = Math.min(stored.length, newer.length);
  for (let k = maxK; k >= MIN_OVERLAP_LINES; k--) {
    let match = true;
    const offset = stored.length - k;
    for (let i = 0; i < k; i++) {
      if (stored[offset + i] !== newer[i]) {
        match = false;
        break;
      }
    }
    if (match) return k;
  }
  return 0;
}

/**
 * Merge a new tmux capture with the accumulated history for a pane.
 *
 * Algorithm:
 *   Try removing 0..MAX_CHROME_LINES from the bottom of both stored and new capture
 *   (to ignore fixed UI chrome like input bars). For each chrome guess, look for the
 *   longest suffix-prefix match. When found, prepend the "lost" lines from stored
 *   (those before the overlap) to the new capture.
 *
 * @param {string} paneKey   Unique key, e.g. "serverId:paneId"
 * @param {string[]} newLines  Fresh output from tmux capture-pane
 * @returns {string[]}         Merged lines with accumulated history prepended
 */
export function mergePaneCapture(paneKey, newLines) {
  const stored = historyCache.get(paneKey) ?? [];

  if (stored.length === 0) {
    historyCache.set(paneKey, newLines.slice(-MAX_HISTORY_LINES));
    return newLines;
  }

  // Try successively larger chrome guesses until we find an overlap
  for (let chrome = 0; chrome <= MAX_CHROME_LINES; chrome++) {
    const storedBody = chrome > 0 ? stored.slice(0, -chrome) : stored;
    const newBody = chrome > 0 ? newLines.slice(0, -chrome) : newLines;

    if (storedBody.length < MIN_OVERLAP_LINES || newBody.length < MIN_OVERLAP_LINES) continue;

    const overlap = findSuffixPrefixOverlap(storedBody, newBody);
    if (overlap >= MIN_OVERLAP_LINES) {
      // Lines in stored before the overlap were scrolled off – prepend them
      const lostLines = storedBody.slice(0, storedBody.length - overlap);
      const merged = [...lostLines, ...newLines].slice(-MAX_HISTORY_LINES);
      historyCache.set(paneKey, merged);
      return merged;
    }
  }

  // No overlap found: content changed completely, just store new capture
  historyCache.set(paneKey, newLines.slice(-MAX_HISTORY_LINES));
  return newLines;
}

/**
 * Remove stored history for a pane (e.g. when pane is closed/recreated).
 * @param {string} paneKey
 */
export function clearPaneHistory(paneKey) {
  historyCache.delete(paneKey);
}
