// PrintGrid Studio — theme toggle
//
// Initial theme is set by an inline <script> in each page's <head> BEFORE
// the stylesheet loads, so this script just handles user toggles + label
// sync. Dispatches a `themechange` CustomEvent on document so other
// modules (the 3D viewer) can re-paint without a reload.

(function () {
  const KEY = 'printgrid-theme';

  function applyLabels(theme) {
    document.querySelectorAll('[data-theme-label]').forEach((el) => {
      el.textContent = theme === 'dark' ? 'LIGHT' : 'DARK';
    });
  }

  function init() {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    applyLabels(cur);

    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = document.documentElement.getAttribute('data-theme') || 'light';
        const next = c === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem(KEY, next); } catch (_) { /* private mode etc. */ }
        applyLabels(next);
        document.dispatchEvent(new CustomEvent('themechange', { detail: next }));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
