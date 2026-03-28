/* ============================================================
   ORION — Right Panel (src/layout/right-panel.js)
   ============================================================ */

function renderRightPanel() {
    const s = ORION.state;

    const cmdHistHTML = s.cmdHistory.map(c => `
    <div class="cmd-history-item">
      ${svgRefresh}
      <span class="cmd-text">${c.text}</span>
      <span class="cmd-time">${c.time}</span>
    </div>
  `).join('');

    // SVG gauge
    const pct = s.system.cpu;
    const r = 36; const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;

    document.getElementById('right-panel').innerHTML = `
    <!-- Memory & Personality -->
    <div class="right-panel-section">
      <div class="right-panel-section-header">
        Memory &amp; Personality ${svgChevronRight}
      </div>
      <div class="right-panel-section-body">
        <select class="mode-select" onchange="ORION.set('voice.mode', this.value)">
          <option>Normal Mode</option>
          <option>Focus Mode</option>
          <option>Night Mode</option>
          <option>Aggressive Mode</option>
        </select>
      </div>
    </div>

    <!-- Command History -->
    <div class="right-panel-section">
      <div class="right-panel-section-header">
        Command History ${svgChevronRight}
      </div>
      <div class="right-panel-section-body">
        ${cmdHistHTML}
      </div>
    </div>

    <!-- Voice Settings -->
    <div class="right-panel-section">
      <div class="right-panel-section-header">
        Voice Settings ${svgChevronRight}
      </div>
      <div class="right-panel-section-body">
        <div class="voice-setting-row">
          <span class="label">Voice</span>
          <span class="val" style="font-size:9px;color:var(--text-secondary)">Female (English) AI</span>
          <span class="link">${svgChevronRight}</span>
        </div>
        <div class="voice-setting-row">
          <span class="label">Wake Word: Orion</span>
          <label class="toggle" style="transform:scale(0.85)">
            <input type="checkbox" ${s.voice.wakeWord ? 'checked' : ''} onchange="ORION.set('voice.wakeWord', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="voice-setting-row">
          <span class="label">Speaking Style: Natural</span>
          <span class="link">${svgChevronRight}</span>
        </div>
      </div>
    </div>

    <!-- Plugin Manager -->
    <div class="right-panel-section">
      <div class="right-panel-section-header" style="border:none">
        Plugin Manager ${svgChevronRight}
      </div>
    </div>

    <!-- Clipboard History -->
    <div class="right-panel-section">
      <div class="right-panel-section-header" style="border:none">
        Clipboard History ${svgChevronRight}
      </div>
    </div>

    <!-- CPU Gauge -->
    <div class="right-panel-section">
      <div class="right-panel-section-body">
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;font-family:var(--font-hud)">Normal</div>
        <div class="cpu-gauge-wrap">
          <div class="cpu-gauge">
            <svg viewBox="0 0 90 90">
              <!-- Track -->
              <circle cx="45" cy="45" r="${r}" fill="none" stroke="#0d1f30" stroke-width="6"/>
              <!-- Red arc (high) -->
              <circle cx="45" cy="45" r="${r}" fill="none" stroke="#ff2d55" stroke-width="6"
                stroke-dasharray="${circ * 0.3} ${circ * 0.7}" stroke-dashoffset="${-circ * 0.7}"
                stroke-linecap="round" opacity="0.5"/>
              <!-- Cyan progress -->
              <circle cx="45" cy="45" r="${r}" fill="none" stroke="#00d4ff" stroke-width="6"
                stroke-dasharray="${dash} ${circ - dash}" stroke-linecap="round"
                style="filter:drop-shadow(0 0 4px #00d4ff)"/>
            </svg>
            <div class="cpu-gauge-val">
              <span class="val">${pct}%</span>
              <span class="lbl">CPU</span>
            </div>
          </div>
        </div>
        <div class="gauge-legend">
          <div class="gauge-legend-item"><span class="dot" style="background:#0d1f30;border:1px solid var(--border-dim)"></span>80M</div>
          <div class="gauge-legend-item"><span class="dot" style="background:var(--accent-cyan)"></span>${s.system.ram}%</div>
          <div class="gauge-legend-item"><span class="dot" style="background:#ff8c00"></span>50%</div>
          <div class="gauge-legend-item"><span class="dot" style="background:var(--accent-red)"></span>Battery</div>
        </div>
      </div>
    </div>
  `;
}