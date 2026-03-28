/* ============================================================
   ORION — API Bridge (src/core/api.js)
   Communicates with Python backend via Flask / Electron IPC
   ============================================================ */

const ORION_API = {
    BASE: 'http://localhost:5000',

    async call(endpoint, method = 'GET', body = null) {
        try {
            const opts = { method, headers: { 'Content-Type': 'application/json' } };
            if (body) opts.body = JSON.stringify(body);
            const res = await fetch(`${this.BASE}${endpoint}`, opts);
            return await res.json();
        } catch (e) {
            console.warn('[ORION API] offline — using local state:', e.message);
            return null;
        }
    },

    executeCommand: (cmd) => ORION_API.call('/api/command', 'POST', { command: cmd }),
    getStatus: () => ORION_API.call('/api/status'),
    getMemory: () => ORION_API.call('/api/memory'),
    toggleWidget: (id, state) => ORION_API.call('/api/widget', 'POST', { id, state }),
    startListening: () => ORION_API.call('/api/listen/start', 'POST'),
    stopListening: () => ORION_API.call('/api/listen/stop', 'POST'),
};