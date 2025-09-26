import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createContext, generateTraceId, hashUserId } from '../logger-helpers'
import { useUserStore } from '@/stores/modules/user'

// Mock store
vi.mock('@/stores/modules/user', () => ({
  useUserStore: vi.fn()
}))

describe('Logger Helpers', () => {
  const getMockUni = () => (globalThis as any).uni as { getSystemInfoSync: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01 12:00:00'))
    ;(global as any).uni = {
      getSystemInfoSync: vi.fn(() => ({ platform: 'android' }))
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('generateTraceId', () => {
    it('应该生成唯一的TraceID', () => {
      const traceId1 = generateTraceId()
      const traceId2 = generateTraceId()
      
      expect(traceId1).toMatch(/^\d{13}[a-z0-9]{4}$/)
      expect(traceId2).toMatch(/^\d{13}[a-z0-9]{4}$/)
      expect(traceId1).not.toBe(traceId2)
    })

    it('应该包含时间戳和随机数', () => {
      const traceId = generateTraceId()
      const timestamp = traceId.substring(0, 13)
      const random = traceId.substring(13)
      
      expect(Number(timestamp)).toBe(new Date('2024-01-01 12:00:00').getTime())
      expect(random).toHaveLength(4)
    })
  })

  describe('hashUserId', () => {
    it('应该正确哈希用户ID', () => {
      const userId = 'user123'
      const hashed = hashUserId(userId)
      
      // MD5('user123') = '6ad14ba9986e3615423dfca256d04e3f'
      // 取前8位+后8位
      expect(hashed).toBe('6ad14ba956d04e3f')
    })

    it('应该处理空字符串', () => {
      const hashed = hashUserId('')
      expect(hashed).toBe('')
    })

    it('应该处理undefined和null', () => {
      expect(hashUserId(undefined as any)).toBe('')
      expect(hashUserId(null as any)).toBe('')
    })
  })

  describe('createContext', () => {
    it('应该创建完整的Context对象', () => {
      const mockUserStore = {
        userInfo: {
          id: 'user123'
        }
      }
      
      vi.mocked(useUserStore).mockReturnValue(mockUserStore as any)
      vi.mocked(getMockUni().getSystemInfoSync).mockReturnValue({
        platform: 'android'
      } as any)
      
      const context = createContext()
      
      expect(context).toEqual({
        traceId: expect.stringMatching(/^\d{13}[a-z0-9]{4}$/),
        userId: '6ad14ba956d04e3f', // hashUserId('user123')的结果
        timestamp: new Date('2024-01-01 12:00:00').getTime(),
        platform: 'android'
      })
    })

    it('应该处理未登录状态', () => {
      const mockUserStore = {
        userInfo: null
      }
      
      vi.mocked(useUserStore).mockReturnValue(mockUserStore as any)
      vi.mocked(getMockUni().getSystemInfoSync).mockReturnValue({
        platform: 'ios'
      } as any)
      
      const context = createContext()
      
      expect(context.userId).toBe('')
      expect(context.platform).toBe('ios')
    })

    it('应该处理storage异常', () => {
      vi.mocked(useUserStore).mockImplementation(() => {
        throw new Error('Store error')
      })
      vi.mocked(getMockUni().getSystemInfoSync).mockReturnValue({
        platform: 'h5'
      } as any)
      
      const context = createContext()
      
      expect(context.userId).toBe('')
      expect(context.platform).toBe('h5')
    })

    it('应该处理获取平台信息异常', () => {
      vi.mocked(getMockUni().getSystemInfoSync).mockImplementation(() => {
        throw new Error('System info error')
      })
      
      const context = createContext()
      
      expect(context.platform).toBe('unknown')
    })

    it('应该处理平台信息缺失', () => {
      const mockUserStore = {
        userInfo: {
          id: 'user123'
        }
      }
      
      vi.mocked(useUserStore).mockReturnValue(mockUserStore as any)
      vi.mocked(getMockUni().getSystemInfoSync).mockReturnValue({
        // platform字段缺失
      } as any)
      
      const context = createContext()
      
      expect(context.platform).toBe('unknown')
    })
  })
})
