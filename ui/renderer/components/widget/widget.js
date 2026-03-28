// ============================================================
// ORION — Widget Component Manager
// ============================================================

window.WidgetManager = (function () {

  const registry = {};   // id → { el, config, intervals }
  const clockTimer = null;

  // ── Widget Definitions ───────────────────────────────────
  const WIDGETS = {
    'music-player': {
      title: 'Music Player',
      render: renderMusicWidget,
      defaultConfig: { position: 'bottom-left' },
    },
    'weather': {
      title: 'Weather',
      render: renderWeatherWidget,
      defaultConfig: { city: 'New Delhi', units: 'C' },
    },
    'clock': {
      title: 'Clock',
      render: renderClockWidget,
      defaultConfig: { format: '24h' },
    },
    'calendar': {
      title: 'Calendar & To-Do',
      render: renderCalendarWidget,
      defaultConfig: {},
    },
    'reminder-panel': {
      title: 'Reminder Panel',
      render: renderReminderWidget,
      defaultConfig: {},
    },
  };

  // ── Toggle Widget On/Off ─────────────────────────────────
  function toggle(id, enabled, config = {}) {
    if (enabled) {
      mount(id, config);
    } else {
      unmount(id);
    }
  }

  function mount(id, config = {}) {
    if (registry[id]) return; // already mounted
    const def = WIDGETS[id];
    if (!def) return;
    const merged = { ...def.defaultConfig, ...config };
    const el = def.render(merged);
    if (!el) return;
    document.body.appendChild(el);
    registry[id] = { el, config: merged, intervals: [] };
    startWidgetLoop(id);
  }

  function unmount(id) {
    const entry = registry[id];
    if (!entry) return;
    entry.intervals.forEach(clearInterval);
    entry.el.remove();
    delete registry[id];
  }

  function startWidgetLoop(id) {
    if (id === 'clock') {
      const timer = setInterval(() => updateClock(id), 1000);
      if (registry[id]) registry[id].intervals.push(timer);
      updateClock(id);
    }
    if (id === 'weather') {
      fetchWeather(id);
    }
  }

  // ── Music Widget ─────────────────────────────────────────
  function renderMusicWidget() {
    const el = document.createElement('div');
    el.className = 'orion-widget music-widget';
    el.id = 'widget-music';
    el.innerHTML = `
      <div class="widget-header">
        <span class="widget-title">Music Player</span>
        <button class="widget-close-btn" data-id="music-player">✕</button>
      </div>
      <div class="widget-body">
        <div class="music-widget-track">
          <div class="music-widget-art">♪</div>
          <div class="music-widget-info">
            <span class="music-widget-name" id="wm-track-name">Love Me Like You Do</span>
            <span class="music-widget-artist" id="wm-track-artist">Ellie Goulding</span>
          </div>
        </div>
        <div class="music-widget-progress">
          <div class="music-widget-fill" id="wm-progress" style="width:38%"></div>
        </div>
        <div class="music-widget-controls">
          <button id="wm-prev">⏮</button>
          <button id="wm-play" data-playing="true">⏸</button>
          <button id="wm-next">⏭</button>
        </div>
      </div>
    `;
    bindMusicControls(el);
    bindCloseBtn(el);
    return el;
  }

  function bindMusicControls(el) {
    el.querySelector('#wm-play')?.addEventListener('click', (e) => {
      const playing = e.target.dataset.playing === 'true';
      e.target.textContent = playing ? '▶' : '⏸';
      e.target.dataset.playing = playing ? 'false' : 'true';
      window.orionApi && orionApi.musicControl(playing ? 'pause' : 'play');
    });
    el.querySelector('#wm-prev')?.addEventListener('click', () => window.orionApi && orionApi.musicControl('prev'));
    el.querySelector('#wm-next')?.addEventListener('click', () => window.orionApi && orionApi.musicControl('next'));
  }

  // ── Weather Widget ───────────────────────────────────────
  function renderWeatherWidget() {
    const el = document.createElement('div');
    el.className = 'orion-widget weather-widget';
    el.id = 'widget-weather-float';
    el.innerHTML = `
      <div class="widget-header">
        <span class="widget-title">Weather</span>
        <button class="widget-close-btn" data-id="weather">✕</button>
      </div>
      <div class="widget-body">
        <div class="weather-widget-main">
          <span class="weather-widget-temp" id="ww-temp-float">--°</span>
          <span class="weather-widget-icon" id="ww-icon-float">☁</span>
        </div>
        <div class="weather-widget-cond" id="ww-cond-float">Loading...</div>
        <div class="weather-widget-forecast" id="ww-forecast-float"></div>
      </div>
    `;
    bindCloseBtn(el);
    return el;
  }

  function fetchWeather(id) {
    if (!window.orionApi) return;
    orionApi.getWeather().then(data => {
      const suffix = id === 'weather' ? '' : '-float';
      const tempEl = document.getElementById('ww-temp' + suffix);
      const condEl = document.getElementById('ww-cond' + suffix);
      if (tempEl) tempEl.textContent = (data?.temp || '--') + '°';
      if (condEl) condEl.textContent = data?.condition || 'Cloudy';
    }).catch(() => { });
  }

  // ── Clock Widget ─────────────────────────────────────────
  function renderClockWidget() {
    const el = document.createElement('div');
    el.className = 'orion-widget clock-widget';
    el.id = 'widget-clock';
    el.innerHTML = `
      <div class="widget-body clock-widget-body">
        <div class="clock-widget-time" id="wc-time">00:00</div>
        <div class="clock-widget-date" id="wc-date">---</div>
      </div>
    `;
    return el;
  }

  function updateClock(id) {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('en-US', { weekday: 'long', month: '2-digit', day: '2-digit', year: 'numeric' });
    const timeEl = document.getElementById('wc-time');
    const dateEl = document.getElementById('wc-date');
    if (timeEl) timeEl.textContent = time;
    if (dateEl) dateEl.textContent = date;
  }

  // ── Calendar Widget ──────────────────────────────────────
  function renderCalendarWidget() {
    const el = document.createElement('div');
    el.className = 'orion-widget calendar-mini-widget';
    el.id = 'widget-calendar';
    const now = new Date();
    el.innerHTML = `
      <div class="widget-header">
        <span class="widget-title">Calendar</span>
        <button class="widget-close-btn" data-id="calendar">✕</button>
      </div>
      <div class="widget-body">
        <div class="cal-mini-month">${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
        <div class="cal-mini-today">Today: ${now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</div>
      </div>
    `;
    bindCloseBtn(el);
    return el;
  }

  // ── Reminder Widget ──────────────────────────────────────
  function renderReminderWidget() {
    const el = document.createElement('div');
    el.className = 'orion-widget reminder-panel-widget';
    el.id = 'widget-reminder-panel';
    el.innerHTML = `
      <div class="widget-header">
        <span class="widget-title">Reminders</span>
        <button class="widget-close-btn" data-id="reminder-panel">✕</button>
      </div>
      <div class="widget-body" id="widget-reminder-body">
        <div class="rp-item"><span class="rp-dot green"></span><span>Lecture</span><span class="rp-time">04:00</span></div>
        <div class="rp-item"><span class="rp-dot red"></span><span>Meeting</span><span class="rp-time">09:30</span></div>
        <div class="rp-item"><span class="rp-dot red"></span><span>Exercise</span><span class="rp-time">08:30</span></div>
      </div>
    `;
    bindCloseBtn(el);
    return el;
  }

  // ── Shared: close button ─────────────────────────────────
  function bindCloseBtn(el) {
    el.querySelectorAll('.widget-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const wid = btn.dataset.id;
        unmount(wid);
        // Sync toggle in settings/widgets page
        const toggle = document.querySelector(`.widget-toggle[data-widget="${wid}"]`);
        if (toggle) toggle.checked = false;
      });
    });
  }

  // ── Update music track info from voice pipeline ──────────
  function updateTrack(name, artist, progressPct) {
    const nameEl = document.getElementById('wm-track-name');
    const artistEl = document.getElementById('wm-track-artist');
    const progEl = document.getElementById('wm-progress');
    if (nameEl) nameEl.textContent = name || '';
    if (artistEl) artistEl.textContent = artist || '';
    if (progEl) progEl.style.width = (progressPct || 0) + '%';
  }

  // ── Init all toggles on widgets page ────────────────────
  function initToggles() {
    document.querySelectorAll('.widget-toggle').forEach(toggle => {
      toggle.addEventListener('change', () => {
        const id = toggle.dataset.widget;
        toggle.checked ? mount(id) : unmount(id);
        window.orionApi && orionApi.setWidgetEnabled(id, toggle.checked);
      });
    });
  }

  // ── Widget Config Modal ──────────────────────────────────
  function initConfigButtons() {
    document.querySelectorAll('.widget-config-btn').forEach(btn => {
      btn.addEventListener('click', () => openConfigModal(btn.dataset.widget));
    });
    document.getElementById('widget-config-close')?.addEventListener('click', closeConfigModal);
    document.getElementById('widget-config-cancel')?.addEventListener('click', closeConfigModal);
    document.getElementById('widget-config-apply')?.addEventListener('click', applyConfig);
  }

  function openConfigModal(id) {
    const modal = document.getElementById('widget-config-modal');
    const title = document.getElementById('widget-config-modal-title');
    const body = document.getElementById('widget-config-modal-body');
    if (!modal) return;

    const def = WIDGETS[id];
    if (title) title.textContent = 'Configure: ' + (def?.title || id);
    if (body) body.innerHTML = buildConfigForm(id);
    modal.style.display = 'flex';
    modal.dataset.widgetId = id;
  }

  function buildConfigForm(id) {
    if (id === 'weather') {
      return `
        <div class="form-field">
          <label>City</label>
          <input type="text" class="orion-input" id="cfg-weather-city" placeholder="New Delhi" value="New Delhi">
        </div>
        <div class="form-field">
          <label>Units</label>
          <select class="orion-select" id="cfg-weather-units">
            <option value="C">Celsius</option>
            <option value="F">Fahrenheit</option>
          </select>
        </div>
      `;
    }
    if (id === 'music-player') {
      return `
        <div class="form-field">
          <label>Default Source</label>
          <select class="orion-select" id="cfg-music-source">
            <option value="local">Local Files</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>
      `;
    }
    return `<p class="cfg-no-options">No configuration options for this widget.</p>`;
  }

  function closeConfigModal() {
    const modal = document.getElementById('widget-config-modal');
    if (modal) modal.style.display = 'none';
  }

  function applyConfig() {
    const modal = document.getElementById('widget-config-modal');
    const id = modal?.dataset.widgetId;
    if (!id) return;
    // Re-mount with new config if already mounted
    if (registry[id]) {
      const newCfg = gatherConfigFromForm(id);
      unmount(id);
      mount(id, newCfg);
    }
    closeConfigModal();
  }

  function gatherConfigFromForm(id) {
    if (id === 'weather') {
      return {
        city: document.getElementById('cfg-weather-city')?.value || 'New Delhi',
        units: document.getElementById('cfg-weather-units')?.value || 'C',
      };
    }
    return {};
  }

  // ── Public API ───────────────────────────────────────────
  function onEnter() {
    initToggles();
    initConfigButtons();
  }

  return { toggle, mount, unmount, updateTrack, onEnter };

})();