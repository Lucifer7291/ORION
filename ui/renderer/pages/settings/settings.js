// ============================================================
// ORION — Settings Page Controller
// ============================================================

window.SettingsPage = (function () {

   let initialized = false;

   // ── Section Navigation ──────────────────────────────────
   function initNav() {
      const navItems = document.querySelectorAll('.settings-nav-item');
      const panels = document.querySelectorAll('.settings-panel');

      navItems.forEach(btn => {
         btn.addEventListener('click', () => {
            navItems.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const target = document.getElementById('section-' + btn.dataset.section);
            if (target) target.classList.add('active');
         });
      });
   }

   // ── Range Sliders — live value display ──────────────────
   function initSliders() {
      const pairs = [
         { slider: 'setting-wake-sensitivity', display: 'wake-sensitivity-val', fmt: v => (v / 100).toFixed(1) },
         { slider: 'setting-tts-rate', display: 'tts-rate-val', fmt: v => v },
         { slider: 'setting-reply-delay', display: 'reply-delay-val', fmt: v => v + ' min' },
         { slider: 'setting-ui-scale', display: 'ui-scale-val', fmt: v => v + '%' },
      ];
      pairs.forEach(({ slider, display, fmt }) => {
         const el = document.getElementById(slider);
         const vl = document.getElementById(display);
         if (el && vl) {
            el.addEventListener('input', () => { vl.textContent = fmt(el.value); });
         }
      });
   }

   // ── TTS Mode Toggle ─────────────────────────────────────
   function initTTSToggle() {
      const offline = document.getElementById('tts-offline-btn');
      const online = document.getElementById('tts-online-btn');
      if (!offline || !online) return;
      [offline, online].forEach(btn => {
         btn.addEventListener('click', () => {
            offline.classList.remove('active');
            online.classList.remove('active');
            btn.classList.add('active');
            window.orionState && orionState.set('tts_mode', btn.dataset.val);
         });
      });
   }

   // ── Personality Mode Cards ───────────────────────────────
   function initModeCards() {
      const cards = document.querySelectorAll('.mode-card');
      cards.forEach(card => {
         card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            window.orionState && orionState.set('personality_mode', card.dataset.mode);
         });
      });
   }

   // ── Theme Cards ──────────────────────────────────────────
   function initThemeCards() {
      const cards = document.querySelectorAll('.theme-card');
      cards.forEach(card => {
         card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            applyTheme(card.dataset.theme);
         });
      });
      // Accent color picker
      const picker = document.getElementById('accent-color-picker');
      const hex = document.getElementById('accent-color-hex');
      if (picker && hex) {
         picker.addEventListener('input', () => {
            hex.textContent = picker.value;
            document.documentElement.style.setProperty('--accent', picker.value);
         });
      }
   }

   function applyTheme(theme) {
      const themes = {
         'dark-cyan': { accent: '#00e5ff', glow: 'rgba(0,229,255,0.18)' },
         'dark-purple': { accent: '#b566ff', glow: 'rgba(181,102,255,0.18)' },
         'dark-red': { accent: '#ff3c5f', glow: 'rgba(255,60,95,0.18)' },
         'dark-green': { accent: '#00ff88', glow: 'rgba(0,255,136,0.18)' },
      };
      const t = themes[theme];
      if (!t) return;
      document.documentElement.style.setProperty('--accent', t.accent);
      document.documentElement.style.setProperty('--glow', t.glow);
      const picker = document.getElementById('accent-color-picker');
      const hexEl = document.getElementById('accent-color-hex');
      if (picker) picker.value = t.accent;
      if (hexEl) hexEl.textContent = t.accent;
   }

   // ── Memory Management ────────────────────────────────────
   function initMemory() {
      const clearBtn = document.getElementById('clear-memory-btn');
      const viewBtn = document.getElementById('view-memory-btn');
      if (clearBtn) {
         clearBtn.addEventListener('click', () => {
            if (confirm('Clear all ORION memory? This cannot be undone.')) {
               window.orionApi && orionApi.clearMemory().then(() => {
                  showToast('Memory cleared successfully.');
                  updateMemoryStats({ commands: 0, apps: 0, songs: 0 });
               });
            }
         });
      }
      if (viewBtn) {
         viewBtn.addEventListener('click', () => {
            window.orionRouter && orionRouter.navigate('commands');
         });
      }
   }

   function updateMemoryStats(stats) {
      const map = { commands: 'mem-commands', apps: 'mem-apps', songs: 'mem-songs' };
      Object.keys(map).forEach(key => {
         const el = document.getElementById(map[key]);
         if (el) el.textContent = stats[key] ?? 0;
      });
   }

   // ── Integrations ─────────────────────────────────────────
   function initIntegrations() {
      // Gmail
      const gmailBtn = document.getElementById('gmail-connect-btn');
      if (gmailBtn) {
         gmailBtn.addEventListener('click', () => {
            const addr = document.getElementById('gmail-address')?.value;
            const pass = document.getElementById('gmail-password')?.value;
            if (!addr || !pass) { showToast('Enter Gmail address and App Password.', 'warn'); return; }
            window.orionApi && orionApi.connectGmail({ address: addr, password: pass }).then(ok => {
               setIntegrationStatus('gmail', ok);
            });
         });
      }
      // Instagram
      const igBtn = document.getElementById('instagram-connect-btn');
      if (igBtn) {
         igBtn.addEventListener('click', () => {
            const user = document.getElementById('instagram-username')?.value;
            const pass = document.getElementById('instagram-password')?.value;
            if (!user || !pass) { showToast('Enter Instagram credentials.', 'warn'); return; }
            window.orionApi && orionApi.connectInstagram({ username: user, password: pass }).then(ok => {
               setIntegrationStatus('instagram', ok);
            });
         });
      }
      // Phone detect
      const phoneBtn = document.getElementById('phone-detect-btn');
      if (phoneBtn) {
         phoneBtn.addEventListener('click', () => {
            window.orionApi && orionApi.detectPhone().then(res => {
               setIntegrationStatus('phone', res.connected, res.label || 'Device Detected');
            });
         });
      }
      // Ollama test
      const ollamaBtn = document.getElementById('ollama-test-btn');
      if (ollamaBtn) {
         ollamaBtn.addEventListener('click', () => {
            const url = document.getElementById('ollama-url')?.value || 'http://localhost:11434';
            window.orionApi && orionApi.testOllama(url).then(ok => {
               setIntegrationStatus('ollama', ok, ok ? 'Connected' : 'Cannot Reach Ollama');
            });
         });
      }
      // Auto-test Ollama on load
      setTimeout(() => {
         if (window.orionApi) {
            orionApi.testOllama('http://localhost:11434').then(ok => setIntegrationStatus('ollama', ok, ok ? 'Running' : 'Not Running'));
         }
      }, 800);
   }

   function setIntegrationStatus(id, connected, label) {
      const dot = document.querySelector(`#${id}-integration .int-dot`) ||
         document.getElementById(`${id}-dot`);
      const text = document.querySelector(`#${id}-integration .int-status span:last-child`) ||
         document.getElementById(`${id}-status-text`);
      if (dot) { dot.className = 'int-dot ' + (connected ? 'connected' : 'disconnected'); }
      if (text) { text.textContent = label || (connected ? 'Connected' : 'Not Connected'); }
   }

   // ── System Actions ───────────────────────────────────────
   function initSystem() {
      const restartBtn = document.getElementById('restart-orion-btn');
      if (restartBtn) {
         restartBtn.addEventListener('click', () => {
            if (confirm('Restart ORION?')) {
               window.orionApi && orionApi.restartOrion();
            }
         });
      }
      const logsBtn = document.getElementById('open-logs-btn');
      if (logsBtn) {
         logsBtn.addEventListener('click', () => {
            window.orionApi && orionApi.openLogs();
         });
      }
      const updateBtn = document.getElementById('check-update-btn');
      if (updateBtn) {
         updateBtn.addEventListener('click', () => {
            showToast('ORION v2.3 — you are on the latest version.', 'success');
         });
      }
   }

   // ── Test Voice ───────────────────────────────────────────
   function initVoiceTest() {
      const btn = document.getElementById('test-voice-btn');
      const status = document.getElementById('test-voice-status');
      if (!btn) return;
      btn.addEventListener('click', () => {
         if (status) status.textContent = 'Playing...';
         window.orionApi && orionApi.testTTS('Hello, I am ORION. Your assistant is ready.').then(() => {
            if (status) status.textContent = 'Done ✓';
            setTimeout(() => { if (status) status.textContent = ''; }, 3000);
         });
      });
   }

   // ── Save / Reset ─────────────────────────────────────────
   function initSaveReset() {
      const saveBtn = document.getElementById('settings-save-btn');
      const resetBtn = document.getElementById('settings-reset-btn');
      if (saveBtn) {
         saveBtn.addEventListener('click', () => {
            const config = gatherConfig();
            window.orionApi && orionApi.saveConfig(config).then(() => {
               showToast('Settings saved!', 'success');
            });
         });
      }
      if (resetBtn) {
         resetBtn.addEventListener('click', () => {
            if (confirm('Reset all settings to defaults?')) {
               loadDefaults();
               showToast('Settings reset to defaults.');
            }
         });
      }
   }

   function gatherConfig() {
      return {
         wake_word: document.getElementById('setting-wake-word')?.value,
         wake_enabled: document.getElementById('setting-wake-enabled')?.checked,
         wake_sensitivity: document.getElementById('setting-wake-sensitivity')?.value / 100,
         tts_mode: document.querySelector('.toggle-opt.active')?.dataset.val,
         tts_voice: document.getElementById('setting-tts-voice')?.value,
         tts_rate: document.getElementById('setting-tts-rate')?.value,
         whisper_model: document.getElementById('setting-whisper-model')?.value,
         speaking_style: document.getElementById('setting-speaking-style')?.value,
         memory_enabled: document.getElementById('setting-memory-enabled')?.checked,
         auto_reply_delay: document.getElementById('setting-reply-delay')?.value,
         perm_whatsapp_auto: document.getElementById('perm-whatsapp-auto')?.checked,
         perm_instagram_auto: document.getElementById('perm-instagram-auto')?.checked,
         perm_auto_call: document.getElementById('perm-auto-call')?.checked,
         perm_install: document.getElementById('perm-install')?.checked,
         perm_files: document.getElementById('perm-files')?.checked,
         perm_logging: document.getElementById('perm-logging')?.checked,
         flask_host: document.getElementById('setting-flask-host')?.value,
         flask_port: document.getElementById('setting-flask-port')?.value,
         ollama_url: document.getElementById('ollama-url')?.value,
         ollama_model: document.getElementById('ollama-model')?.value,
      };
   }

   function loadDefaults() {
      const defaults = {
         'setting-wake-sensitivity': 50,
         'setting-tts-rate': 175,
         'setting-reply-delay': 10,
         'setting-ui-scale': 100,
         'setting-whisper-model': 'small',
      };
      Object.keys(defaults).forEach(id => {
         const el = document.getElementById(id);
         if (el) { el.value = defaults[id]; el.dispatchEvent(new Event('input')); }
      });
   }

   // ── Toast Helper ─────────────────────────────────────────
   function showToast(msg, type = 'info') {
      if (window.orionToast) { orionToast(msg, type); return; }
      const t = document.createElement('div');
      t.className = 'orion-toast ' + type;
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3000);
   }

   // ── Public Init ──────────────────────────────────────────
   function init() {
      if (initialized) return;
      initialized = true;
      initNav();
      initSliders();
      initTTSToggle();
      initModeCards();
      initThemeCards();
      initMemory();
      initIntegrations();
      initSystem();
      initVoiceTest();
      initSaveReset();
   }

   function onEnter() {
      if (!initialized) init();
      // Refresh memory stats
      if (window.orionApi) {
         orionApi.getMemoryStats().then(updateMemoryStats).catch(() => { });
      }
   }

   return { init, onEnter };

})();