/**
 * ORION — Apps Page Module
 * Handles: app grid render, launch via ORION API, pin/unpin,
 * category filter, system scan, and usage stats.
 */

import { api } from '../../core/api.js';
import { state } from '../../core/state.js';
import { showToast, showModal } from '../../components/modal/modal.js';

// ─── App Definitions (default + populated from backend) ───────────────────────
const DEFAULT_APPS = [
  // Browsers
  { id: 'brave', name: 'Brave', category: 'browsers', icon: '🦁', cmd: 'brave', pinned: true },
  { id: 'chrome', name: 'Chrome', category: 'browsers', icon: '🌐', cmd: 'chrome', pinned: false },
  // Social
  { id: 'whatsapp', name: 'WhatsApp', category: 'social', icon: '💬', cmd: 'whatsapp', pinned: true },
  { id: 'youtube', name: 'YouTube', category: 'social', icon: '▶️', cmd: 'brave youtube.com', pinned: true },
  { id: 'facebook', name: 'Facebook', category: 'social', icon: '📘', cmd: 'brave facebook.com', pinned: false },
  { id: 'netflix', name: 'Netflix', category: 'social', icon: '🎬', cmd: 'brave netflix.com', pinned: false },
  // Dev
  { id: 'github', name: 'GitHub', category: 'dev', icon: '🐙', cmd: 'brave github.com', pinned: true },
  { id: 'vscode', name: 'VS Code', category: 'dev', icon: '💙', cmd: 'code', pinned: false },
  { id: 'notion', name: 'Notion', category: 'dev', icon: '📓', cmd: 'brave notion.so', pinned: false },
  { id: 'anydesk', name: 'AnyDesk', category: 'dev', icon: '🖥', cmd: 'anydesk', pinned: false },
  // System
  { id: 'thispc', name: 'This PC', category: 'system', icon: '💻', cmd: 'explorer', pinned: false },
  { id: 'settings', name: 'Settings', category: 'system', icon: '⚙️', cmd: 'ms-settings:', pinned: false },
  { id: 'cpanel', name: 'Control Panel', category: 'system', icon: '🛠', cmd: 'control', pinned: false },
  { id: 'downloads', name: 'Downloads', category: 'system', icon: '📥', cmd: 'explorer ~/Downloads', pinned: false },
  { id: 'documents', name: 'Documents', category: 'system', icon: '📁', cmd: 'explorer ~/Documents', pinned: false },
  // Media
  { id: 'spotify', name: 'Spotify', category: 'media', icon: '🎵', cmd: 'spotify', pinned: false },
  { id: 'vlc', name: 'VLC', category: 'media', icon: '🎞', cmd: 'vlc', pinned: false },
];

// ─── State ────────────────────────────────────────────────────────────────────
let _apps = [...DEFAULT_APPS];
let _filtered = [];
let _category = 'all';
let _search = '';

// ─── DOM ──────────────────────────────────────────────────────────────────────
let $pinnedGrid, $mainGrid, $appsCount, $appsEmpty;
let $search, $categoryChips, $usageList;

// ─── Init ─────────────────────────────────────────────────────────────────────
export async function init() {
  resolveRefs();
  bindEvents();
  await loadApps();
  await loadUsageStats();
  renderPinned();
  applyFilter();
}

function resolveRefs() {
  $pinnedGrid = document.getElementById('apps-pinned-grid');
  $mainGrid = document.getElementById('apps-main-grid');
  $appsCount = document.getElementById('apps-count');
  $appsEmpty = document.getElementById('apps-empty');
  $search = document.getElementById('apps-search');
  $categoryChips = document.getElementById('apps-category-chips');
  $usageList = document.getElementById('apps-usage-list');
}

// ─── Data ─────────────────────────────────────────────────────────────────────
async function loadApps() {
  try {
    const data = await api.get('/api/apps/list');
    if (data.apps?.length) _apps = data.apps;
  } catch { /* use defaults */ }
}

async function loadUsageStats() {
  try {
    const data = await api.get('/api/apps/usage-today');
    renderUsageStats(data.usage || []);
  } catch {
    renderUsageStats([
      { name: 'Brave', count: 12, icon: '🦁' },
      { name: 'YouTube', count: 8, icon: '▶️' },
      { name: 'VS Code', count: 6, icon: '💙' },
      { name: 'Notion', count: 4, icon: '📓' },
    ]);
  }
}

// ─── Render: Pinned (hex tiles) ───────────────────────────────────────────────
function renderPinned() {
  if (!$pinnedGrid) return;
  const pinned = _apps.filter(a => a.pinned);
  $pinnedGrid.innerHTML = pinned.map(app => `
    <button class="hex-tile" data-app-id="${app.id}" title="${app.name}" aria-label="Launch ${app.name}">
      <div class="hex-inner">
        <span class="hex-icon">${app.icon}</span>
        <span class="hex-label">${app.name}</span>
      </div>
    </button>
  `).join('');

  $pinnedGrid.querySelectorAll('.hex-tile').forEach(btn => {
    btn.addEventListener('click', () => {
      const app = _apps.find(a => a.id === btn.dataset.appId);
      if (app) launchApp(app);
    });
  });
}

// ─── Render: All Apps ─────────────────────────────────────────────────────────
function applyFilter() {
  let result = [..._apps];
  if (_category === 'pinned') result = result.filter(a => a.pinned);
  else if (_category !== 'all') result = result.filter(a => a.category === _category);

  if (_search) {
    const q = _search.toLowerCase();
    result = result.filter(a => a.name.toLowerCase().includes(q) || a.category.includes(q));
  }

  _filtered = result;
  renderMainGrid();
}

