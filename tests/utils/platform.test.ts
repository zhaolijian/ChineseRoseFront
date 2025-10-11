import { describe, it, expect, vi, beforeEach } from 'vitest'
import { canUseWechatPhoneLogin } from '@/utils/platform'

// Mock uni API
const mockUni = {
  getSystemInfoSync: vi.fn(),
  canIUse: vi.fn()
}

// @ts-ignore
global.uni = mockUni

// Mock process.env for conditional compilation
// @ts-ignore
global.process = { env: { UNI_PLATFORM: 'mp-weixin' } }

describe('platform.ts - 平台能力检测', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('canUseWechatPhoneLogin', () => {
    it('应该在微信小程序环境且API支持时返回true', () => {
      // 模拟微信小程序环境
      mockUni.getSystemInfoSync.mockReturnValue({
        platform: 'devtools', // 微信开发者工具
        SDKVersion: '2.21.2'
      })
      mockUni.canIUse.mockReturnValue(true)

      const result = canUseWechatPhoneLogin()

      expect(result).toBe(true)
      expect(mockUni.canIUse).toHaveBeenCalledWith('button.open-type.getPhoneNumber')
    })

    it('应该在非微信环境时返回false', () => {
      // 模拟非微信环境
      mockUni.getSystemInfoSync.mockReturnValue({
        platform: 'h5', // 非微信平台
        SDKVersion: '2.21.2'
      })

      const result = canUseWechatPhoneLogin()

      expect(result).toBe(false)
    })

    it('应该在基础库版本过低时返回false', () => {
      // 模拟微信环境但版本过低
      mockUni.getSystemInfoSync.mockReturnValue({
        platform: 'devtools',
        SDKVersion: '2.20.0' // 低于要求的2.21.2
      })

      const result = canUseWechatPhoneLogin()

      expect(result).toBe(false)
    })

    it('应该在API不支持时返回false', () => {
      // 模拟微信环境但API不支持
      mockUni.getSystemInfoSync.mockReturnValue({
        platform: 'devtools',
        SDKVersion: '2.21.2'
      })
      mockUni.canIUse.mockReturnValue(false)

      const result = canUseWechatPhoneLogin()

      expect(result).toBe(false)
    })

    it('应该在getSystemInfoSync异常时返回false', () => {
      // 模拟API异常
      mockUni.getSystemInfoSync.mockImplementation(() => {
        throw new Error('系统信息获取失败')
      })

      const result = canUseWechatPhoneLogin()

      expect(result).toBe(false)
    })

    it('应该正确解析版本号比较', () => {
      // 测试边界版本号
      const testCases = [
        { version: '2.21.2', expected: true },
        { version: '2.21.3', expected: true },
        { version: '2.22.0', expected: true },
        { version: '2.21.1', expected: false },
        { version: '2.20.9', expected: false },
        { version: '3.0.0', expected: true }
      ]

      testCases.forEach(({ version, expected }) => {
        mockUni.getSystemInfoSync.mockReturnValue({
          platform: 'devtools',
          SDKVersion: version
        })
        mockUni.canIUse.mockReturnValue(true)

        const result = canUseWechatPhoneLogin()
        expect(result).toBe(expected)
      })
    })
  })
})