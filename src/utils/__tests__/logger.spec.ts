import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logger } from '../logger'
import type { LogContext } from '../logger'

// Mock uni.getSystemInfoSync
vi.mock('@dcloudio/uni-app', () => ({
  getSystemInfoSync: vi.fn(() => ({ platform: 'ios' }))
}))

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'debug').mockImplementation(() => {})
  })

  describe('日志级别测试', () => {
    const mockContext: LogContext = {
      traceId: 'test-trace-123',
      userId: 'user123',
      timestamp: Date.now(),
      platform: 'ios'
    }

    it('应该输出error级别日志', () => {
      logger.error(mockContext, '[testMethod] 错误信息')
      
      expect(console.error).toHaveBeenCalledTimes(1)
      const callArgs = (console.error as any).mock.calls[0]
      expect(callArgs[0]).toContain('[ERROR]')
      expect(callArgs[0]).toContain('[testMethod] 错误信息')
      expect(callArgs[1]).toEqual(mockContext)
    })

    it('应该输出warn级别日志', () => {
      logger.warn(mockContext, '[testMethod] 警告信息')
      
      expect(console.warn).toHaveBeenCalledTimes(1)
      const callArgs = (console.warn as any).mock.calls[0]
      expect(callArgs[0]).toContain('[WARN]')
      expect(callArgs[0]).toContain('[testMethod] 警告信息')
      expect(callArgs[1]).toEqual(mockContext)
    })

    it('应该输出info级别日志', () => {
      logger.info(mockContext, '[testMethod] 信息日志')
      
      expect(console.log).toHaveBeenCalledTimes(1)
      const callArgs = (console.log as any).mock.calls[0]
      expect(callArgs[0]).toContain('[INFO]')
      expect(callArgs[0]).toContain('[testMethod] 信息日志')
      expect(callArgs[1]).toEqual(mockContext)
    })

    it('应该输出debug级别日志', () => {
      logger.debug(mockContext, '[testMethod] 调试信息')
      
      expect(console.debug).toHaveBeenCalledTimes(1)
      const callArgs = (console.debug as any).mock.calls[0]
      expect(callArgs[0]).toContain('[DEBUG]')
      expect(callArgs[0]).toContain('[testMethod] 调试信息')
      expect(callArgs[1]).toEqual(mockContext)
    })
  })

  describe('Context验证', () => {
    it('应该拒绝空的context', () => {
      expect(() => {
        logger.info(null as any, '[testMethod] 信息')
      }).toThrow('Context不能为空')
    })

    it('应该拒绝缺少必填字段的context', () => {
      const invalidContext = {
        traceId: 'test-123',
        userId: 'user123',
        // 缺少 timestamp 和 platform
      } as any

      expect(() => {
        logger.info(invalidContext, '[testMethod] 信息')
      }).toThrow('Context必须包含所有必填字段')
    })

    it('应该接受userId为空字符串的context', () => {
      const validContext: LogContext = {
        traceId: 'test-123',
        userId: '', // 空字符串表示未登录
        timestamp: Date.now(),
        platform: 'unknown'
      }

      expect(() => {
        logger.info(validContext, '[testMethod] 信息')
      }).not.toThrow()
    })
  })

  describe('日志格式', () => {
    it('应该包含时间戳、级别、traceId和消息', () => {
      const context: LogContext = {
        traceId: 'trace-123',
        userId: 'user456',
        timestamp: 1234567890123,
        platform: 'android'
      }

      logger.info(context, '[getUserInfo] 获取用户信息')
      
      const callArgs = (console.log as any).mock.calls[0]
      expect(callArgs[0]).toMatch(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\]/)
      expect(callArgs[0]).toContain('[INFO]')
      expect(callArgs[0]).toContain('[trace-123]')
      expect(callArgs[0]).toContain('[getUserInfo] 获取用户信息')
    })

    it('应该正确处理没有方法名前缀的消息', () => {
      const context: LogContext = {
        traceId: 'trace-123',
        userId: 'user456',
        timestamp: Date.now(),
        platform: 'web'
      }

      logger.warn(context, '这是一条没有方法名的日志')
      
      const callArgs = (console.warn as any).mock.calls[0]
      expect(callArgs[0]).toContain('这是一条没有方法名的日志')
    })
  })

  describe('环境区分', () => {
    it('在开发环境应该输出到console', () => {
      // 默认测试环境被视为开发环境
      const context: LogContext = {
        traceId: 'dev-trace',
        userId: 'dev-user',
        timestamp: Date.now(),
        platform: 'h5'
      }

      logger.info(context, '[dev] 开发日志')
      expect(console.log).toHaveBeenCalled()
    })

    it('应该提供生产环境上报接口（占位）', () => {
      // 验证logger有report方法
      expect(logger.report).toBeDefined()
      expect(typeof logger.report).toBe('function')
    })
  })

  describe('异常处理', () => {
    it('应该处理格式化时间戳异常', () => {
      const context: LogContext = {
        traceId: 'test',
        userId: 'test',
        timestamp: NaN, // 无效时间戳
        platform: 'test'
      }

      expect(() => {
        logger.error(context, '[error] 测试')
      }).not.toThrow()
    })

    it('应该处理超长消息', () => {
      const context: LogContext = {
        traceId: 'test',
        userId: 'test',
        timestamp: Date.now(),
        platform: 'test'
      }
      
      const longMessage = 'a'.repeat(10000)
      expect(() => {
        logger.info(context, longMessage)
      }).not.toThrow()
    })
  })
})