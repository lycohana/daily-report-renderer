/**
 * E2E 测试 - 日报流程测试
 *
 * 测试用户访问首页、查看日报内容的完整流程
 */

const { test, expect } = require('@playwright/test');

test.describe('日报流程测试', () => {
  test.beforeEach(async ({ page }) => {
    // 访问首页
    await page.goto('/');
  });

  test('首页应该正常加载', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/每日日报/);

    // 验证页面主要元素存在
    await expect(page.locator('.masthead')).toBeVisible();
    await expect(page.locator('h1')).toContainText('每日日报');
  });

  test('日报内容应该正确渲染', async ({ page }) => {
    // 等待内容加载完成
    await page.waitForLoadState('networkidle');

    // 验证头版区域是否存在（如果有日报内容）
    const frontPage = page.locator('.front-page');
    const hasContent = await frontPage.count() > 0;

    if (hasContent) {
      // 验证头版标题
      const headline = frontPage.locator('.front-headline');
      const headlineCount = await headline.count();
      
      if (headlineCount > 0) {
        await expect(headline.first()).toBeVisible();
      }

      // 验证期号显示（在 masthead 区域）
      const masthead = page.locator('.masthead');
      const edition = masthead.locator('.edition');
      const editionCount = await edition.count();
      
      if (editionCount > 0) {
        await expect(edition.first()).toBeVisible();
      }
    }
  });

  test('工具栏应该正常显示', async ({ page }) => {
    // 验证主题切换按钮
    const themeToggle = page.locator('#themeToggle');
    await expect(themeToggle).toBeVisible();

    // 验证主题切换按钮可点击
    await themeToggle.click();
  });

  test('目录区域应该正确渲染（如果有章节内容）', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const toc = page.locator('.toc');
    const hasToc = await toc.count() > 0;

    if (hasToc) {
      await expect(toc).toBeVisible();

      // 验证目录项
      const tocItems = toc.locator('.toc-item');
      const itemCount = await tocItems.count();

      if (itemCount > 0) {
        // 点击第一个目录项
        await tocItems.first().click();

        // 等待页面滚动
        await page.waitForTimeout(500);
      }
    }
  });

  test('主内容区域应该正确渲染（如果有文章内容）', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const mainContent = page.locator('.main-content');
    const hasContent = await mainContent.count() > 0;

    if (hasContent) {
      await expect(mainContent).toBeVisible();

      // 验证章节区域
      const sections = mainContent.locator('.section');
      const sectionCount = await sections.count();

      if (sectionCount > 0) {
        // 验证第一个章节标题
        const firstSection = sections.first();
        await expect(firstSection.locator('.section-title')).toBeVisible();
      }
    }
  });
});
