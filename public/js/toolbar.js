(function () {
  const KEY = 'daily-theme';
  const root = document.documentElement;
  const button = document.getElementById('themeToggle');
  const backToTopButton = document.getElementById('backToTop');

  function getCurrentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (!button) return;
    const isDark = theme === 'dark';
    button.setAttribute('aria-pressed', String(isDark));
    button.setAttribute('aria-label', isDark ? '切换到浅色模式' : '切换到暗黑模式');
    const moonIcon = button.querySelector('.theme-toggle-icon-moon');
    const sunIcon = button.querySelector('.theme-toggle-icon-sun');
    if (moonIcon && sunIcon) {
      moonIcon.style.display = isDark ? 'none' : 'block';
      sunIcon.style.display = isDark ? 'block' : 'none';
    }
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

  if (backToTopButton) {
    const showOffset = 260;

    function toggleBackToTopVisibility() {
      const shouldShow = window.scrollY > showOffset;
      backToTopButton.classList.toggle('is-visible', shouldShow);
    }

    toggleBackToTopVisibility();
    window.addEventListener('scroll', toggleBackToTopVisibility, { passive: true });

    backToTopButton.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
