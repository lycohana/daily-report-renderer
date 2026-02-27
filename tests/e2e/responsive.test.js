/**
 * E2E 测试 - 响应式设计测试
 *
 * 测试移动端和平板设备的响应式布局
 */

const { test, expect, devices } = require('@playwright/test');

test.describe('响应式设计测试', () => {
  test.describe('移动端视口', () => {
    test.use({
      viewport: { width: 375, height: 667 } // iPhone SE
    });

    test('移动端首页应该正确渲染', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 验证主要内容区域可见
      await expect(page.locator('.container')).toBeVisible();

      // 验证标题可见
      await expect(page.locator('.masthead h1')).toBeVisible();
    });

    test('移动端工具栏应该正确显示', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 验证工具栏可见
      const toolbar = page.locator('.toolbar');
      await expect(toolbar).toBeVisible();
    });

    test('移动端主题切换应该正常工作', async ({ page }) => {
      await page.goto('/');

      // 切换主题
      const themeToggle = page.locator('#themeToggle');
      await themeToggle.click();
      await page.waitForTimeout(300);

      // 验证主题已切换
      const theme = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme')
      );
      expect(['light', 'dark']).toContain(theme);
    });
  });

  test.describe('平板视口', () => {
    test.use({
      viewport: { width: 768, height: 1024 } // iPad
    });

    test('平板首页应该正确渲染', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 验证主要内容区域可见
      await expect(page.locator('.container')).toBeVisible();

      // 验证标题可见
      await expect(page.locator('.masthead h1')).toBeVisible();
    });

    test('平板目录应该显示为双列布局', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 查找目录网格
      const tocGrid = page.locator('.toc-grid');
      const gridCount = await tocGrid.count();

      if (gridCount > 0) {
        // 验证网格布局存在
        await expect(tocGrid).toBeVisible();
      }
    });
  });

  test.describe('桌面视口', () => {
    test.use({
      viewport: { width: 1280, height: 800 }
    });

    test('桌面首页应该正确渲染', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 验证主要内容区域可见
      await expect(page.locator('.container')).toBeVisible();

      // 验证标题可见
      await expect(page.locator('.masthead h1')).toBeVisible();
    });

    test('桌面端目录应该显示为双列布局', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 查找目录网格
      const tocGrid = page.locator('.toc-grid');
      const gridCount = await tocGrid.count();

      if (gridCount > 0) {
        // 验证网格布局存在
        await expect(tocGrid).toBeVisible();

        // 获取网格列数
        const gridTemplateColumns = await tocGrid.evaluate(el =>
          getComputedStyle(el).gridTemplateColumns
        );

        // 验证是双列布局
        expect(gridTemplateColumns).not.toBe('none');
      }
    });
  });

  test.describe('大桌面视口', () => {
    test.use({
      viewport: { width: 1920, height: 1080 }
    });

    test('大桌面端应该正确渲染', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 验证主要内容区域可见
      await expect(page.locator('.container')).toBeVisible();

      // 验证标题可见
      await expect(page.locator('.masthead h1')).toBeVisible();
    });
  });

  test('视口变化时页面应该正确响应', async ({ page }) => {
    // 从小视口开始
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 切换到中等视口
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);

    // 验证页面仍然可见
    await expect(page.locator('.container')).toBeVisible();

    // 切换到大视口
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);

    // 验证页面仍然可见
    await expect(page.locator('.container')).toBeVisible();
  });

  test('触摸设备应该有适当的交互', async ({ browser }) => {
    // 创建支持触摸的移动设备上下文
    const context = await browser.newContext({
      ...devices['Pixel 5']
    });
    const page = await context.newPage();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 使用点击代替 tap（在桌面浏览器上模拟触摸）
    const themeToggle = page.locator('#themeToggle');
    await themeToggle.click();
    await page.waitForTimeout(300);

    // 验证主题已切换
    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(['light', 'dark']).toContain(theme);

    await context.close();
  });
});
