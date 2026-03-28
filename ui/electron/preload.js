/**
 * ORION — Electron Preload Script
 * Exposes a safe, typed API to the renderer via contextBridge.
 * NO nodeIntegration — everything goes through this bridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

// ─── Allowed IPC channels ─────────────────────────────────────────────────────
const ALLOWED_SEND = ['window:minimize', 'window:maximize', 'window:close', 'window:hide'];
const ALLOWED_INVOKE = ['dialog:openFile', 'dialog:openDir', 'shell:exec', 'app:version', 'flask:status'];
const ALLOWED_RECEIVE = ['orion:status', 'orion:command-result', 'orion:notification', 'orion:voice-transcript'];

// ─── Exposed API ──────────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('orionBridge', {

    // ── Window Controls ────────────────────────────────────────────────────────
    window: {
        minimize: () => ipcRenderer.send('window:minimize'),
        maximize: () => ipcRenderer.send('window:maximize'),
        close: () => ipcRenderer.send('window:close'),
        hide: () => ipcRenderer.send('window:hide'),
    },

    // ── Dialog ─────────────────────────────────────────────────────────────────
    dialog: {
        openFile: (opts) => ipcRenderer.invoke('dialog:openFile', opts),
        openDir: () => ipcRenderer.invoke('dialog:openDir'),
    },

    // ── Shell ──────────────────────────────────────────────────────────────────
    shell: {
        exec: (cmd) => ipcRenderer.invoke('shell:exec', cmd),
    },

    // ── App Info ───────────────────────────────────────────────────────────────
    app: {
        version: () => ipcRenderer.invoke('app:version'),
        flaskStatus: () => ipcRenderer.invoke('flask:status'),
    },

    // ── Event Bus (Main → Renderer) ────────────────────────────────────────────
    on: (channel, callback) => {
        if (!ALLOWED_RECEIVE.includes(channel)) {
            console.warn(`[ORION Bridge] Blocked unknown receive channel: ${channel}`);
            return;
        }
        // Strip the ipcRenderer event object, expose only the payload
        ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    },

    off: (channel, callback) => {
        if (!ALLOWED_RECEIVE.includes(channel)) return;
        ipcRenderer.removeListener(channel, callback);
    },

    // ── Generic Invoke (future-proof) ─────────────────────────────────────────
    invoke: (channel, ...args) => {
        if (!ALLOWED_INVOKE.includes(channel)) {
            return Promise.reject(new Error(`[ORION Bridge] Blocked channel: ${channel}`));
        }
        return ipcRenderer.invoke(channel, ...args);
    },
});

// ─── DOM Ready Helper ─────────────────────────────────────────────────────────
// Let the renderer know Electron APIs are available
window.addEventListener('DOMContentLoaded', () => {
    document.documentElement.setAttribute('data-electron', 'true');
});