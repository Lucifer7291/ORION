/* ============================================================
   ORION — Header (src/layout/header.js)
   ============================================================ */

function renderHeader() {
    const tabs = ['Dashboard', 'Commands', 'Widgets', 'Automation', 'Reminders', 'Apps', 'Settings'];
    const tabPageMap = {
        'Dashboard': 'dashboard', 'Commands': 'commands', 'Widgets': 'widgets',
        'Automation': 'automation', 'Reminders': 'reminders', 'Apps': 'apps', 'Settings': 'settings'
    };

    const tabsHTML = tabs.map(t => `
    <div class="header-nav-item" data-tab="${t}" onclick="ORION_ROUTER.navigate('${tabPageMap[t]}')">
      ${t}
    </div>
  `).join('');

    document.getElementById('header').innerHTML = `
    <div class="header-top">
      <div class="header-title">ORION</div>
      <div class="header-controls">
        <div class="header-icon-btn">${svgBell}</div>
        <div class="header-version">Orion v2.3</div>
        <div class="header-time">${svgClock} <span class="live-time">${ORION.state.time}</span></div>
        <div class="header-icon-btn">${svgGear}</div>
      </div>
    </div>
    <div class="header-nav">${tabsHTML}</div>
  `;

    // Highlight active
    const active = ORION.state.activePage;
    document.querySelectorAll('.header-nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.tab?.toLowerCase() === active);
    });
}