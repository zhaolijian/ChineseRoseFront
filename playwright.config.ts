import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  
  // 测试超时时间
  timeout: 30 * 1000,
  
  // 期望的断言超时时间
  expect: {
    timeout: 5000
  },
  
  // 完全并行运行
  fullyParallel: true,
  
  // 失败时重试次数
  retries: 1,
  
  // 并发worker数
  workers: process.env.CI ? 1 : undefined,
  
  // 报告配置
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }]
  ],
  
  // 共享设置
  use: {
    // 基础URL - 与 vite.config.ts 保持一致
    baseURL: 'http://127.0.0.1:3000',

    // 跟踪设置
    trace: 'on-first-retry',

    // 截图设置
    screenshot: 'only-on-failure',

    // 视频设置
    video: 'retain-on-failure',
  },
  
  // 配置项目
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  
  // 本地开发服务器设置
  webServer: {
    command: 'npm run dev:h5',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})