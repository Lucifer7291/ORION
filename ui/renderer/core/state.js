/* ============================================================
   ORION — State Management (src/core/state.js)
   Central reactive state store
   ============================================================ */

const ORION_STATE = {
    activePage: 'dashboard',
    activeHeaderTab: 'widgets',  // matches the header nav tab shown in screenshot
    listening: false,
    time: '09:45',
    date: 'Thu 2026',

    system: { cpu: 45, ram: 30, battery: 78, netSpeed: '10 mb/s' },

    voice: {
        mode: 'Normal Mode',
        wakeWord: true,
        style: 'Natural',
        voice: 'Female (English) AI Voice',
    },

    music: {
        track: 'Love Me Like You Do',
        artist: 'Ellie Goulding',
        playing: true,
    },

    weather: {
        temp: 23, condition: 'Cloudy',
        forecast: [
            { day: 'Thu', icon: '🌥️', hi: 35, lo: 22 },
            { day: 'Fri', icon: '🌦️', hi: 31, lo: 20 },
            { day: 'Sat', icon: '🌦️', hi: 29, lo: 18 },
            { day: 'Sun', icon: '⛅', hi: 30, lo: 19 },
            { day: 'Mon', icon: '☁️', hi: 28, lo: 17 },
        ],
    },

    calendar: {
        month: 'Thu 2026',
        today: 19,
        events: [
            { label: 'St Panies', time: '' },
            { label: 'CDay noon', time: '' },
            { label: 'New York', sub: 'Go photo' },
        ],
        todos: [
            { text: 'Complete Content Page', tag: 'Closr!', done: true },
            { text: 'Add New Memory', tag: 'Orion', done: false },
            { text: 'YouTube Course Video', tag: '', done: false },
        ],
    },

    reminders: [
        { label: 'Lecture', time: '04:00', dur: '00:45', done: true },
        { label: 'Meeting', time: '09:30', dur: '00:30', done: false },
        { label: 'Exercise', time: '08:30', dur: '06:35', done: false },
    ],

    cmdHistory: [
        { icon: 'play', text: 'Start Music Player', time: '00:34' },
        { icon: 'clock', text: 'Set reminder by lecture today at 4 PM', time: '00:51' },
        { icon: 'globe', text: 'Open Chrome browser', time: '00:30' },
        { icon: 'search', text: 'Search Python decorators', time: '00:23' },
    ],

    quickCmds: [
        { icon: 'play', text: 'Start Music Player', date: '12/06/0090', time: '09:45' },
        { icon: 'clock', text: 'Set reminder for lecture today at 4 PM', date: '12/00/0090', time: '09:45' },
        { icon: 'power', text: 'Shutdown laptop in 10 minutes', date: '12/00/0008', time: '09:45' },
    ],

    widgets: {
        musicPlayer: true,
        weather: true,
        calendar: true,
        reminder: true,
        quickCommands: true,
    },

    commands: [
        { name: 'Start Music Player', type: 'media', uses: 42, last: '09:45' },
        { name: 'Open Chrome browser', type: 'system', uses: 38, last: '09:30' },
        { name: 'Search Python decorators', type: 'web', uses: 15, last: '09:23' },
        { name: 'Set reminder at 4 PM', type: 'voice', uses: 29, last: '09:51' },
        { name: 'Shutdown laptop', type: 'system', uses: 7, last: '08:00' },
        { name: 'Play YouTube song', type: 'media', uses: 33, last: '09:10' },
        { name: 'Send WhatsApp message', type: 'voice', uses: 19, last: '08:45' },
        { name: 'Open GitHub', type: 'web', uses: 24, last: '09:05' },
    ],

    apps: [
        { icon: '🌐', name: 'Chrome' },
        { icon: '⚡', name: 'Brave' },
        { icon: '🐙', name: 'GitHub' },
        { icon: '🖥️', name: 'This PC' },
        { icon: '📁', name: 'Documents' },
        { icon: '⬇️', name: 'Downloads' },
        { icon: '📊', name: 'Notion' },
        { icon: '🖥️', name: 'AnyDesk' },
        { icon: '💬', name: 'WhatsApp' },
        { icon: '📸', name: 'Instagram' },
        { icon: '📺', name: 'YouTube' },
        { icon: '🎵', name: 'Spotify' },
        { icon: '🎬', name: 'Netflix' },
        { icon: '👤', name: 'Facebook' },
        { icon: '⚙️', name: 'Settings' },
        { icon: '🗂️', name: 'Control Panel' },
        { icon: '📋', name: 'At Folder' },
        { icon: '🔧', name: 'Gasol Panel' },
    ],

    automation: [
        { step: 1, label: 'Open Brave browser' },
        { step: 2, label: 'Navigate to youtube.com' },
        { step: 3, label: 'Search: Gasolina song' },
        { step: 4, label: 'Click 2nd result' },
        { step: 5, label: 'Play video' },
    ],

    settings: {
        whisperModel: 'small',
        ttsMode: 'offline',
        ttsVoice: 'female',
        wakeWordSens: 0.5,
        autoReply: false,
        autoReplyDelay: 10,
        autoCall: false,
        softwareInstall: true,
        fileAccess: true,
        dataLogging: true,
        flaskPort: 5000,
        ollama: 'http://localhost:11434',
        llmModel: 'llama3',
    },
};

const ORION = {
    state: ORION_STATE,
    _listeners: {},

    on(event, fn) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(fn);
    },

    emit(event, data) {
        (this._listeners[event] || []).forEach(fn => fn(data));
    },

    set(path, value) {
        const keys = path.split('.');
        let obj = this.state;
        keys.slice(0, -1).forEach(k => obj = obj[k]);
        obj[keys[keys.length - 1]] = value;
        this.emit('stateChange', { path, value });
    },

    get(path) {
        return path.split('.').reduce((o, k) => o?.[k], this.state);
    },

    init() {
        // Boot all layout components
        renderSidebar();
        renderHeader();
        renderRightPanel();
        renderCommandBar();
        // Boot router (renders initial page)
        ORION_ROUTER.navigate(this.state.activePage);
        // Start clock
        this._startClock();
    },

    _startClock() {
        const update = () => {
            const now = new Date();
            const h = String(now.getHours()).padStart(2, '0');
            const m = String(now.getMinutes()).padStart(2, '0');
            const timeStr = `${h}:${m}`;
            this.state.time = timeStr;
            document.querySelectorAll('.live-time').forEach(el => el.textContent = timeStr);
        };
        update();
        setInterval(update, 10000);
    },
};