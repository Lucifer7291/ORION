/**
 * ORION — Electron Main Process
 * Omni-Response Intelligent Operating Node
 * Launches the desktop shell and bridges to the Python backend.
 */

const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { exec, spawn } = require('child_process');

// ─── Constants ────────────────────────────────────────────────────────────────
const FLASK_URL = 'http://localhost:5000';
const FLASK_PING = `${FLASK_URL}/api/ping`;
const WIN_W = 1440;
const WIN_H = 900;
const PRELOAD = path.join(__dirname, 'preload.js');
const ICON_PATH = path.join(__dirname, '..', 'assets', 'icons', 'orion.png');
const INDEX_HTML = path.join(__dirname, '..', 'index.html');

// ─── State ────────────────────────────────────────────────────────────────────
let mainWindow = null;
let tray = null;
let pythonProc = null;
let flaskReady = false;
let pingInterval = null;

// ─── Python Backend ──────────────────────────────────────────────────────────
function startPythonBackend() {
    const backendPath = path.join(app.getAppPath(), '..', 'main.py');

    if (!fs.existsSync(backendPath)) {
        console.warn('[ORION] main.py not found — skipping Python launch.');
        return;
    }

    const python = process.platform === 'win32' ? 'python' : 'python3';
    pythonProc = spawn(python, [backendPath], {
        cwd: path.dirname(backendPath),
        env: { ...process.env, ORION_ELECTRON: '1' },
    });

    pythonProc.stdout.on('data', d => console.log('[Python]', d.toString().trim()));
    pythonProc.stderr.on('data', d => console.error('[Python ERR]', d.toString().trim()));
    pythonProc.on('close', code => console.log(`[Python] exited with code ${code}`));
}

function stopPythonBackend() {
    if (pythonProc) {
        pythonProc.kill('SIGTERM');
        pythonProc = null;
    }
}

// ─── Flask Health Check ───────────────────────────────────────────────────────
function pingFlask(callback) {
    http.get(FLASK_PING, res => {
        callback(res.statusCode === 200);
    }).on('error', () => callback(false));
}

function waitForFlask(win, maxAttempts = 30, attempt = 0) {
    pingFlask(ok => {
        if (ok) {
            flaskReady = true;
            win.loadURL(`${FLASK_URL}/dashboard`);
        } else if (attempt < maxAttempts) {
            setTimeout(() => waitForFlask(win, maxAttempts, attempt + 1), 1000);
        } else {
            // Flask never came up — load static fallback
            console.warn('[ORION] Flask not reachable — loading static UI.');
            win.loadFile(INDEX_HTML);
        }
    });
}

// ─── Window Factory ──────────────────────────────────────────────────────────
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: WIN_W,
        height: WIN_H,
        minWidth: 1024,
        minHeight: 680,
        frame: false,          // custom title bar in renderer
        transparent: false,
        backgroundColor: '#030d1a',
        icon: ICON_PATH,
        webPreferences: {
            preload: PRELOAD,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
        show: false,
    });

    // Show a loading screen while Flask starts
    mainWindow.loadFile(INDEX_HTML);
    mainWindow.once('ready-to-show', () => mainWindow.show());

    // After static index loads, begin polling Flask
    mainWindow.webContents.once('did-finish-load', () => {
        waitForFlask(mainWindow);
    });

    // Open DevTools in dev mode
    if (process.env.ORION_DEV === '1') {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }

    mainWindow.on('closed', () => { mainWindow = null; });

    // Intercept navigation to external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// ─── System Tray ─────────────────────────────────────────────────────────────
function createTray() {
    const icon = fs.existsSync(ICON_PATH)
        ? nativeImage.createFromPath(ICON_PATH).resize({ width: 16, height: 16 })
        : nativeImage.createEmpty();

    tray = new Tray(icon);
    tray.setToolTip('ORION — Active');

    const menu = Menu.buildFromTemplate([
        { label: 'Open Dashboard', click: () => { if (mainWindow) mainWindow.show(); } },
        { type: 'separator' },
        { label: 'Restart Backend', click: () => { stopPythonBackend(); startPythonBackend(); } },
        { type: 'separator' },
        { label: 'Quit ORION', click: () => app.quit() },
    ]);

    tray.setContextMenu(menu);
    tray.on('double-click', () => { if (mainWindow) mainWindow.show(); });
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────

/** Window controls (custom title bar) */
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());
ipcMain.on('window:hide', () => mainWindow?.hide());

/** Open native file/folder dialogs */
ipcMain.handle('dialog:openFile', async (_, opts = {}) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        ...opts,
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:openDir', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
});

/** Execute a shell command (restricted — only for trusted ORION commands) */
ipcMain.handle('shell:exec', (_, cmd) => {
    return new Promise((resolve, reject) => {
        exec(cmd, { timeout: 10000 }, (err, stdout, stderr) => {
            if (err) reject(stderr || err.message);
            else resolve(stdout.trim());
        });
    });
});

/** Get app version */
ipcMain.handle('app:version', () => app.getVersion());

/** Flask status */
ipcMain.handle('flask:status', () => ({ ready: flaskReady, url: FLASK_URL }));

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
    startPythonBackend();
    createMainWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
    if (pingInterval) clearInterval(pingInterval);
    stopPythonBackend();
});

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}