function renderMainGrid() {
  if (!$mainGrid) return;
  $appsCount.textContent = _filtered.length;
  $appsEmpty.hidden = _filtered.length > 0;

  $mainGrid.innerHTML = _filtered.map((app, i) => `
    <div class="app-card" data-app-id="${app.id}" style="animation-delay:${i * 0.04}s">
      <div class="app-card-icon">${app.icon}</div>
      <div class="app-card-body">
        <span class="app-card-name">${escHtml(app.name)}</span>
        <span class="app-card-cat">${app.category}</span>
      </div>
      <div class="app-card-actions">
        <button class="app-action-btn app-launch-btn" data-app-id="${app.id}" title="Launch" aria-label="Launch ${app.name}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
        <button class="app-action-btn app-pin-btn ${app.pinned ? 'app-pin-btn--active' : ''}" data-app-id="${app.id}" title="${app.pinned ? 'Unpin' : 'Pin'}" aria-label="${app.pinned ? 'Unpin' : 'Pin'} ${app.name}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </button>
        <button class="app-action-btn app-del-btn" data-app-id="${app.id}" title="Remove" aria-label="Remove ${app.name}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  $mainGrid.querySelectorAll('.app-launch-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const app = _apps.find(a => a.id === btn.dataset.appId);
      if (app) launchApp(app);
    });
  });

  $mainGrid.querySelectorAll('.app-pin-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      togglePin(btn.dataset.appId);
    });
  });

  $mainGrid.querySelectorAll('.app-del-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      removeApp(btn.dataset.appId);
    });
  });

  $mainGrid.querySelectorAll('.app-card').forEach(card => {
    card.addEventListener('dblclick', () => {
      const app = _apps.find(a => a.id === card.dataset.appId);
      if (app) launchApp(app);
    });
  });
}

// ─── Render: Usage Stats ──────────────────────────────────────────────────────
function renderUsageStats(usage) {
  if (!$usageList) return;
  const max = usage[0]?.count || 1;
  $usageList.innerHTML = usage.map(u => `
    <div class="usage-item">
      <span class="usage-icon">${u.icon}</span>
      <span class="usage-name">${escHtml(u.name)}</span>
      <div class="usage-bar-wrap">
        <div class="usage-bar" style="width:${Math.round(u.count / max * 100)}%"></div>
      </div>
      <span class="usage-count">${u.count}×</span>
    </div>
  `).join('');
}

// ─── Actions ──────────────────────────────────────────────────────────────────
async function launchApp(app) {
  showToast(`Launching ${app.name}…`, 'info');
  try {
    await api.post('/api/execute', { command: `open ${app.name}`, source: 'apps-panel' });
  } catch {
    showToast(`Could not launch ${app.name}`, 'error');
  }
}

function togglePin(appId) {
  const app = _apps.find(a => a.id === appId);
  if (!app) return;
  app.pinned = !app.pinned;
  showToast(`${app.name} ${app.pinned ? 'pinned' : 'unpinned'}`, 'success');
  renderPinned();
  applyFilter();
  api.post('/api/apps/pin', { appId, pinned: app.pinned }).catch(() => { });
}

async function removeApp(appId) {
  const app = _apps.find(a => a.id === appId);
  const name = app?.name || appId;
  const ok = await showModal({ title: `Remove "${name}"?`, body: 'This removes it from ORION\'s app list.', confirm: 'Remove', danger: true });
  if (!ok) return;
  _apps = _apps.filter(a => a.id !== appId);
  renderPinned();
  applyFilter();
  api.delete(`/api/apps/${appId}`).catch(() => { });
}

async function scanSystem() {
  const btn = document.getElementById('apps-scan-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Scanning…'; }
  try {
    const data = await api.post('/api/apps/scan', {});
    if (data.apps?.length) {
      _apps = data.apps;
      renderPinned();
      applyFilter();
      showToast(`Found ${data.apps.length} apps.`, 'success');
    }
  } catch {
    showToast('Scan failed — backend offline?', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔍 Scan System'; }
  }
}

// ─── Event Binding ────────────────────────────────────────────────────────────
function bindEvents() {
  $search?.addEventListener('input', e => {
    _search = e.target.value.trim();
    applyFilter();
  });

  $categoryChips?.addEventListener('click', e => {
    const chip = e.target.closest('[data-cat]');
    if (!chip) return;
    $categoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
    chip.classList.add('chip--active');
    _category = chip.dataset.cat;
    applyFilter();
  });

  document.getElementById('apps-scan-btn')?.addEventListener('click', scanSystem);
  document.getElementById('apps-add-btn')?.addEventListener('click', promptAddApp);
}

async function promptAddApp() {
  const name = prompt('App name:');
  if (!name?.trim()) return;
  const cmd = prompt(`Command to launch "${name}":`);
  if (!cmd?.trim()) return;
  const newApp = {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name: name.trim(),
    category: 'system',
    icon: '📦',
    cmd: cmd.trim(),
    pinned: false,
  };
  _apps.push(newApp);
  applyFilter();
  showToast(`App "${name}" added.`, 'success');
  api.post('/api/apps/add', newApp).catch(() => { });
}

// ─── Util ─────────────────────────────────────────────────────────────────────
function escHtml(str = '') {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}