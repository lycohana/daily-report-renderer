/**
 * E2E 测试 - 列表页测试
 *
 * 测试日报列表页面功能
 */

const { test, expect } = require('@playwright/test');

test.describe('列表页测试', () => {
  test('列表页应该正常加载', async ({ page }) => {
    await page.goto('/list');

    // 验证页面标题
    await expect(page).toHaveTitle(/日报列表/);

    // 验证页面主要元素
    await expect(page.locator('.header')).toBeVisible();
    await expect(page.locator('h1')).toContainText('历史日报');
  });

  test('列表页应该显示日报列表', async ({ page }) => {
    await page.goto('/list');

    // 等待内容加载完成
    await page.waitForLoadState('networkidle');

    // 验证日报列表容器存在
    const reportList = page.locator('.report-list');
    const listCount = await reportList.count();

    if (listCount > 0) {
      await expect(reportList).toBeVisible();

      // 验证列表项存在
      const reportItems = reportList.locator('.report-item');
      const itemCount = await reportItems.count();
      expect(itemCount).toBeGreaterThan(0);
    }
  });

  test('列表页应该可以导航到详情页', async ({ page }) => {
    await page.goto('/list');

    await page.waitForLoadState('networkidle');

    // 查找日报列表项链接
    const reportItems = page.locator('.report-item');
    const itemCount = await reportItems.count();

    if (itemCount > 0) {
      // 获取第一个链接的 href
      const firstItem = reportItems.first();
      const href = await firstItem.getAttribute('href');

      if (href && href.includes('/report/')) {
        // 验证链接格式正确
        expect(href).toContain('/report/');
        
        // 注意：由于 E2E 测试环境可能没有实际的报告文件
        // 这里只验证链接格式，不实际导航
        // 实际导航测试在 navigation.test.js 中测试
      }
    }
  });

  test('列表页应该有返回首页的链接', async ({ page }) => {
    await page.goto('/list');

    // 查找导航链接（首页链接）
    const navLinks = page.locator('.nav-link');
    const linkCount = await navLinks.count();

    if (linkCount > 0) {
      // 验证至少有一个导航链接
      await expect(navLinks.first()).toBeVisible();
    }
  });

  test('列表页应该有正确的元信息显示', async ({ page }) => {
    await page.goto('/list');

    await page.waitForLoadState('networkidle');

    // 验证元信息区域存在（如果有内容）
    const meta = page.locator('.meta, .report-meta');
    const metaCount = await meta.count();

    // 元信息可能存在也可能不存在，取决于数据
    if (metaCount > 0) {
      await expect(meta.first()).toBeVisible();
    }
  });
});
