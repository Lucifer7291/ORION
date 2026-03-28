/* ============================================================
   ORION — Command Bar (src/layout/command-bar.js)
   Bottom command input and voice control strip
   ============================================================ */

function renderCommandBar() {
    const cmds = ORION.state.quickCmds;
    const cmdRows = cmds.map(c => `
    <div class="cmd-list-item">
      ${svgRefresh}
      <span class="cmd-label">${c.text}</span>
      <span class="cmd-meta">${c.date} &nbsp; ${c.time}</span>
    </div>
  `).join('');

    document.getElementById('command-bar').innerHTML = `
    <div class="cmd-section">
      <div class="quick-commands-header">
        <span>${svgChevronDown} Quick Commands .</span>
        ${svgChevronRight}
      </div>
      <div class="cmd-input-row">
        ${svgSearch}
        <input type="text" placeholder="Type a command..." id="cmd-input"
          onkeydown="if(event.key==='Enter') orionExecuteCommand()"/>
        <div class="cmd-actions">
          <button title="Voice Up">${svgSend}</button>
          <button title="Back">${svgChevronDown}</button>
          <button title="Send" onclick="orionExecuteCommand()">${svgSend}</button>
        </div>
      </div>
      <div class="cmd-history-list">${cmdRows}</div>
    </div>

    <div class="voice-btn-group">
      <button class="btn btn-ghost" onclick="orionStartListening()">
        ${svgMic} Start Listening
      </button>
      <button class="btn btn-ghost" onclick="orionSpeakText()">
        ${svgMic} Speak Text
      </button>
      <button class="btn btn-execute" onclick="orionExecuteCommand()">
        Execute.
      </button>
      <button class="btn btn-danger" onclick="orionStopListening()" style="font-size:10px;padding:7px 10px">
        ${svgMic} Stop
      </button>
      <button class="btn btn-ghost" style="min-width:unset;padding:7px 10px">
        ${svgSend}
      </button>
    </div>
  `;
}

function orionStartListening() {
    ORION.state.listening = true;
    ORION_API.startListening();
    showToast('🎙️ Listening...');
}

function orionStopListening() {
    ORION.state.listening = false;
    ORION_API.stopListening();
    showToast('🔇 Stopped listening');
}

function orionExecuteCommand() {
    const input = document.getElementById('cmd-input');
    const cmd = input?.value?.trim();
    if (!cmd) return;
    showToast(`⚡ Executing: ${cmd}`);
    ORION_API.executeCommand(cmd);
    ORION.state.quickCmds.unshift({ icon: 'play', text: cmd, date: '12/00/0000', time: ORION.state.time });
    if (input) input.value = '';
}

function orionSpeakText() {
    const input = document.getElementById('cmd-input');
    const text = input?.value?.trim();
    if (text) showToast(`🔊 Speaking: ${text}`);
}

function showToast(msg) {
    const t = document.createElement('div');
    t.style.cssText = `
    position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
    background:#071828; border:1px solid var(--border-glow);
    color:var(--accent-cyan); font-family:var(--font-body);
    font-size:12px; padding:8px 18px; border-radius:6px;
    z-index:9999; pointer-events:none;
    box-shadow: 0 0 12px #00d4ff44;
    animation: toastIn 0.2s ease;
  `;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
}