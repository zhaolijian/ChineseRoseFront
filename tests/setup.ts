import { vi } from 'vitest'

// Mock uni-app API
global.uni = {
  login: vi.fn(),
  getUserInfo: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showToast: vi.fn(),
  reLaunch: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({ statusBarHeight: 20 })),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  clearStorageSync: vi.fn()
}

// Mock process.env
global.process = {
  env: {
    NODE_ENV: 'test',
    UNI_PLATFORM: 'h5'
  }
} as any

// Mock console for cleaner test output
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}