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

  // 数字滚动动画
  function animateCounter(element) {
    const target = parseFloat(element.getAttribute('data-count'));
    if (isNaN(target)) return;

    const unit = element.getAttribute('data-unit') || '';
    const duration = 1500;
    const start = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用 ease-out 缓动函数
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = target * easeOut;

      if (target % 1 !== 0) {
        // 小数，保留 1 位小数
        element.textContent = current.toFixed(1) + unit;
      } else {
        // 整数
        element.textContent = Math.floor(current) + unit;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        // 确保最终值精确
        element.textContent = target + unit;
        element.classList.remove('counting');
      }
    }

    element.classList.add('counting');
    requestAnimationFrame(update);
  }

  // 页面加载后执行数字滚动动画
  function initCounters() {
    const counters = document.querySelectorAll('.front-stat-value[data-count]');
    counters.forEach(counter => {
      const unit = counter.getAttribute('data-unit') || '';
      const target = parseFloat(counter.getAttribute('data-count'));
      if (!isNaN(target)) {
        counter.textContent = '0' + unit;
        setTimeout(() => animateCounter(counter), 300);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCounters);
  } else {
    setTimeout(initCounters, 100);
  }
})();
