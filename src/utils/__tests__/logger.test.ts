import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from '../logger'
import type { LogContext } from '../logger'

describe('Logger', () => {
  const originalEnv = process.env.NODE_ENV
  const mockContext: LogContext = {
    traceId: 'test-trace-123',
    userId: 'hashed-user-id',
    timestamp: 1234567890,
    platform: 'h5'
  }

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    vi.clearAllMocks()
    // 模拟console方法
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(Date, 'now').mockReturnValue(1_696_000_000_000)
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    vi.restoreAllMocks()
  })

  describe('日志级别测试', () => {
    it('应该正确输出error级别日志', () => {
      logger.error(mockContext, '[testMethod] 错误信息')

      const [prefix, context, extra] = (console.error as any).mock.calls[0]
      expect(prefix).toContain('[ERROR]')
      expect(prefix).toContain('[test-trace-123]')
      expect(prefix).toContain('[testMethod] 错误信息')
      expect(context).toEqual(expect.objectContaining(mockContext))
      expect(extra).toBeUndefined()
    })

    it('应该正确输出warn级别日志', () => {
      logger.warn(mockContext, '[testMethod] 警告信息')

      const [prefix, context, extra] = (console.warn as any).mock.calls[0]
      expect(prefix).toContain('[WARN]')
      expect(prefix).toContain('[testMethod] 警告信息')
      expect(context).toEqual(expect.objectContaining(mockContext))
      expect(extra).toBeUndefined()
    })

    it('应该正确输出info级别日志', () => {
      logger.info(mockContext, '[testMethod] 信息')

      const [prefix, context, extra] = (console.log as any).mock.calls[0]
      expect(prefix).toContain('[INFO]')
      expect(prefix).toContain('[testMethod] 信息')
      expect(context).toEqual(expect.objectContaining(mockContext))
      expect(extra).toBeUndefined()
    })

    it('应该正确输出debug级别日志', () => {
      logger.debug(mockContext, '[testMethod] 调试信息')

      const [prefix, context, extra] = (console.debug as any).mock.calls[0]
      expect(prefix).toContain('[DEBUG]')
      expect(prefix).toContain('[testMethod] 调试信息')
      expect(context).toEqual(expect.objectContaining(mockContext))
      expect(extra).toBeUndefined()
    })
  })

  describe('Context验证', () => {
    it('应该包含所有必需的Context字段', () => {
      logger.info(mockContext, '[testMethod] 测试')
      
      const callArgs = (console.log as any).mock.calls[0]
      const loggedContext = callArgs[1]

      expect(loggedContext).toHaveProperty('traceId')
      expect(loggedContext).toHaveProperty('userId')
      expect(loggedContext).toHaveProperty('timestamp')
      expect(loggedContext).toHaveProperty('platform')
    })

    it('应该处理空userId', () => {
      const contextWithEmptyUser: LogContext = {
        ...mockContext,
        userId: ''
      }
      
      logger.info(contextWithEmptyUser, '[testMethod] 未登录用户')
      
      const callArgs = (console.log as any).mock.calls[0]
      const loggedContext = callArgs[1]
      
      expect(loggedContext.userId).toBe('')
    })
  })

  describe('日志格式', () => {
    it('应该包含时间戳', () => {
      logger.info(mockContext, '[testMethod] 测试')
      
      const callArgs = (console.log as any).mock.calls[0]
      const logPrefix = callArgs[0]
      
      // 检查是否包含时间戳格式
      expect(logPrefix).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)
    })

    it('应该保持方法名格式', () => {
      logger.info(mockContext, '[testMethod] 这是日志内容')
      
      const callArgs = (console.log as any).mock.calls[0]
      const prefix = callArgs[0]
      
      expect(prefix).toContain('[testMethod] 这是日志内容')
    })
  })

  describe('日志格式验证', () => {
    it('应该验证Context字段完整性', () => {
      const invalidContext = {
        traceId: 'test-123',
        // 缺少userId
        timestamp: Date.now(),
        platform: 'h5'
      } as LogContext
      
      // 应该抛出错误
      expect(() => {
        logger.info(invalidContext, '[test] 测试')
      }).toThrow('Context必须包含所有必填字段')
    })
    
    it('应该验证Context不为空', () => {
      expect(() => {
        logger.info(null as any, '[test] 测试')
      }).toThrow('Context不能为空')
    })
  })
})
