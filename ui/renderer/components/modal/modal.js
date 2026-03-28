// ============================================================
// ORION — Modal Component
// ============================================================

window.Modal = (function () {

    let activeModal = null;

    /**
     * Open a modal dialog.
     * @param {object} opts
     * @param {string}   opts.id          - Unique modal DOM id
     * @param {string}   opts.title       - Modal heading
     * @param {string}   opts.bodyHTML    - Inner HTML content
     * @param {string}   [opts.confirmLabel] - Confirm button text (default: 'Confirm')
     * @param {string}   [opts.cancelLabel]  - Cancel button text (default: 'Cancel')
     * @param {string}   [opts.type]         - 'danger' | 'info' | 'success'
     * @param {Function} [opts.onConfirm]    - Called when user clicks confirm
     * @param {Function} [opts.onCancel]     - Called when user closes/cancels
     * @returns {HTMLElement} The modal overlay element
     */
    function open(opts = {}) {
        close(); // close any existing modal first

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay orion-modal' + (opts.type ? ' modal-' + opts.type : '');
        overlay.id = opts.id || 'orion-modal-' + Date.now();
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');

        overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3 class="modal-title">${escHtml(opts.title || '')}</h3>
          <button class="modal-close-btn" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">${opts.bodyHTML || ''}</div>
        <div class="modal-footer">
          <button class="btn-orion btn-ghost modal-cancel-btn">${escHtml(opts.cancelLabel || 'Cancel')}</button>
          <button class="btn-orion ${opts.type === 'danger' ? 'btn-danger' : 'btn-primary'} modal-confirm-btn">
            ${escHtml(opts.confirmLabel || 'Confirm')}
          </button>
        </div>
      </div>
    `;

        // Close handlers
        const closeEl = overlay.querySelector('.modal-close-btn');
        const cancelEl = overlay.querySelector('.modal-cancel-btn');
        const confirmEl = overlay.querySelector('.modal-confirm-btn');

        [closeEl, cancelEl].forEach(el => {
            el?.addEventListener('click', () => {
                close();
                opts.onCancel && opts.onCancel();
            });
        });

        confirmEl?.addEventListener('click', () => {
            close();
            opts.onConfirm && opts.onConfirm();
        });

        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                close();
                opts.onCancel && opts.onCancel();
            }
        });

        // Keyboard: ESC to close
        const escHandler = (e) => {
            if (e.key === 'Escape') { close(); opts.onCancel && opts.onCancel(); }
        };
        document.addEventListener('keydown', escHandler);
        overlay._escHandler = escHandler;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('visible'));

        activeModal = overlay;
        return overlay;
    }

    /**
     * Close the currently open modal.
     */
    function close() {
        if (!activeModal) return;
        const m = activeModal;
        activeModal = null;
        if (m._escHandler) document.removeEventListener('keydown', m._escHandler);
        m.classList.remove('visible');
        setTimeout(() => m.remove(), 250);
    }

    /**
     * Convenience: show a simple confirm dialog.
     * @param {string}   message
     * @param {Function} onConfirm
     * @param {string}   [type]
     */
    function confirm(message, onConfirm, type = 'info') {
        open({
            title: type === 'danger' ? '⚠ Confirm Action' : 'Confirm',
            bodyHTML: `<p class="modal-confirm-msg">${escHtml(message)}</p>`,
            confirmLabel: type === 'danger' ? 'Yes, proceed' : 'OK',
            type,
            onConfirm,
        });
    }

    /**
     * Show a transient toast notification.
     * @param {string} msg
     * @param {'info'|'success'|'warn'|'error'} type
     */
    function toast(msg, type = 'info') {
        const t = document.createElement('div');
        t.className = `orion-toast ${type}`;
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(() => t.classList.add('visible'));
        setTimeout(() => {
            t.classList.remove('visible');
            setTimeout(() => t.remove(), 400);
        }, 3000);
    }

    // expose toast globally so other modules can use it
    window.orionToast = toast;

    function escHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    return { open, close, confirm, toast };

})();