/**
 * Playwright E2E 测试配置文件
 *
 * 用于配置 Daily Report Renderer 项目的端到端测试
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // 测试目录
  testDir: './tests/e2e',

  // 测试超时时间
  timeout: 30 * 1000,

  // 期望超时时间
  expect: {
    timeout: 5 * 1000
  },

  // 完全并行运行测试
  fullyParallel: true,

  // CI 环境下失败时禁止重试
  forbidOnly: !!process.env.CI,

  // CI 环境下重试次数
  retries: process.env.CI ? 2 : 0,

  // 并行工作进程数
  workers: process.env.CI ? 1 : undefined,

  // 报告器
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  // 共享设置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:3000',

    // 收集失败测试的追踪信息
    trace: 'on-first-retry',

    // 收集失败测试的截图
    screenshot: 'only-on-failure',

    // 收集失败测试的视频
    video: 'retain-on-failure',

    // 每个测试的浏览器上下文选项
    contextOptions: {
      locale: 'zh-CN'
    }
  },

  // 浏览器项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
    // 其他浏览器可按需启用
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] }
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] }
    // },
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] }
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] }
    // }
  ],

  // 本地开发服务器配置 (可选，用于本地开发)
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});
