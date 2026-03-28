/**
 * ORION — Client Router
 * Hash-based SPA router. Loads page HTML fragments into #orion-content
 * and fires the page's init() function if defined.
 */

import { state, setState } from './state.js';

// ─── Route Map ────────────────────────────────────────────────────────────────
const ROUTES = {
    '': { page: 'dashboard', label: 'Dashboard' },
    'dashboard': { page: 'dashboard', label: 'Dashboard' },
    'commands': { page: 'commands', label: 'Commands' },
    'widgets': { page: 'widgets', label: 'Widgets' },
    'automation': { page: 'automation', label: 'Automation' },
    'reminders': { page: 'reminders', label: 'Reminders' },
    'apps': { page: 'apps', label: 'Apps' },
    'settings': { page: 'settings', label: 'Settings' },
};

// ─── Page Module Registry ─────────────────────────────────────────────────────
// Each page JS exports an init() function. We cache module references.
const _pageModules = {};

// ─── Internal State ───────────────────────────────────────────────────────────
let _currentRoute = null;
let _contentEl = null;
let _onRouteChange = null;   // external callback

// ─── Core Loader ─────────────────────────────────────────────────────────────
async function loadRoute(routeKey) {
    const route = ROUTES[routeKey] ?? ROUTES['dashboard'];
    const { page, label } = route;

    if (page === _currentRoute) return;   // already on this page

    // 1. Fetch HTML fragment
    const htmlPath = `src/pages/${page}/${page}.html`;
    let html = '';
    try {
        const res = await fetch(htmlPath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        html = await res.text();
    } catch (err) {
        console.error(`[Router] Could not load ${htmlPath}:`, err);
        html = `<div class="page-error">
              <h2>⚠ Page Not Found</h2>
              <p>Could not load <code>${page}</code></p>
            </div>`;
    }

    // 2. Inject into DOM
    if (!_contentEl) _contentEl = document.getElementById('orion-content');
    _contentEl.classList.add('page-exit');

    await sleep(160);   // match CSS transition duration

    _contentEl.innerHTML = html;
    _currentRoute = page;

    await sleep(20);
    _contentEl.classList.remove('page-exit');
    _contentEl.classList.add('page-enter');
    setTimeout(() => _contentEl.classList.remove('page-enter'), 400);

    // 3. Update state
    setState({ currentPage: page, currentLabel: label });

    // 4. Notify layout components (header active link, sidebar highlight)
    if (_onRouteChange) _onRouteChange(page, label);

    // 5. Load & init page module
    try {
        if (!_pageModules[page]) {
            const mod = await import(`../pages/${page}/${page}.js`);
            _pageModules[page] = mod;
        }
        if (typeof _pageModules[page].init === 'function') {
            await _pageModules[page].init();
        }
    } catch (err) {
        console.warn(`[Router] Page module ${page}.js not loaded:`, err.message);
    }

    // 6. Update document title
    document.title = `${label} — ORION`;
}

// ─── Hash Navigation ──────────────────────────────────────────────────────────
function getHashRoute() {
    return window.location.hash.replace('#', '').replace('/', '').trim().toLowerCase();
}

function handleHashChange() {
    const key = getHashRoute();
    loadRoute(key);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialize the router. Call once after DOM is ready.
 * @param {Function} onRouteChange  - callback(page, label) fired on every navigation
 */
export function initRouter(onRouteChange) {
    _onRouteChange = onRouteChange || null;
    _contentEl = document.getElementById('orion-content');

    window.addEventListener('hashchange', handleHashChange);

    // Load initial route
    handleHashChange();
}

/**
 * Navigate programmatically.
 * @param {string} page  e.g. 'dashboard', 'commands'
 */
export function navigate(page) {
    const key = page.toLowerCase();
    if (!ROUTES[key]) {
        console.warn(`[Router] Unknown route: ${page}`);
        return;
    }
    window.location.hash = `#${key}`;
}

/**
 * Get currently active page key.
 * @returns {string}
 */
export function currentRoute() {
    return _currentRoute;
}

/**
 * Returns all defined route keys.
 * @returns {string[]}
 */
export function getRoutes() {
    return Object.entries(ROUTES).map(([key, val]) => ({ key, ...val }));
}

// ─── Util ─────────────────────────────────────────────────────────────────────
function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}