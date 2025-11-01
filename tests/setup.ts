import { Buffer } from 'node:buffer'
import { vi } from 'vitest'

// Mock uni-app API
global.uni = {
  login: vi.fn(),
  getUserInfo: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showToast: vi.fn(),
  showModal: vi.fn(),
  reLaunch: vi.fn(),
  navigateTo: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({
    statusBarHeight: 20,
    platform: 'devtools', // 让请求管理器识别为开发者工具环境
    screenWidth: 375,
    windowWidth: 375
  })),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  clearStorageSync: vi.fn(),
  base64ToArrayBuffer: vi.fn((base64: string) => {
    const binary = Buffer.from(base64, 'base64')
    return binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength)
  }),
  arrayBufferToBase64: vi.fn((buffer: ArrayBuffer) => {
    return Buffer.from(buffer).toString('base64')
  }),
  // 页面交互相关
  stopPullDownRefresh: vi.fn(),
  startPullDownRefresh: vi.fn(),
  // 媒体与OCR相关
  chooseImage: vi.fn(),
  compressImage: vi.fn(),
  ocrNavigator: vi.fn()
}

// Mock process.env
global.process = {
  env: {
    NODE_ENV: 'test',
    UNI_PLATFORM: 'h5',
    VITE_API_BASE_MP_DEVICE: 'http://127.0.0.1:8080/api'
  }
} as any

// Mock console for cleaner test output
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}
