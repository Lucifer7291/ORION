/**
 * ORION — Commands Page Module
 * Handles: command history display, search/filter/sort,
 * chain task builder, export, and real-time updates via API.
 */

import { api } from '../../core/api.js';
import { state } from '../../core/state.js';
import { showToast, showModal, formatTime, formatDuration } from '../../components/modal/modal.js';

// ─── Local State ──────────────────────────────────────────────────────────────
let _commands = [];
let _filtered = [];
let _filter = 'all';
let _sort = 'newest';
let _searchQuery = '';
let _chainSteps = [];
let _pollTimer = null;

// ─── DOM Refs (resolved after init) ──────────────────────────────────────────
let $list, $search, $emptyState, $chips, $sort;
let $statTotal, $statToday, $statSuccess, $statAvgTime;
let $chainSteps, $chainStepNum, $chainRunBtn, $chainSaveBtn;

// ─── Init ─────────────────────────────────────────────────────────────────────
export async function init() {
  resolveRefs();
  bindEvents();
  await loadCommands();
  startPolling();
}

function resolveRefs() {
  $list = document.getElementById('cmd-list');
  $search = document.getElementById('cmd-search');
  $emptyState = document.getElementById('cmd-empty-state');
  $chips = document.getElementById('cmd-filter-chips');
  $sort = document.getElementById('cmd-sort');

  $statTotal = document.getElementById('stat-total');
  $statToday = document.getElementById('stat-today');
  $statSuccess = document.getElementById('stat-success');
  $statAvgTime = document.getElementById('stat-avg-time');

  $chainSteps = document.getElementById('chain-steps');
  $chainStepNum = document.getElementById('chain-step-num');
  $chainRunBtn = document.getElementById('chain-run-btn');
  $chainSaveBtn = document.getElementById('chain-save-btn');
}

// ─── Data Loading ─────────────────────────────────────────────────────────────
async function loadCommands() {
  try {
    const data = await api.get('/api/commands/history');
    _commands = data.commands || [];
  } catch {
    // Offline fallback — seed with demo data
    _commands = DEMO_COMMANDS;
  }
  updateStats();
  applyFilter();
}

function startPolling() {
  stopPolling();
  _pollTimer = setInterval(async () => {
    try {
      const data = await api.get('/api/commands/history?limit=1&since=' + (state.lastCmdId || 0));
      if (data.commands?.length) {
        _commands = [...data.commands, ..._commands];
        state.lastCmdId = _commands[0]?.id;
        updateStats();
        applyFilter();
      }
    } catch { /* silent */ }
  }, 5000);
}

function stopPolling() {
  if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function updateStats() {
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const today = _commands.filter(c => new Date(c.timestamp) >= todayStart);
  const successes = _commands.filter(c => c.status !== 'failed');
  const avgMs = _commands.reduce((s, c) => s + (c.durationMs || 0), 0) / (_commands.length || 1);

  $statTotal.textContent = _commands.length;
  $statToday.textContent = today.length;
  $statSuccess.textContent = _commands.length ? Math.round(successes.length / _commands.length * 100) + '%' : '—';
  $statAvgTime.textContent = _commands.length ? (avgMs / 1000).toFixed(1) + 's' : '—';
}

// ─── Filter / Sort / Render ───────────────────────────────────────────────────
function applyFilter() {
  let result = [..._commands];

  // Category filter
  if (_filter !== 'all') {
    result = result.filter(c => {
      if (_filter === 'failed') return c.status === 'failed';
      if (_filter === 'voice') return c.source === 'voice';
      if (_filter === 'typed') return c.source === 'typed';
      if (_filter === 'automation') return c.source === 'automation';
      return true;
    });
  }

  // Search
  if (_searchQuery) {
    const q = _searchQuery.toLowerCase();
    result = result.filter(c => c.text.toLowerCase().includes(q));
  }

  // Sort
  if (_sort === 'newest') result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  if (_sort === 'oldest') result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  if (_sort === 'az') result.sort((a, b) => a.text.localeCompare(b.text));
  if (_sort === 'duration') result.sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0));

  _filtered = result;
  renderList();
}

