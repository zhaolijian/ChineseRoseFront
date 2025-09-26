import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createContext, generateTraceId, hashUserId } from '../logger-helpers'
import { useUserStore } from '@/stores/modules/user'

// Mock uni.getSystemInfoSync
const mockGetSystemInfoSync = vi.fn(() => ({ platform: 'ios' }))

vi.mock('@dcloudio/uni-app', () => ({
  getSystemInfoSync: mockGetSystemInfoSync
}))

// Mock user store
vi.mock('@/stores/modules/user', () => ({
  useUserStore: vi.fn()
}))

// Mock crypto-js
vi.mock('crypto-js', () => ({
  default: {
    MD5: vi.fn(() => ({
      toString: () => '0123456789abcdef0123456789abcdef' // 32位固定hash
    }))
  }
}))

describe('Logger Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global as any).uni = {
      getSystemInfoSync: mockGetSystemInfoSync
    }
  })

  describe('generateTraceId', () => {
    it('应该生成唯一的traceId', () => {
      const id1 = generateTraceId()
      const id2 = generateTraceId()
      
      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
      expect(id1).not.toBe(id2)
    })

    it('应该包含时间戳和随机数', () => {
      const id = generateTraceId()
      // 格式：timestamp + 4位随机字符
      expect(id).toMatch(/^\d{13}[a-z0-9]{4}$/)
    })

    it('连续生成的ID应该不同', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateTraceId())
      }
      // 100个ID应该都是唯一的
      expect(ids.size).toBe(100)
    })
  })

  describe('hashUserId', () => {
    it('应该将用户ID哈希为16位', () => {
      const hash = hashUserId('user123456')
      expect(hash).toHaveLength(16)
      expect(hash).toBe('0123456789abcdef') // 前8位+后8位
    })

    it('应该处理空字符串', () => {
      const hash = hashUserId('')
      expect(hash).toBe('')
    })

    it('应该处理null和undefined', () => {
      expect(hashUserId(null as any)).toBe('')
      expect(hashUserId(undefined as any)).toBe('')
    })

    it('应该对相同ID生成相同的hash', () => {
      const id = 'test-user-id'
      const hash1 = hashUserId(id)
      const hash2 = hashUserId(id)
      expect(hash1).toBe(hash2)
    })
  })

  describe('createContext', () => {
    it('应该创建包含所有必填字段的context', () => {
      // Mock user store
      const mockUserStore = {
        userInfo: { id: 'user123' },
        token: 'mock-token'
      }
      vi.mocked(useUserStore).mockReturnValue(mockUserStore as any)

      const context = createContext()
      
      expect(context).toHaveProperty('traceId')
      expect(context).toHaveProperty('userId')
      expect(context).toHaveProperty('timestamp')
      expect(context).toHaveProperty('platform')
      
      // 验证字段类型
      expect(typeof context.traceId).toBe('string')
      expect(typeof context.userId).toBe('string')
      expect(typeof context.timestamp).toBe('number')
      expect(typeof context.platform).toBe('string')
    })

    it('应该从userStore获取并哈希userId', () => {
      const mockUserStore = {
        userInfo: { id: 'real-user-123' },
        token: 'mock-token'
      }
      vi.mocked(useUserStore).mockReturnValue(mockUserStore as any)

      const context = createContext()
      
      // 应该是哈希后的16位ID
      expect(context.userId).toBe('0123456789abcdef')
    })

    it('应该在用户未登录时使用空字符串', () => {
      const mockUserStore = {
        userInfo: null,
        token: ''
      }
      vi.mocked(useUserStore).mockReturnValue(mockUserStore as any)

      const context = createContext()
      
      expect(context.userId).toBe('')
    })

    it('应该从uni.getSystemInfoSync获取平台信息', () => {
      const mockUserStore = {
        userInfo: null,
        token: ''
      }
      vi.mocked(useUserStore).mockReturnValue(mockUserStore as any)

      const context = createContext()
      
      expect(context.platform).toBe('ios')
    })

    it('应该在获取平台信息失败时使用unknown', () => {
      // Mock getSystemInfoSync抛出异常
      vi.mocked(uni.getSystemInfoSync).mockImplementation(() => {
        throw new Error('Platform not available')
      })

      const mockUserStore = {
        userInfo: null,
        token: ''
      }
      vi.mocked(useUserStore).mockReturnValue(mockUserStore as any)

      const context = createContext()
      
      expect(context.platform).toBe('unknown')
    })

    it('应该生成有效的时间戳', () => {
      const mockUserStore = {
        userInfo: null,
        token: ''
      }
      vi.mocked(useUserStore).mockReturnValue(mockUserStore as any)

      const before = Date.now()
      const context = createContext()
      const after = Date.now()
      
      expect(context.timestamp).toBeGreaterThanOrEqual(before)
      expect(context.timestamp).toBeLessThanOrEqual(after)
    })

    it('应该每次生成不同的traceId', () => {
      const mockUserStore = {
        userInfo: { id: 'user123' },
        token: 'token'
      }
      vi.mocked(useUserStore).mockReturnValue(mockUserStore as any)

      const context1 = createContext()
      const context2 = createContext()
      
      expect(context1.traceId).not.toBe(context2.traceId)
    })

    it('应该处理userStore异常', () => {
      // Mock userStore抛出异常
      vi.mocked(useUserStore).mockImplementation(() => {
        throw new Error('Store error')
      })

      expect(() => createContext()).not.toThrow()
      
      const context = createContext()
      expect(context.userId).toBe('')
    })
  })
})
