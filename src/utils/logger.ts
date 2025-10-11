/**
 * 统一日志系统
 * 
 * 使用示例：
 * ```typescript
 * import { logger, createContext } from '@/utils'
 * 
 * const ctx = createContext()
 * logger.info(ctx, '[getUserInfo] 获取用户信息成功')
 * logger.error(ctx, '[saveData] 保存失败', error)
 * ```
 */

// 日志级别枚举
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

// 日志上下文接口 - 所有字段必填
export interface LogContext {
  traceId: string      // 追踪ID，用于关联请求链路
  userId: string       // 用户ID（哈希后），空字符串表示未登录
  timestamp: number    // 时间戳
  platform: string     // 平台信息，获取失败时为'unknown'
}

// 日志条目接口
export interface LogEntry {
  level: LogLevel
  message: string
  context: LogContext
  timestamp: string    // 格式化后的时间
  extra?: any         // 额外信息
}

class Logger {
  // 环境判断
  private isDevelopment(): boolean {
    // 在uni-app中通过编译条件判断
    // #ifdef H5
    return process.env.NODE_ENV === 'development'
    // #endif
    // #ifndef H5
    return true // 小程序开发环境默认为true
    // #endif
  }

  // 格式化时间戳
  private formatTimestamp(timestamp: number): string {
    try {
      const date = new Date(timestamp)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      const milliseconds = String(date.getMilliseconds()).padStart(3, '0')
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
    } catch (error) {
      return 'Invalid Date'
    }
  }

  // 验证Context
  private validateContext(context: LogContext): void {
    if (!context) {
      throw new Error('Context不能为空')
    }

    const requiredFields: (keyof LogContext)[] = ['traceId', 'userId', 'timestamp', 'platform']
    const missingFields = requiredFields.filter(field => 
      context[field] === undefined || context[field] === null
    )

    if (missingFields.length > 0) {
      throw new Error('Context必须包含所有必填字段')
    }
  }

  // 输出日志到控制台
  private logToConsole(level: LogLevel, message: string, context: LogContext, extra?: any): void {
    const timestamp = this.formatTimestamp(Date.now())
    const formattedMessage = `[${timestamp}] [${level}] [${context.traceId}] ${message}`

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, context, extra)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage, context, extra)
        break
      case LogLevel.INFO:
        console.log(formattedMessage, context, extra)
        break
      case LogLevel.DEBUG:
        console.debug(formattedMessage, context, extra)
        break
    }
  }

  // 核心日志方法
  private log(level: LogLevel, context: LogContext, message: string, extra?: any): void {
    // 验证context
    this.validateContext(context)

    if (this.isDevelopment()) {
      // 开发环境：输出到console
      this.logToConsole(level, message, context, extra)
    } else {
      // 生产环境：准备上报
      const entry: LogEntry = {
        level,
        message,
        context,
        timestamp: this.formatTimestamp(Date.now()),
        extra
      }
      this.report(entry)
    }
  }

  // 错误级别
  error(context: LogContext, message: string, error?: any): void {
    this.log(LogLevel.ERROR, context, message, error)
  }

  // 警告级别
  warn(context: LogContext, message: string, extra?: any): void {
    this.log(LogLevel.WARN, context, message, extra)
  }

  // 信息级别
  info(context: LogContext, message: string, extra?: any): void {
    this.log(LogLevel.INFO, context, message, extra)
  }

  // 调试级别
  debug(context: LogContext, message: string, extra?: any): void {
    this.log(LogLevel.DEBUG, context, message, extra)
  }

  // 上报接口（预留）
  report(entry: LogEntry): void {
    // TODO: 实现日志上报逻辑
    // 1. 批量收集日志
    // 2. 压缩数据
    // 3. 上报到服务端
    // 4. 失败重试机制
    
    // 临时实现：在生产环境也输出到console
    if (!this.isDevelopment()) {
      console.log('[Logger] 生产环境日志（待上报）:', entry)
    }
  }
}

// 导出单例
export const logger = new Logger()

// 导出类型
export type { LogEntry, LogContext }