function renderList() {
  if (!$list) return;

  // Remove old items (keep empty-state sentinel)
  $list.querySelectorAll('.cmd-item').forEach(el => el.remove());

  if (_filtered.length === 0) {
    $emptyState.hidden = false;
    return;
  }
  $emptyState.hidden = true;

  const frag = document.createDocumentFragment();
  _filtered.forEach((cmd, i) => {
    const li = buildCommandItem(cmd, i);
    frag.appendChild(li);
  });
  $list.appendChild(frag);
}

function buildCommandItem(cmd, idx) {
  const li = document.createElement('li');
  li.className = `cmd-item cmd-item--${cmd.status || 'ok'}`;
  li.dataset.id = cmd.id;
  li.style.animationDelay = `${idx * 0.03}s`;

  const icon = cmd.status === 'failed'
    ? `<svg class="cmd-status-icon cmd-status-icon--fail" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
    : `<svg class="cmd-status-icon cmd-status-icon--ok"  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;

  const sourceTag = `<span class="cmd-source-tag cmd-source-tag--${cmd.source || 'typed'}">${cmd.source || 'typed'}</span>`;
  const ts = cmd.timestamp ? formatTime(new Date(cmd.timestamp)) : '';
  const dur = cmd.durationMs ? formatDuration(cmd.durationMs) : '';

  li.innerHTML = `
    <div class="cmd-item-left">
      ${icon}
      <div class="cmd-item-body">
        <span class="cmd-text">${escHtml(cmd.text)}</span>
        <div class="cmd-meta">
          ${sourceTag}
          <span class="cmd-ts">${ts}</span>
          ${dur ? `<span class="cmd-dur">${dur}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="cmd-item-actions">
      <button class="cmd-action-btn" data-action="replay" title="Replay" aria-label="Replay command">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </button>
      <button class="cmd-action-btn" data-action="chain" title="Add to chain" aria-label="Add to chain">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </button>
      <button class="cmd-action-btn cmd-action-btn--delete" data-action="delete" title="Delete" aria-label="Delete command">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
      </button>
    </div>
  `;

  li.querySelector('[data-action="replay"]')?.addEventListener('click', () => replayCommand(cmd));
  li.querySelector('[data-action="chain"]')?.addEventListener('click', () => addToChain(cmd));
  li.querySelector('[data-action="delete"]')?.addEventListener('click', () => deleteCommand(cmd, li));

  return li;
}

// ─── Actions ──────────────────────────────────────────────────────────────────
async function replayCommand(cmd) {
  try {
    await api.post('/api/execute', { command: cmd.text, source: 'replay' });
    showToast(`Replaying: ${cmd.text}`, 'success');
  } catch {
    showToast('Replay failed — check backend connection.', 'error');
  }
}

async function deleteCommand(cmd, el) {
  el.classList.add('cmd-item--removing');
  setTimeout(async () => {
    _commands = _commands.filter(c => c.id !== cmd.id);
    applyFilter();
    try { await api.delete(`/api/commands/${cmd.id}`); } catch { /* silent */ }
  }, 300);
}

async function clearAll() {
  const ok = await showModal({
    title: 'Clear All Commands?',
    body: 'This will permanently delete your entire command history.',
    confirm: 'Clear All',
    danger: true,
  });
  if (!ok) return;
  _commands = [];
  applyFilter();
  try { await api.delete('/api/commands/all'); } catch { /* silent */ }
  showToast('Command history cleared.', 'info');
}

async function exportCommands() {
  const csv = [
    'ID,Text,Status,Source,Timestamp,DurationMs',
    ..._commands.map(c =>
      `${c.id},"${(c.text || '').replace(/"/g, '""')}",${c.status},${c.source},${c.timestamp},${c.durationMs || 0}`
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orion-commands-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Chain Builder ────────────────────────────────────────────────────────────
function addToChain(cmd) {
  _chainSteps.push({ id: Date.now(), text: cmd.text });
  renderChain();
  showToast(`Added to chain: "${cmd.text}"`, 'success');
}

