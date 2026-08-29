'use strict';

// ── SIMPLE HASH ROUTER ─────────────────────────────────────────────────────
const Router = {
  routes: {},
  current: null,

  on(path, handler) { this.routes[path] = handler; },

  go(path) {
    window.location.hash = path;
  },

  start() {
    const handle = () => {
      const raw  = window.location.hash.slice(1) || '/';
      const parts = raw.split('/');
      const base  = '/' + parts[1];

      // dynamic: /evento/:id
      if (base === '/evento' && parts[2]) {
        State.currentEventId = parts[2];
        this.routes['/evento'] && this.routes['/evento'](parts[2]);
        return;
      }
      (this.routes[base] || this.routes['/'])();
    };
    window.addEventListener('hashchange', handle);
    handle();
  }
};

// ── PAGE MANAGER ───────────────────────────────────────────────────────────
const Pages = {
  show(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById('page-' + id);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
    // bottom nav highlight
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.page === id);
    });
    // show/hide bottom nav
    const noNav = ['landing','onboarding'];
    document.getElementById('bottom-nav').style.display = noNav.includes(id) ? 'none' : 'flex';
  }
};
