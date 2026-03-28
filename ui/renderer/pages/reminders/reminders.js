// ============================================================
// ORION — Reminders Page Controller
// ============================================================

window.RemindersPage = (function () {

    let initialized = false;
    let reminders = [];
    let editingId = null;
    let currentFilter = 'all';

    // ── Sample Data (replaced by API on real build) ──────────
    const SAMPLE = [
        { id: 1, label: 'Lecture', note: 'Review notes', time: '04:00', repeat: 'daily', status: 'active', date: todayStr() },
        { id: 2, label: 'Meeting', note: 'Team standup', time: '09:30', repeat: 'weekdays', status: 'missed', date: todayStr() },
        { id: 3, label: 'Exercise', note: 'Morning workout', time: '08:30', repeat: 'daily', status: 'missed', date: todayStr() },
        { id: 4, label: 'Doctor Appointment', note: 'City Hospital — Block C', time: '11:00', repeat: 'none', status: 'upcoming', date: tomorrowStr() },
    ];

    function todayStr() { return new Date().toISOString().slice(0, 10); }
    function tomorrowStr() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }

    // ── Init ─────────────────────────────────────────────────
    function init() {
        if (initialized) return;
        initialized = true;
        reminders = [...SAMPLE];

        initAddForm();
        initFilters();
        bindListEvents();
        setDateDefaults();
    }

    // ── Add Reminder Form ────────────────────────────────────
    function initAddForm() {
        const addBtn = document.getElementById('add-reminder-btn');
        const cancelBtn = document.getElementById('cancel-reminder-btn');
        const saveBtn = document.getElementById('save-reminder-btn');
        const form = document.getElementById('reminder-form');

        addBtn?.addEventListener('click', () => {
            editingId = null;
            clearForm();
            form.style.display = 'block';
            document.getElementById('reminder-label')?.focus();
        });

        cancelBtn?.addEventListener('click', () => {
            form.style.display = 'none';
            editingId = null;
        });

        saveBtn?.addEventListener('click', () => {
            const label = document.getElementById('reminder-label')?.value?.trim();
            const time = document.getElementById('reminder-time')?.value;
            const date = document.getElementById('reminder-date')?.value;
            const repeat = document.getElementById('reminder-repeat')?.value;
            const note = document.getElementById('reminder-note')?.value?.trim();

            if (!label || !time) {
                showToast('Label and time are required.', 'warn');
                return;
            }

            if (editingId !== null) {
                const idx = reminders.findIndex(r => r.id === editingId);
                if (idx !== -1) reminders[idx] = { ...reminders[idx], label, time, date, repeat, note };
            } else {
                const newId = Math.max(0, ...reminders.map(r => r.id)) + 1;
                reminders.push({ id: newId, label, time, date: date || todayStr(), repeat, note, status: 'upcoming' });
            }

            form.style.display = 'none';
            editingId = null;
            renderList();
            showToast('Reminder saved!', 'success');

            // Sync with API
            window.orionApi && orionApi.saveReminder({ label, time, date, repeat, note });
        });
    }

    function clearForm() {
        ['reminder-label', 'reminder-note'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const timeEl = document.getElementById('reminder-time');
        const repeatEl = document.getElementById('reminder-repeat');
        if (timeEl) timeEl.value = '08:00';
        if (repeatEl) repeatEl.value = 'none';
        setDateDefaults();
    }

    function setDateDefaults() {
        const dateEl = document.getElementById('reminder-date');
        if (dateEl) dateEl.value = todayStr();
    }

    // ── Filters ──────────────────────────────────────────────
    function initFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderList();
            });
        });
    }

    // ── Render ───────────────────────────────────────────────
    function renderList() {
        const container = document.getElementById('reminders-list');
        if (!container) return;

        const filtered = filterReminders(reminders, currentFilter);
        const grouped = groupByDate(filtered);

        container.innerHTML = '';
        if (Object.keys(grouped).length === 0) {
            container.innerHTML = '<div class="empty-state"><span>No reminders found</span></div>';
            return;
        }

        Object.keys(grouped).sort().forEach(dateKey => {
            const group = document.createElement('div');
            group.className = 'reminders-date-group';
            const label = formatDateLabel(dateKey);
            group.innerHTML = `<h4 class="reminders-date-label">${label}</h4>`;
            grouped[dateKey].forEach(r => {
                group.appendChild(buildReminderCard(r));
            });
            container.appendChild(group);
        });

        bindListEvents();
    }

    function filterReminders(list, filter) {
        if (filter === 'all') return list;
        if (filter === 'today') return list.filter(r => r.date === todayStr());
        if (filter === 'active') return list.filter(r => r.status === 'active' || r.status === 'upcoming');
        if (filter === 'completed') return list.filter(r => r.status === 'completed');
        return list;
    }

    function groupByDate(list) {
        return list.reduce((acc, r) => {
            const key = r.date || todayStr();
            if (!acc[key]) acc[key] = [];
            acc[key].push(r);
            return acc;
        }, {});
    }

    function formatDateLabel(dateStr) {
        const today = todayStr();
        const tomorrow = tomorrowStr();
        if (dateStr === today) return 'Today';
        if (dateStr === tomorrow) return 'Tomorrow';
        return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }

    function buildReminderCard(r) {
        const card = document.createElement('div');
        card.className = `reminder-card ${r.status}`;
        card.dataset.id = r.id;

        const iconMap = {
            active: `<polyline points="20 6 9 17 4 12"/>`,
            completed: `<polyline points="20 6 9 17 4 12"/>`,
            missed: `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
            upcoming: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
        };

        card.innerHTML = `
      <div class="reminder-card-left">
        <div class="reminder-status-icon ${r.status}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            ${iconMap[r.status] || iconMap.upcoming}
          </svg>
        </div>
        <div class="reminder-info">
          <span class="reminder-card-label">${escHtml(r.label)}</span>
          ${r.note ? `<span class="reminder-card-note">${escHtml(r.note)}</span>` : ''}
        </div>
      </div>
      <div class="reminder-card-right">
        <span class="reminder-card-time">${r.time}</span>
        <span class="reminder-card-repeat">${capitalize(r.repeat)}</span>
        <div class="reminder-card-actions">
          <button class="btn-icon-sm reminder-edit-btn"   data-id="${r.id}" title="Edit">✎</button>
          <button class="btn-icon-sm reminder-delete-btn" data-id="${r.id}" title="Delete">✕</button>
        </div>
      </div>
    `;
        return card;
    }

    // ── List Events ──────────────────────────────────────────
    function bindListEvents() {
        document.querySelectorAll('.reminder-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                reminders = reminders.filter(r => r.id !== id);
                renderList();
                window.orionApi && orionApi.deleteReminder(id);
                showToast('Reminder deleted.');
            });
        });

        document.querySelectorAll('.reminder-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                const r = reminders.find(r => r.id === id);
                if (!r) return;
                editingId = id;
                document.getElementById('reminder-label').value = r.label || '';
                document.getElementById('reminder-time').value = r.time || '08:00';
                document.getElementById('reminder-date').value = r.date || todayStr();
                document.getElementById('reminder-repeat').value = r.repeat || 'none';
                document.getElementById('reminder-note').value = r.note || '';
                document.getElementById('reminder-form').style.display = 'block';
                document.getElementById('reminder-label')?.focus();
            });
        });
    }

    // ── Helpers ──────────────────────────────────────────────
    function escHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function capitalize(s) {
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
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
        // Load fresh from API
        if (window.orionApi) {
            orionApi.getReminders().then(data => {
                if (data && data.length) { reminders = data; renderList(); }
            }).catch(() => { });
        } else {
            renderList();
        }
    }

    // Expose so voice pipeline can add a reminder programmatically
    function addFromVoice(label, time, date) {
        const newId = Math.max(0, ...reminders.map(r => r.id)) + 1;
        reminders.push({ id: newId, label, time, date: date || todayStr(), repeat: 'none', note: '', status: 'upcoming' });
        renderList();
    }

    return { init, onEnter, addFromVoice };

})();