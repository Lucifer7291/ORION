// ============================================================
// ORION — Card Component Factory
// ============================================================

window.Card = (function () {

    /**
     * Create a card element programmatically.
     * @param {object} opts
     * @param {string}  opts.title         - Card heading text
     * @param {string}  [opts.id]          - Optional DOM id
     * @param {string}  [opts.badge]       - Optional badge text
     * @param {boolean} [opts.badgePulse]  - Animate badge dot
     * @param {string}  [opts.bodyHTML]    - Inner HTML for .card-body
     * @param {Array}   [opts.actions]     - Array of { label, onClick } for header buttons
     * @param {string}  [opts.className]   - Extra class names
     * @returns {HTMLElement}
     */
    function create(opts = {}) {
        const card = document.createElement('div');
        card.className = 'dash-card orion-card' + (opts.className ? ' ' + opts.className : '');
        if (opts.id) card.id = opts.id;

        // Header
        const header = document.createElement('div');
        header.className = 'dash-card-header';

        const title = document.createElement('h3');
        title.textContent = opts.title || '';
        header.appendChild(title);

        if (opts.badge) {
            const badge = document.createElement('span');
            badge.className = 'card-badge' + (opts.badgePulse ? ' pulse' : '');
            badge.textContent = opts.badge;
            header.appendChild(badge);
        }

        if (opts.actions && opts.actions.length) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'card-header-actions';
            opts.actions.forEach(({ label, onClick }) => {
                const btn = document.createElement('button');
                btn.className = 'btn-link';
                btn.textContent = label;
                if (onClick) btn.addEventListener('click', onClick);
                actionsDiv.appendChild(btn);
            });
            header.appendChild(actionsDiv);
        }

        card.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.className = 'card-body';
        if (opts.bodyHTML) body.innerHTML = opts.bodyHTML;
        card.appendChild(body);

        return card;
    }

    /**
     * Append a card to a container element.
     * @param {HTMLElement|string} container - Element or selector
     * @param {object}             opts      - Same as create()
     * @returns {HTMLElement} The created card
     */
    function appendTo(container, opts) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        const card = create(opts);
        if (el) el.appendChild(card);
        return card;
    }

    /**
     * Update card body content.
     * @param {string|HTMLElement} cardOrId
     * @param {string}             html
     */
    function setBody(cardOrId, html) {
        const card = typeof cardOrId === 'string' ? document.getElementById(cardOrId) : cardOrId;
        const body = card?.querySelector('.card-body');
        if (body) body.innerHTML = html;
    }

    /**
     * Set or update the card badge.
     * @param {string|HTMLElement} cardOrId
     * @param {string}             text
     * @param {boolean}            pulse
     */
    function setBadge(cardOrId, text, pulse = false) {
        const card = typeof cardOrId === 'string' ? document.getElementById(cardOrId) : cardOrId;
        if (!card) return;
        let badge = card.querySelector('.card-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'card-badge';
            card.querySelector('.dash-card-header')?.appendChild(badge);
        }
        badge.textContent = text;
        badge.style.display = text ? '' : 'none';
        badge.classList.toggle('pulse', pulse);
    }

    return { create, appendTo, setBody, setBadge };

})();