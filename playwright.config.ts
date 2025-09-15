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
    // 基础URL
    baseURL: 'http://localhost:5173',
    
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
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // 本地开发服务器设置
  webServer: {
    command: 'npm run dev:h5',
    port: 5173,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
})