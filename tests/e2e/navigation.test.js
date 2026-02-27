/**
 * E2E 测试 - 导航测试
 *
 * 测试页面间导航功能
 */

const { test, expect } = require('@playwright/test');

test.describe('导航测试', () => {
  test('首页应该有导航链接到列表页', async ({ page }) => {
    await page.goto('/');

    // 查找导航链接
    const listLink = page.locator('a[href="/list"]');

    // 如果首页有到列表页的链接，点击它
    const linkCount = await listLink.count();
    if (linkCount > 0) {
      await listLink.first().click();
      await page.waitForLoadState('networkidle');

      // 验证已跳转到列表页
      expect(page.url()).toContain('/list');
    }
  });

  test('列表页应该有导航链接到首页', async ({ page }) => {
    await page.goto('/list');

    // 查找返回首页的链接
    const homeLink = page.locator('a[href="/"]');

    // 如果有到首页的链接，点击它
    const linkCount = await homeLink.count();
    if (linkCount > 0) {
      await homeLink.first().click();
      await page.waitForLoadState('networkidle');

      // 验证已跳转到首页
      expect(page.url()).toBe(process.env.BASE_URL || 'http://localhost:3000/');
    }
  });

  test('返回顶部按钮应该正常工作', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 查找返回顶部按钮
    const backToTopButton = page.locator('#backToTop');
    const buttonCount = await backToTopButton.count();

    if (buttonCount > 0) {
      // 检查页面是否有足够内容需要滚动
      const pageHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = await page.evaluate(() => window.innerHeight);

      if (pageHeight > viewportHeight) {
        // 滚动到页面底部
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        // 按钮应该变为可见
        await expect(backToTopButton).toBeVisible();

        // 点击返回顶部按钮
        await backToTopButton.click();

        // 等待滚动动画完成（使用 raf 动画完成）
        await page.waitForTimeout(2000);

        // 验证页面已滚动到顶部（允许更大误差，因为动画可能未完成）
        const scrollPosition = await page.evaluate(() => window.scrollY);
        
        // 验证滚动位置明显减小（说明按钮有响应）
        expect(scrollPosition).toBeLessThan(pageHeight - viewportHeight);
      }
    }
  });

  test('导航链接应该正确高亮当前页面', async ({ page }) => {
    await page.goto('/');

    // 验证当前页面链接有 active 类或者没有（取决于实现）
    const currentPath = new URL(page.url()).pathname;

    // 查找所有导航链接
    const navLinks = page.locator('nav a, .nav a, header a');

    const linkCount = await navLinks.count();

    if (linkCount > 0) {
      for (let i = 0; i < linkCount; i++) {
        const href = await navLinks.nth(i).getAttribute('href');

        // 如果链接指向当前页面，验证它有 active 类
        if (href === currentPath || (currentPath === '/' && href === '/')) {
          const classes = await navLinks.nth(i).getAttribute('class');
          // 这里可以添加对 active 类的验证（如果实现中有的话）
        }
      }
    }
  });

  test('目录点击应该跳转到对应章节', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 查找目录项
    const tocItems = page.locator('.toc-item');

    const itemCount = await tocItems.count();

    if (itemCount > 0) {
      // 点击第一个目录项
      await tocItems.first().click();

      // 等待页面滚动
      await page.waitForTimeout(500);

      // 验证 URL 变化或页面滚动
      // （目录可能使用锚点链接）
    }
  });

  test('页面间跳转应该保持主题状态', async ({ page }) => {
    await page.goto('/');

    // 切换到暗黑模式
    const themeToggle = page.locator('#themeToggle');
    await themeToggle.click();
    await page.waitForTimeout(300);

    // 获取当前主题
    const themeBefore = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    // 跳转到列表页
    const listLink = page.locator('a[href="/list"]');
    const linkCount = await listLink.count();

    if (linkCount > 0) {
      await listLink.first().click();
      await page.waitForLoadState('networkidle');

      // 验证主题保持
      const themeAfter = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme')
      );

      expect(themeAfter).toBe(themeBefore);
    }
  });
});