function renderChain() {
  if (!$chainSteps) return;
  $chainStepNum.textContent = _chainSteps.length;
  $chainRunBtn.disabled = _chainSteps.length === 0;
  $chainSaveBtn.disabled = _chainSteps.length === 0;

  if (_chainSteps.length === 0) {
    $chainSteps.innerHTML = `<div class="chain-empty-msg">Drag commands here or click <strong>+ Add Step</strong></div>`;
    return;
  }

  $chainSteps.innerHTML = _chainSteps.map((step, i) => `
    <div class="chain-step" data-step-id="${step.id}">
      <span class="chain-step-num">${i + 1}</span>
      <span class="chain-step-text">${escHtml(step.text)}</span>
      <button class="chain-step-remove" data-id="${step.id}" aria-label="Remove step">✕</button>
    </div>
  `).join('');

  $chainSteps.querySelectorAll('.chain-step-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      _chainSteps = _chainSteps.filter(s => s.id !== Number(btn.dataset.id));
      renderChain();
    });
  });
}

async function runChain() {
  if (_chainSteps.length === 0) return;
  $chainRunBtn.disabled = true;
  $chainRunBtn.textContent = 'Running…';

  try {
    await api.post('/api/chain/execute', { steps: _chainSteps.map(s => s.text) });
    showToast('Chain executed successfully!', 'success');
  } catch {
    showToast('Chain execution failed.', 'error');
  } finally {
    $chainRunBtn.disabled = false;
    $chainRunBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run Chain`;
  }
}

// ─── Event Binding ────────────────────────────────────────────────────────────
function bindEvents() {
  $search?.addEventListener('input', e => {
    _searchQuery = e.target.value.trim();
    applyFilter();
  });

  $chips?.addEventListener('click', e => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;
    $chips.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
    chip.classList.add('chip--active');
    _filter = chip.dataset.filter;
    applyFilter();
  });

  $sort?.addEventListener('change', e => {
    _sort = e.target.value;
    applyFilter();
  });

  document.getElementById('cmd-clear-btn')?.addEventListener('click', clearAll);
  document.getElementById('cmd-export-btn')?.addEventListener('click', exportCommands);
  document.getElementById('chain-run-btn')?.addEventListener('click', runChain);
  document.getElementById('chain-save-btn')?.addEventListener('click', saveChain);
  document.getElementById('chain-add-step')?.addEventListener('click', promptAddStep);
  document.getElementById('chain-clear-btn')?.addEventListener('click', () => { _chainSteps = []; renderChain(); });
}

async function promptAddStep() {
  const text = prompt('Enter command text for new step:');
  if (text?.trim()) {
    _chainSteps.push({ id: Date.now(), text: text.trim() });
    renderChain();
  }
}

async function saveChain() {
  const name = prompt('Chain name:');
  if (!name?.trim()) return;
  try {
    await api.post('/api/chain/save', { name: name.trim(), steps: _chainSteps.map(s => s.text) });
    showToast(`Chain "${name}" saved!`, 'success');
  } catch {
    showToast('Failed to save chain.', 'error');
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escHtml(str = '') {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Demo Data (offline fallback) ─────────────────────────────────────────────
const DEMO_COMMANDS = [
  { id: 1, text: 'Start Music Player', status: 'ok', source: 'voice', timestamp: new Date(Date.now() - 60000).toISOString(), durationMs: 340 },
  { id: 2, text: 'Set reminder for lecture today at 4 PM', status: 'ok', source: 'voice', timestamp: new Date(Date.now() - 120000).toISOString(), durationMs: 510 },
  { id: 3, text: 'Open Chrome browser', status: 'ok', source: 'typed', timestamp: new Date(Date.now() - 240000).toISOString(), durationMs: 300 },
  { id: 4, text: 'Search Python decorators', status: 'ok', source: 'voice', timestamp: new Date(Date.now() - 400000).toISOString(), durationMs: 230 },
  { id: 5, text: 'Shutdown laptop in 10 minutes', status: 'ok', source: 'voice', timestamp: new Date(Date.now() - 600000).toISOString(), durationMs: 400 },
  { id: 6, text: 'Send WhatsApp to Mom', status: 'failed', source: 'automation', timestamp: new Date(Date.now() - 900000).toISOString(), durationMs: 820 },
  { id: 7, text: 'Play Lo-fi playlist on YouTube', status: 'ok', source: 'voice', timestamp: new Date(Date.now() - 1800000).toISOString(), durationMs: 560 },
];