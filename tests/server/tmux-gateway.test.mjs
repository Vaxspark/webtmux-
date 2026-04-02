import assert from 'node:assert/strict';
import { runCase } from '../helpers.mjs';
import {
  buildCliWindowName,
  parseCreatedPaneRow,
  parseDirectoryRows,
  parsePaneLines,
  parsePaneRow
} from '../../src/server/services/tmux-gateway.js';

await runCase('parsePaneLines normalizes capture-pane output', () => {
  assert.deepEqual(parsePaneLines('one\ntwo\n'), ['one', 'two']);
});

await runCase('parsePaneRow splits tmux tab-delimited rows', () => {
  const parsed = parsePaneRow('cli-main\tnode\t0\tworkspace\tnode\t%0');
  assert.deepEqual(parsed, {
    sessionName: 'cli-main',
    windowName: 'node',
    paneIndex: '0',
    paneTitle: 'workspace',
    processName: 'node',
    paneId: '%0'
  });
});

await runCase('parseDirectoryRows keeps only non-empty directory rows', () => {
  assert.deepEqual(parseDirectoryRows('repo\nnotes\n'), ['repo', 'notes']);
});

await runCase('parseCreatedPaneRow splits tmux created-window output', () => {
  assert.deepEqual(parseCreatedPaneRow('webtmux\tcodex:webtmux\t0\t%9'), {
    sessionName: 'webtmux',
    windowName: 'codex:webtmux',
    paneIndex: '0',
    paneId: '%9'
  });
});

await runCase('buildCliWindowName derives a stable tmux window label', () => {
  assert.equal(buildCliWindowName('codex-cli', '/srv/work/webtmux'), 'codex-cli:webtmux');
});
