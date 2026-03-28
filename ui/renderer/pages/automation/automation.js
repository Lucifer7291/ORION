// ============================================================
// ORION — Automation Page Controller
// ============================================================

window.AutomationPage = (function () {

    let initialized = false;
    let pipelines = [];
    let buildingSteps = [];
    let editingId = null;

    const ACTION_LABELS = {
        open_app: 'Open App',
        open_browser: 'Open URL in Browser',
        search: 'Search on Web',
        type_text: 'Type Text',
        click: 'Click Element',
        wait: 'Wait',
        play_music: 'Play Music',
        send_whatsapp: 'Send WhatsApp',
        send_email: 'Send Email',
        shutdown: 'Shutdown / Restart PC',
        voice_say: 'ORION Says',
        run_command: 'Run Custom Command',
    };

    // ── Init ─────────────────────────────────────────────────
    function init() {
        if (initialized) return;
        initialized = true;

        initNewPipelineBtn();
        initBuilderControls();
        bindCardActions();
        initExecLog();
    }

    // ── New Pipeline Button ──────────────────────────────────
    function initNewPipelineBtn() {
        const topBtn = document.getElementById('automation-new-btn');
        const cardBtn = document.getElementById('new-pipeline-card-btn');
        [topBtn, cardBtn].forEach(btn => {
            btn?.addEventListener('click', openBuilder);
        });
    }

    function openBuilder(existingPipeline) {
        buildingSteps = existingPipeline?.steps ? [...existingPipeline.steps] : [];
        editingId = existingPipeline?.id ?? null;

        const nameInput = document.getElementById('pipeline-name');
        if (nameInput) nameInput.value = existingPipeline?.name || '';

        renderBuilderSteps();
        document.getElementById('pipeline-builder').style.display = 'block';
        document.getElementById('automation-grid').style.opacity = '0.4';
        nameInput?.focus();
    }

    function closeBuilder() {
        document.getElementById('pipeline-builder').style.display = 'none';
        document.getElementById('automation-grid').style.opacity = '1';
        buildingSteps = [];
        editingId = null;
    }

    // ── Builder Controls ─────────────────────────────────────
    function initBuilderControls() {
        document.getElementById('builder-cancel-btn')?.addEventListener('click', closeBuilder);

        document.getElementById('add-step-btn')?.addEventListener('click', () => {
            const sel = document.getElementById('step-action-select');
            if (!sel?.value) { showToast('Select an action first.', 'warn'); return; }
            const action = sel.value;
            const param = promptStepParam(action);
            buildingSteps.push({ action, param });
            sel.value = '';
            renderBuilderSteps();
        });

        document.getElementById('builder-save-btn')?.addEventListener('click', savePipeline);
        document.getElementById('builder-test-btn')?.addEventListener('click', testRun);
    }

    function promptStepParam(action) {
        const prompts = {
            open_app: 'App name or path (e.g. notepad, chrome):',
            open_browser: 'URL (e.g. https://youtube.com):',
            search: 'Search query:',
            type_text: 'Text to type:',
            click: 'Element description or coordinates:',
            wait: 'Seconds to wait:',
            play_music: 'Song or playlist name:',
            send_whatsapp: 'Contact name | Message:',
            send_email: 'To | Subject | Body:',
            shutdown: 'shutdown or restart:',
            voice_say: 'Text for ORION to say:',
            run_command: 'Shell command:',
        };
        return prompt(prompts[action] || 'Parameter:') || '';
    }

    function renderBuilderSteps() {
        const container = document.getElementById('pipeline-steps');
        const empty = document.getElementById('steps-empty');
        if (!container) return;

        // Clear existing steps
        container.querySelectorAll('.builder-step').forEach(el => el.remove());

        if (buildingSteps.length === 0) {
            if (empty) empty.style.display = 'block';
            return;
        }
        if (empty) empty.style.display = 'none';

        buildingSteps.forEach((step, i) => {
            const div = document.createElement('div');
            div.className = 'builder-step';
            div.innerHTML = `
        <span class="builder-step-num">${i + 1}</span>
        <span class="builder-step-action">${ACTION_LABELS[step.action] || step.action}</span>
        <span class="builder-step-param">${escHtml(step.param || '')}</span>
        <button class="btn-icon-sm step-delete-btn" data-index="${i}" title="Remove">✕</button>
      `;
            div.querySelector('.step-delete-btn').addEventListener('click', (e) => {
                buildingSteps.splice(parseInt(e.currentTarget.dataset.index), 1);
                renderBuilderSteps();
            });
            container.appendChild(div);
        });
    }

    function savePipeline() {
        const name = document.getElementById('pipeline-name')?.value?.trim();
        if (!name) { showToast('Give your pipeline a name.', 'warn'); return; }
        if (buildingSteps.length === 0) { showToast('Add at least one step.', 'warn'); return; }

        if (editingId !== null) {
            const idx = pipelines.findIndex(p => p.id === editingId);
            if (idx !== -1) pipelines[idx] = { ...pipelines[idx], name, steps: [...buildingSteps] };
        } else {
            const newId = Math.max(0, ...pipelines.map(p => p.id), 3) + 1;
            pipelines.push({ id: newId, name, steps: [...buildingSteps], enabled: true, trigger: 'Manual' });
        }

        closeBuilder();
        renderPipelineCards();
        showToast('Pipeline saved!', 'success');
        window.orionApi && orionApi.savePipeline({ name, steps: buildingSteps });
    }

    // ── Run / Test ───────────────────────────────────────────
    function testRun() {
        if (buildingSteps.length === 0) { showToast('Add steps first.', 'warn'); return; }
        showToast(`Test run: ${buildingSteps.length} step(s) queued...`, 'info');
        window.orionApi && orionApi.runPipeline({ steps: buildingSteps, test: true });
    }

    function runPipeline(id) {
        const p = pipelines.find(p => p.id === id);
        if (!p) return;
        showToast(`Running: ${p.name}...`, 'info');
        addExecLog({ name: p.name, status: 'Running...', time: 'Just now', type: 'running' });
        window.orionApi && orionApi.runPipeline({ id }).then(result => {
            const success = result?.success !== false;
            addExecLog({
                name: p.name,
                status: success ? `Completed (${p.steps.length}/${p.steps.length} steps)` : 'Failed',
                time: 'Just now',
                type: success ? 'success' : 'error',
            });
        });
    }

    // ── Card Rendering ───────────────────────────────────────
    function renderPipelineCards() {
        const grid = document.getElementById('automation-grid');
        if (!grid) return;
        // Remove existing cards (keep placeholder)
        grid.querySelectorAll('.pipeline-card:not(.new-pipeline-placeholder)').forEach(el => el.remove());
        // Prepend cards
        const placeholder = document.getElementById('new-pipeline-placeholder');
        pipelines.forEach(p => {
            const card = buildPipelineCard(p);
            grid.insertBefore(card, placeholder);
        });
        bindCardActions();
    }

    function buildPipelineCard(p) {
        const card = document.createElement('div');
        card.className = 'pipeline-card';
        card.dataset.id = p.id;

        const icons = ['⚡', '🎵', '🌙', '🤖', '📋', '🎯', '⚙️'];
        const icon = icons[p.id % icons.length];
        const preview = p.steps.slice(0, 3).map(s => `<span class="step-preview-tag">${ACTION_LABELS[s.action] || s.action}</span>`).join('<span class="step-arrow">→</span>');

        card.innerHTML = `
      <div class="pipeline-card-header">
        <div class="pipeline-icon">${icon}</div>
        <div class="pipeline-meta">
          <h3 class="pipeline-title">${escHtml(p.name)}</h3>
          <span class="pipeline-steps-count">${p.steps.length} step${p.steps.length !== 1 ? 's' : ''}</span>
        </div>
        <label class="toggle-switch small">
          <input type="checkbox" class="pipeline-toggle" data-id="${p.id}" ${p.enabled ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="pipeline-steps-preview">${preview}</div>
      <div class="pipeline-card-footer">
        <span class="pipeline-trigger">${p.trigger || 'Manual'}</span>
        <div class="pipeline-card-actions">
          <button class="btn-icon-sm pipeline-run-btn"  data-id="${p.id}" title="Run">▶</button>
          <button class="btn-icon-sm pipeline-edit-btn" data-id="${p.id}" title="Edit">✎</button>
          <button class="btn-icon-sm pipeline-del-btn"  data-id="${p.id}" title="Delete">✕</button>
        </div>
      </div>
    `;
        return card;
    }

    // ── Card Event Binding ───────────────────────────────────
    function bindCardActions() {
        document.querySelectorAll('.pipeline-run-btn').forEach(btn => {
            btn.onclick = () => runPipeline(parseInt(btn.dataset.id));
        });
        document.querySelectorAll('.pipeline-edit-btn').forEach(btn => {
            btn.onclick = () => {
                const p = pipelines.find(p => p.id === parseInt(btn.dataset.id));
                if (p) openBuilder(p);
            };
        });
        document.querySelectorAll('.pipeline-del-btn').forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.dataset.id);
                pipelines = pipelines.filter(p => p.id !== id);
                renderPipelineCards();
                window.orionApi && orionApi.deletePipeline(id);
                showToast('Pipeline deleted.');
            };
        });
        document.querySelectorAll('.pipeline-toggle').forEach(toggle => {
            toggle.onchange = () => {
                const id = parseInt(toggle.dataset.id);
                const p = pipelines.find(p => p.id === id);
                if (p) p.enabled = toggle.checked;
                window.orionApi && orionApi.togglePipeline(id, toggle.checked);
            };
        });
    }

    // ── Execution Log ─────────────────────────────────────────
    function initExecLog() {
        document.getElementById('clear-exec-log-btn')?.addEventListener('click', () => {
            const list = document.getElementById('exec-log-list');
            if (list) list.innerHTML = '<div class="empty-state"><span>No executions yet</span></div>';
        });
    }

    function addExecLog({ name, status, time, type }) {
        const list = document.getElementById('exec-log-list');
        if (!list) return;
        const iconMap = { success: '✓', error: '✕', warning: '⚠', running: '…', info: 'ℹ' };
        const item = document.createElement('div');
        item.className = `exec-log-item ${type}`;
        item.innerHTML = `
      <span class="exec-log-icon">${iconMap[type] || 'ℹ'}</span>
      <span class="exec-log-name">${escHtml(name)}</span>
      <span class="exec-log-status">${escHtml(status)}</span>
      <span class="exec-log-time">${escHtml(time)}</span>
    `;
        list.prepend(item);
    }

    // ── Helpers ──────────────────────────────────────────────
    function escHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function showToast(msg, type = 'info') {
        if (window.orionToast) { orionToast(msg, type); return; }
        const t = document.createElement('div');
        t.className = 'orion-toast ' + type;
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    // ── Public ───────────────────────────────────────────────
    function onEnter() {
        if (!initialized) init();
        if (window.orionApi) {
            orionApi.getPipelines().then(data => {
                if (data && data.length) { pipelines = data; renderPipelineCards(); }
            }).catch(() => { });
        }
    }

    return { init, onEnter };

})();