/* ============================================================
   ORION — Dashboard Page (src/pages/dashboard/dashboard.js)
   The Home HUD / circular ORION interface (home_ui.jpeg)
   ============================================================ */

function renderDashboard() {
    const s = ORION.state;

    const leftHex = ['This PC', 'Settings', 'Control Panel', 'Brave', 'At Folder', 'Vemase Vrade Manager', 'Downloads', 'Documents', 'Documents'];
    const rightHex = ['YouTube', 'GitHub', 'AnyDesk', 'GitHub', 'Notion', 'GitHub', 'Brave', 'Netflix', 'Brave', 'Facebook', 'Whatsapp'];
    const radialLabels = ['WhatsApp', 'Dashboard', 'Commands', 'None', 'None', 'Chid', 'Tool', 'Widgets'];

    const leftHexHTML = leftHex.map((name, i) => `
    <div class="hex-btn" onclick="showToast('Opening ${name}...')"
      style="position:absolute;${hexPos(i, 'left')}">
      ${name}
    </div>
  `).join('');

    const rightHexHTML = rightHex.slice(0, 8).map((name, i) => `
    <div class="hex-btn" onclick="showToast('Opening ${name}...')"
      style="position:absolute;${hexPos(i, 'right')}">
      ${name}
    </div>
  `).join('');

    document.getElementById('page-dashboard').innerHTML = `
    <style>
      #page-dashboard {
        position:relative;
        height:calc(100vh - var(--header-height) - 90px);
        overflow:hidden;
        display:flex; align-items:center; justify-content:center;
      }

      /* Stats top-left */
      .hud-stats {
        position:absolute; top:10px; left:10px;
        display:flex; flex-direction:column; gap:6px;
      }
      .hud-stat-row {
        display:flex; align-items:center; gap:8px;
        font-family:var(--font-hud); font-size:11px;
      }
      .hud-stat-label { color:var(--text-secondary); width:45px; }
      .stat-bar { width:80px; height:5px; background:#0d1f30; border-radius:2px; overflow:hidden; }
      .stat-fill { height:100%; border-radius:2px; }
      .stat-fill.cpu { background:var(--accent-red); box-shadow:0 0 6px var(--accent-red); width:${s.system.cpu}%; }
      .stat-fill.ram { background:var(--accent-cyan); box-shadow:0 0 6px var(--accent-cyan); width:${s.system.ram}%; }
      .stat-fill.bat { background:var(--accent-green); box-shadow:0 0 6px var(--accent-green); width:${s.system.battery}%; }
      .stat-val { color:var(--text-primary); font-size:11px; }
      .hud-net { font-family:var(--font-hud); font-size:10px; color:var(--text-muted); margin-top:2px; }

      /* Hex buttons */
      .hex-btn {
        width:74px; height:64px;
        clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
        background: #071828;
        border:none;
        display:flex; align-items:center; justify-content:center;
        text-align:center;
        font-family:var(--font-body); font-size:9.5px; font-weight:500;
        color:var(--text-secondary);
        cursor:pointer;
        transition:var(--transition);
        line-height:1.2; padding:0 6px;
        outline:1px solid var(--border-dim);
      }
      .hex-btn:hover {
        background:#0d3a5a; color:var(--accent-cyan);
        filter:drop-shadow(0 0 6px var(--accent-cyan));
      }

      /* Central ORION ring */
      .orion-hub {
        position:relative;
        width:340px; height:340px;
        display:flex; align-items:center; justify-content:center;
        flex-shrink:0;
      }
      .hub-ring-outer {
        position:absolute; inset:0; border-radius:50%;
        border:2px solid var(--accent-cyan);
        box-shadow: 0 0 20px var(--accent-cyan), inset 0 0 20px #00d4ff11;
        animation: hubPulse 3s ease-in-out infinite;
      }
      .hub-ring-mid {
        position:absolute; inset:30px; border-radius:50%;
        border:1px solid #0d3a5a;
      }
      .hub-ring-inner {
        position:absolute; inset:60px; border-radius:50%;
        background: radial-gradient(circle, #010e1f 60%, #03213a 100%);
        border:1px solid var(--border-dim);
        display:flex; flex-direction:column;
        align-items:center; justify-content:center;
        gap:4px;
      }
      @keyframes hubPulse {
        0%,100% { box-shadow: 0 0 15px var(--accent-cyan), inset 0 0 15px #00d4ff11; }
        50%      { box-shadow: 0 0 30px var(--accent-cyan), inset 0 0 30px #00d4ff22; }
      }
      .hub-mic-icon {
        font-size:28px; color:var(--accent-cyan);
        filter:drop-shadow(0 0 8px var(--accent-cyan));
      }
      .hub-name {
        font-family:var(--font-hud); font-size:11px; font-weight:700;
        color:var(--accent-cyan); letter-spacing:2px;
      }
      .hub-status {
        font-family:var(--font-mono); font-size:9px; color:var(--text-muted);
        letter-spacing:1px;
      }
      .hub-cpu-bar {
        width:60px; height:3px; background:#0d1f30; border-radius:2px; margin-top:4px;
        overflow:hidden;
      }
      .hub-cpu-fill {
        height:100%; background:var(--accent-cyan); border-radius:2px;
        width:${s.system.cpu}%;
      }

      /* Radial labels */
      .hub-radial-label {
        position:absolute;
        font-family:var(--font-hud); font-size:9px; font-weight:700;
        color:var(--accent-red); letter-spacing:1px;
        transform-origin:center;
      }

      /* Hex left/right containers */
      .hex-left, .hex-right {
        position:absolute;
        width:220px; height:400px;
        pointer-events:none;
      }
      .hex-left { left:-240px; top:50%; transform:translateY(-50%); }
      .hex-right { right:-240px; top:50%; transform:translateY(-50%); }
      .hex-left .hex-btn,
      .hex-right .hex-btn { pointer-events:all; }

      /* Execute button */
      .hub-execute {
        position:absolute; bottom:-50px; left:50%; transform:translateX(-50%);
        width:60px; height:52px;
        clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
        background:#3d000e;
        border:none; cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        font-family:var(--font-hud); font-size:8px; color:var(--accent-red);
        letter-spacing:1px; font-weight:700;
        transition:var(--transition);
      }
      .hub-execute:hover { background:var(--accent-red); color:#fff; }

      /* Warning */
      .hub-warning {
        position:absolute; top:-70px; left:50%; transform:translateX(-50%);
        text-align:center;
        font-family:var(--font-hud); font-size:11px;
        white-space:nowrap;
      }
      .hub-warning .warn-title { color:var(--accent-red); font-weight:700; letter-spacing:2px; }
      .hub-warning .warn-sub { color:var(--text-secondary); font-size:9px; margin-top:2px; }

      /* Music bottom-left */
      .hud-music {
        position:absolute; bottom:10px; left:10px;
        display:flex; align-items:center; gap:10px;
        width:200px;
      }
      .hud-music-thumb {
        width:52px; height:52px; border-radius:6px;
        background:linear-gradient(135deg,#0d3a5a,#001f35);
        border:1px solid var(--border-dim);
        display:flex;align-items:center;justify-content:center;
        font-size:20px; flex-shrink:0;
      }
      .hud-music-info .track { font-size:11px; font-weight:600; color:var(--text-primary); }
      .hud-music-info .artist { font-size:10px; color:var(--text-secondary); }
      .hud-music-controls { display:flex; gap:8px; margin-top:5px; }
      .hud-music-controls button {
        background:none;border:none;cursor:pointer;
        color:var(--text-secondary); padding:0;
      }
      .hud-music-controls button:hover { color:var(--accent-cyan); }
      .hud-music-controls button svg { width:14px; height:14px; }
      .hud-music-waveform {
        display:flex; align-items:flex-end; gap:1.5px;
        height:16px; width:60px; margin-top:4px;
      }
      .hud-music-waveform .bar {
        flex:1; background:var(--accent-cyan); border-radius:1px;
        animation:wave 1.2s ease-in-out infinite;
      }

      /* Weather top-left */
      .hud-weather {
        position:absolute; top:10px; right:10px;
        font-family:var(--font-hud);
      }
      .hud-weather .temp { font-size:22px; color:var(--text-primary); }
      .hud-weather .cond { font-size:11px; color:var(--text-secondary); }

      /* Reminders top-right */
      .hud-reminders {
        position:absolute; top:10px; right:10px;
        min-width:160px;
      }
      .hud-rem-title { font-family:var(--font-hud); font-size:11px; color:var(--text-primary); margin-bottom:6px; letter-spacing:1px; }
      .hud-rem-item {
        display:flex; align-items:center; gap:8px;
        font-size:10px; color:var(--text-secondary); margin-bottom:4px;
      }
      .hud-rem-item .dot { width:5px;height:5px;border-radius:50%;background:var(--accent-cyan);flex-shrink:0; }
      .hud-rem-item .lbl { flex:1; }
      .hud-rem-item .t { font-family:var(--font-mono); font-size:9px; color:var(--text-muted); }
      .hud-rem-item .x { color:var(--accent-red); font-size:10px; cursor:pointer; }

      /* ToDo bottom-right */
      .hud-todos {
        position:absolute; bottom:10px; right:10px;
        min-width:200px;
      }
      .hud-todos-title { font-family:var(--font-hud); font-size:11px; color:var(--text-primary); margin-bottom:6px; letter-spacing:1px; }
      .hud-todo-item {
        display:flex; align-items:center; gap:8px;
        font-size:10px; color:var(--text-secondary); margin-bottom:5px;
      }
      .hud-todo-item svg { color:var(--accent-cyan); flex-shrink:0; }

      /* Left sidebar icons */
      .hud-side-icons {
        position:absolute; left:10px; top:50%; transform:translateY(-50%);
        display:flex; flex-direction:column; gap:12px;
      }
      .hud-side-icon {
        width:28px; height:28px; border-radius:50%;
        background:#071828; border:1px solid var(--border-dim);
        display:flex; align-items:center; justify-content:center;
        cursor:pointer; transition:var(--transition); color:var(--text-muted);
      }
      .hud-side-icon:hover { border-color:var(--accent-cyan); color:var(--accent-cyan); }
      .hud-side-icon svg { width:14px; height:14px; }
    </style>

    <!-- Weather top-left -->
    <div style="position:absolute;top:10px;left:10px;font-family:var(--font-hud)">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:22px;color:var(--text-primary);font-weight:700">${s.weather.temp}</span>
        <span style="font-size:20px">🌥️</span>
      </div>
      <div style="font-size:11px;color:var(--text-secondary)">${s.weather.condition}</div>
    </div>

    <!-- Date/Time center top -->
    <div style="position:absolute;top:10px;left:50%;transform:translateX(-50%);text-align:center">
      <div style="font-family:'Orbitron',monospace;font-size:20px;color:var(--accent-cyan);font-weight:300;letter-spacing:2px">Thursday</div>
      <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);letter-spacing:2px">12/08/2026</div>
      <div style="font-family:'Orbitron',monospace;font-size:36px;font-weight:700;color:var(--accent-cyan);line-height:1;text-shadow:0 0 20px var(--accent-cyan)" class="live-time">${s.time}</div>
    </div>

    <!-- Reminders top-right -->
    <div class="hud-reminders">
      <div class="hud-rem-title">Reminder</div>
      ${s.reminders.map(r => `
        <div class="hud-rem-item">
          <span class="dot" style="${r.done ? '' : 'background:var(--accent-red)'}"></span>
          <span class="lbl">${r.label} :</span>
          <span class="t">${r.time}</span>
          <span class="x">✕</span>
        </div>
      `).join('')}
    </div>

    <!-- Stats top-left -->
    <div class="hud-stats" style="top:80px">
      <div class="hud-stat-row">
        <span class="hud-stat-label">CPU :</span>
        <div class="stat-bar"><div class="stat-fill cpu"></div></div>
        <span class="stat-val">${s.system.cpu}%</span>
      </div>
      <div class="hud-stat-row">
        <span class="hud-stat-label">RAM :</span>
        <div class="stat-bar"><div class="stat-fill ram"></div></div>
        <span class="stat-val">${s.system.ram}%</span>
      </div>
      <div class="hud-stat-row">
        <span class="hud-stat-label">Battery :</span>
        <div class="stat-bar"><div class="stat-fill bat"></div></div>
        <span class="stat-val">${s.system.battery}%</span>
      </div>
      <div class="hud-net">Net Speed : ${s.system.netSpeed}</div>
    </div>

    <!-- Side icons -->
    <div class="hud-side-icons" style="top:180px">
      <div class="hud-side-icon">${svgRefresh}</div>
      <div class="hud-side-icon">${svgClock}</div>
      <div class="hud-side-icon" style="width:28px;height:28px">${svgApps}</div>
    </div>

    <!-- Left Hex Grid -->
    <div style="position:absolute;left:180px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:4px;align-items:flex-end">
      ${leftHex.slice(0, 7).map((name, i) => `
        <div class="hex-btn" style="transform:translateX(${i % 2 === 0 ? 0 : 36}px)" onclick="showToast('Opening ${name}...')">
          ${name}
        </div>
      `).join('')}
    </div>

    <!-- Central Hub -->
    <div class="orion-hub">
      <div class="hub-ring-outer"></div>
      <div class="hub-ring-mid"></div>

      <!-- Radial text labels (rotated around ring) -->
      <svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 340 340">
        <defs>
          <path id="topArc" d="M 50,170 A 120,120 0 0,1 290,170"/>
          <path id="botArc" d="M 290,170 A 120,120 0 0,1 50,170"/>
        </defs>
        <text fill="#ff2d55" font-family="Orbitron" font-size="10" font-weight="700" letter-spacing="4">
          <textPath href="#topArc" startOffset="5%">WhatsApp &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Dashboard</textPath>
        </text>
        <text fill="#ff2d55" font-family="Orbitron" font-size="10" font-weight="700" letter-spacing="4">
          <textPath href="#botArc" startOffset="5%">Commands &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Widgets</textPath>
        </text>
        <!-- Tick marks -->
        ${Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
        const r1 = 158, r2 = 165, cx = 170, cy = 170;
        return `<line x1="${cx + r1 * Math.cos(angle)}" y1="${cy + r1 * Math.sin(angle)}" x2="${cx + r2 * Math.cos(angle)}" y2="${cy + r2 * Math.sin(angle)}" stroke="#00d4ff55" stroke-width="1"/>`;
    }).join('')}
      </svg>

      <div class="hub-ring-inner">
        <div class="hub-mic-icon">${svgMic}</div>
        <div class="hub-name">O.R.I.O.N</div>
        <div class="hub-status">Listening ...</div>
        <div class="hub-cpu-bar"><div class="hub-cpu-fill"></div></div>
      </div>

      <!-- Warning banner -->
      <div class="hub-warning">
        <div class="warn-title">!!! WARNING !!!</div>
        <div class="warn-sub">Apps Launcher is Not Working ...</div>
      </div>

      <!-- Execute button -->
      <button class="hub-execute" onclick="orionExecuteCommand()">Execute</button>
    </div>

    <!-- Right Hex Grid -->
    <div style="position:absolute;right:160px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:4px;">
      ${rightHex.slice(0, 7).map((name, i) => `
        <div class="hex-btn" style="transform:translateX(${i % 2 === 0 ? 0 : -36}px)" onclick="showToast('Opening ${name}...')">
          ${name}
        </div>
      `).join('')}
    </div>

    <!-- ToDo bottom-right -->
    <div class="hud-todos">
      <div class="hud-todos-title">To-Do List</div>
      ${s.calendar.todos.map(t => `
        <div class="hud-todo-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
          <span>${t.text} ${t.tag ? `<span style="color:var(--text-muted)">(${t.tag})</span>` : ''}</span>
        </div>
      `).join('')}
    </div>

    <!-- Music bottom-left -->
    <div class="hud-music">
      <div class="hud-music-thumb">🎵</div>
      <div class="hud-music-info">
        <div class="track">${s.music.track}</div>
        <div class="artist">${s.music.artist}</div>
        <div class="hud-music-waveform">
          ${Array.from({ length: 12 }, (_, i) => `<div class="bar" style="animation-delay:${i * 0.1}s;height:${40 + Math.random() * 60}%"></div>`).join('')}
        </div>
        <div class="hud-music-controls">
          <button>${svgSkipBack}</button>
          <button>${svgPause}</button>
          <button>${svgSkipFwd}</button>
        </div>
      </div>
    </div>
  `;
}

function hexPos(i, side) {
    // Simple staggered hex layout positions
    const rows = [
        { top: 30 }, { top: 98 }, { top: 166 }, { top: 234 },
        { top: 302 }, { top: 370 }, { top: 438 }, { top: 506 }, { top: 574 }
    ];
    const row = rows[i] || rows[0];
    const offset = i % 2 === 0 ? 0 : 38;
    const left = side === 'left' ? 0 + offset : offset;
    return `top:${row.top}px;left:${left}px`;
}