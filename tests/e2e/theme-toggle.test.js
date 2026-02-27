/**
 * E2E 测试 - 主题切换测试
 *
 * 测试浅色/暗黑模式切换功能
 */

const { test, expect } = require('@playwright/test');

test.describe('主题切换测试', () => {
  test('主题切换按钮应该存在且可点击', async ({ page }) => {
    await page.goto('/');

    // 验证主题切换按钮存在
    const themeToggle = page.locator('#themeToggle');
    await expect(themeToggle).toBeVisible();

    // 获取初始主题
    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    // 点击切换按钮
    await themeToggle.click();

    // 等待主题变化
    await page.waitForTimeout(300);

    // 验证主题已切换
    const newTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    expect(newTheme).not.toBe(initialTheme);
    expect(['light', 'dark']).toContain(newTheme);
  });

  test('主题偏好应该持久化到 localStorage', async ({ page }) => {
    await page.goto('/');

    // 获取当前主题
    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    // 切换主题
    const themeToggle = page.locator('#themeToggle');
    await themeToggle.click();
    await page.waitForTimeout(300);

    // 验证 localStorage 中已保存主题
    const savedTheme = await page.evaluate(() =>
      localStorage.getItem('daily-theme')
    );

    expect(savedTheme).not.toBeNull();
    expect(['light', 'dark']).toContain(savedTheme);
  });

  test('刷新页面后主题应该保持', async ({ page }) => {
    await page.goto('/');

    // 切换到暗黑模式
    const themeToggle = page.locator('#themeToggle');
    await themeToggle.click();
    await page.waitForTimeout(300);

    // 获取当前主题
    const themeBeforeRefresh = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    // 刷新页面
    await page.reload();

    // 等待页面加载完成
    await page.waitForLoadState('networkidle');

    // 验证主题保持
    const themeAfterRefresh = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    expect(themeAfterRefresh).toBe(themeBeforeRefresh);
  });

  test('主题切换按钮的 aria 属性应该正确更新', async ({ page }) => {
    await page.goto('/');

    // 验证初始 aria-pressed 状态
    const themeToggle = page.locator('#themeToggle');
    const initialAriaPressed = await themeToggle.getAttribute('aria-pressed');

    // 点击切换按钮
    await themeToggle.click();
    await page.waitForTimeout(300);

    // 验证 aria-pressed 已更新
    const newAriaPressed = await themeToggle.getAttribute('aria-pressed');
    expect(newAriaPressed).not.toBe(initialAriaPressed);
  });

  test('暗黑模式下的 CSS 变量应该正确应用', async ({ page }) => {
    await page.goto('/');

    // 切换到暗黑模式
    const themeToggle = page.locator('#themeToggle');
    await themeToggle.click();
    await page.waitForTimeout(300);

    // 验证暗黑模式 CSS 变量已应用
    const paperBg = await page.evaluate(() => {
      const computedStyle = getComputedStyle(document.documentElement);
      return computedStyle.getPropertyValue('--paper-bg').trim();
    });

    // 暗黑模式的背景色应该是深色
    expect(paperBg).not.toBe('#f5f2eb');
  });
});
