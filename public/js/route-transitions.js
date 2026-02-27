/**
 * 路由切换动画模块
 * 为多页面应用提供 View Transitions API 支持和传统淡入淡出动画
 */

(function() {
  'use strict';

  // 页面进入动画配置 - 使用弹性缓动让动画更自然
  const ENTER_ANIMATION = {
    keyframes: [
      { opacity: 0, transform: 'translateY(30px) scale(0.98)', offset: 0 },
      { opacity: 1, transform: 'translateY(0) scale(1)', offset: 1 }
    ],
    duration: 500,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
  };

  // 页面退出动画配置 - 更平滑的曲线
  const EXIT_ANIMATION = {
    keyframes: [
      { opacity: 1, transform: 'translateY(0) scale(1)', offset: 0 },
      { opacity: 0, transform: 'translateY(-15px) scale(0.99)', offset: 1 }
    ],
    duration: 250,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
  };

  /**
   * 检查浏览器是否支持 View Transitions API
   */
  function supportsViewTransitions() {
    return 'startViewTransition' in document;
  }

  /**
   * 使用 View Transitions API 进行页面切换
   */
  function useViewTransition(href) {
    if (!supportsViewTransitions()) {
      return false;
    }

    // 排除外部链接、锚点链接和特殊协议
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('javascript:') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('http') && !href.startsWith(window.location.origin)
    ) {
      return false;
    }

    const transition = document.startViewTransition(() => {
      window.location.href = href;
    });

    return true;
  }

  /**
   * 传统淡入淡出动画（不支持 View Transitions 时的后备方案）
   */
  function useFadeAnimation(href) {
    const container = document.querySelector('.container');
    if (!container) {
      window.location.href = href;
      return;
    }

    // 创建叠加层使过渡更平滑
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--paper-bg, #f5f2eb);
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    `;
    document.body.appendChild(overlay);

    // 淡出当前页面
    const exitAnimation = container.animate(EXIT_ANIMATION.keyframes, {
      duration: EXIT_ANIMATION.duration,
      easing: EXIT_ANIMATION.easing,
      fill: 'forwards'
    });

    // 叠加层淡入
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });

    exitAnimation.onfinish = () => {
      // 页面跳转
      window.location.href = href;
    };
  }

  /**
   * 页面进入动画
   */
  function playEnterAnimation() {
    const container = document.querySelector('.container');
    if (!container) return;

    // 移除可能存在的旧动画类
    container.classList.remove('page-enter');

    // 强制重绘
    void container.offsetWidth;

    // 播放进入动画
    const enterAnimation = container.animate(ENTER_ANIMATION.keyframes, {
      duration: ENTER_ANIMATION.duration,
      easing: ENTER_ANIMATION.easing,
      fill: 'forwards'
    });

    enterAnimation.onfinish = () => {
      container.classList.add('page-enter');
    };
  }

  /**
   * 初始化链接拦截
   */
  function init() {
    // 页面进入时播放动画
    playEnterAnimation();

    // 拦截链接点击事件
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // 排除外部链接、锚点链接、下载链接和特殊链接
      if (
        link.target === '_blank' ||
        link.hasAttribute('download') ||
        link.hasAttribute('data-no-transition') ||
        href.startsWith('#') ||
        href.startsWith('javascript:') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        (href.startsWith('http') && !href.startsWith(window.location.origin))
      ) {
        return;
      }

      // 使用 View Transitions 或传统动画
      e.preventDefault();

      if (supportsViewTransitions()) {
        useViewTransition(href);
      } else {
        useFadeAnimation(href);
      }
    }, { capture: true });

    // 处理浏览器前进/后退按钮
    window.addEventListener('popstate', function() {
      playEnterAnimation();
    });
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
