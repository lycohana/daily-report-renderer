(function () {
  const KEY = 'daily-theme';
  const root = document.documentElement;
  const button = document.getElementById('themeToggle');

  function getCurrentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (!button) return;
    const isDark = theme === 'dark';
    button.setAttribute('aria-pressed', String(isDark));
    button.setAttribute('aria-label', isDark ? '切换到浅色模式' : '切换到暗黑模式');
    const icon = button.querySelector('.theme-toggle-icon');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(KEY, theme);
    } catch (_) {}
  }

  applyTheme(getCurrentTheme());

  if (button) {
    button.addEventListener('click', function () {
      const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
    });
  }
})();
