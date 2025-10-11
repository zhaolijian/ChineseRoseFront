/**
 * 统一错误处理工具
 * 基于现有的 errorCodes.ts 提供更好的错误处理体验
 */

import { 
  ErrorCode, 
  getFriendlyErrorMessage,
  isAuthError,
  isNetworkError,
  isQuotaError
} from '@/types/errorCodes'
import { logger } from './logger'

// 简单的日志上下文接口
interface LogContext {
  traceId: string
  userId: string
  timestamp: number
  platform: string
}

// 创建简单的日志上下文
function createRequestContext(): LogContext {
  return {
    traceId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: '',
    timestamp: Date.now(),
    platform: 'miniprogram'
  }
}

// 扩展错误消息映射（针对微信特殊错误码）
const WX_ERROR_MAP: Record<string, string> = {
  // 微信SDK错误
  '-10000': '系统繁忙，请稍后重试',
  '-10001': '系统升级中，请稍后访问', 
  
  // 微信API错误
  '40001': '获取微信信息失败，请重试',
  '40002': '微信授权失败，请重新授权',
  '40003': '微信登录失败，请使用其他方式登录',
  '40163': '操作过于频繁，请稍后再试',
  '42001': '微信授权已过期，请重新授权',
  '45011': '操作太频繁，请稍后再试',
  
  // 网络错误
  'NETWORK_ERROR': '网络异常，请检查网络连接',
  'TIMEOUT': '请求超时，请稍后重试',
  'REQUEST_FAILED': '请求失败，请重试',
  
  // HTTP状态码
  '404': '请求的资源不存在',
  '500': '服务器异常，请稍后重试',
  '502': '网关错误，请稍后重试',
  '503': '服务暂时不可用，请稍后重试'
}

interface ErrorHandlerOptions {
  showToast?: boolean       // 是否显示提示
  canRetry?: boolean        // 是否可重试
  retryCallback?: () => void // 重试回调
  duration?: number         // 提示持续时间
  needLogin?: boolean       // 是否需要登录
  silent?: boolean          // 静默处理（不显示任何提示）
}

class ErrorHandler {
  private retryCallbacks = new Map<string, () => void>()
  
  /**
   * 处理错误 - 兼容现有的错误处理逻辑
   */
  handle(error: any, options: ErrorHandlerOptions = {}) {
    const {
      showToast = true,
      canRetry = false,
      retryCallback = null,
      duration = 2500,
      needLogin = false,
      silent = false
    } = options

    const ctx = createRequestContext()
    
    // 提取错误信息
    const { code, message } = this.extractErrorInfo(error)
    
    // 记录日志
    logger.error(ctx, '[ErrorHandler] 错误处理', {
      error,
      code,
      message,
      options
    })
    
    // 静默处理
    if (silent) {
      return message
    }
    
    // 判断是否需要重新登录
    if (isAuthError(code) || needLogin) {
      this.handleAuthError(message)
      return message
    }
    
    // 配额错误特殊处理
    if (isQuotaError(code)) {
      this.handleQuotaError(message)
      return message
    }
    
    // 网络错误支持重试
    if (isNetworkError(code) && canRetry && retryCallback) {
      this.showRetryModal(message, retryCallback)
      return message
    }
    
    // 默认显示toast提示
    if (showToast) {
      uni.showToast({
        title: message,
        icon: 'none',
        duration
      })
    }
    
    return message
  }
  
  /**
   * 提取错误信息 - 兼容各种错误格式
   */
  private extractErrorInfo(error: any): { code: number, message: string } {
    // 直接是字符串
    if (typeof error === 'string') {
      return { code: -1, message: error }
    }
    
    // 提取错误码
    let code = 0
    if (error.errorCode !== undefined) code = error.errorCode
    else if (error.errCode !== undefined) code = error.errCode
    else if (error.err_code !== undefined) code = error.err_code
    else if (error.code !== undefined) code = error.code
    else if (error.statusCode !== undefined) code = error.statusCode
    
    // 特殊处理微信错误
    if (error.errMsg) {
      // 处理网络错误
      if (error.errMsg.includes('timeout')) {
        return { code: ErrorCode.ERR_REQUEST_TIMEOUT, message: WX_ERROR_MAP['TIMEOUT'] }
      }
      if (error.errMsg.includes('network')) {
        return { code: -1, message: WX_ERROR_MAP['NETWORK_ERROR'] }
      }
      if (error.errMsg.includes('request:fail')) {
        return { code: -1, message: WX_ERROR_MAP['REQUEST_FAILED'] }
      }
      
      // 尝试从errMsg中提取错误码
      const match = error.errMsg.match(/[-\d]+/)
      if (match) {
        code = parseInt(match[0])
      }
    }
    
    // 获取用户友好的错误消息
    let message = ''
    
    // 1. 优先使用项目定义的错误消息（errorCodes.ts）
    if (code && code !== 0) {
      message = getFriendlyErrorMessage(code, error.message || error.msg)
    }
    
    // 2. 其次使用微信错误消息映射
    if (!message && WX_ERROR_MAP[String(code)]) {
      message = WX_ERROR_MAP[String(code)]
    }
    
    // 3. 使用原始错误消息
    if (!message) {
      message = error.message || error.msg || error.errMsg || '未知错误，请重试'
    }
    
    return { code: Number(code), message }
  }
  
  /**
   * 处理认证错误
   */
  private handleAuthError(message: string) {
    uni.showModal({
      title: '提示',
      content: message,
      showCancel: false,
      confirmText: '去登录',
      success: () => {
        // 清除登录信息
        const storageKeys = [
          'chinese_rose_token',
          'chinese_rose_userInfo',
          'token',
          'userInfo',
          'user'
        ]
        
        storageKeys.forEach(key => {
          try {
            uni.removeStorageSync(key)
          } catch (e) {
            // 忽略清除失败
          }
        })
        
        // 跳转到登录页
        uni.reLaunch({
          url: '/pages/login/login'
        })
      }
    })
  }
  
  /**
   * 处理配额错误
   */
  private handleQuotaError(message: string) {
    uni.showModal({
      title: '配额提醒',
      content: message,
      confirmText: '我知道了',
      showCancel: false
    })
  }
  
  /**
   * 显示重试弹窗
   */
  private showRetryModal(message: string, retryCallback: () => void) {
    const ctx = createRequestContext()
    const retryKey = `retry_${Date.now()}`
    
    // 保存重试回调
    this.retryCallbacks.set(retryKey, retryCallback)
    
    uni.showModal({
      title: '提示',
      content: message,
      confirmText: '重试',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const callback = this.retryCallbacks.get(retryKey)
          if (callback) {
            logger.info(ctx, '[ErrorHandler] 用户选择重试')
            callback()
            this.retryCallbacks.delete(retryKey)
          }
        } else {
          this.retryCallbacks.delete(retryKey)
        }
      }
    })
  }
  
  /**
   * 处理图片加载错误
   */
  handleImageError(src: string, defaultImage?: string): string {
    const ctx = createRequestContext()
    logger.warn(ctx, '[ErrorHandler] 图片加载失败', { src })
    
    // 返回默认图片
    return defaultImage || '/static/images/default.png'
  }
  
  /**
   * 批量处理错误（用于表单验证等场景）
   */
  handleValidationErrors(errors: Array<{ field: string, message: string }>) {
    if (!errors || errors.length === 0) return
    
    // 只显示第一个错误
    const firstError = errors[0]
    uni.showToast({
      title: firstError.message,
      icon: 'none',
      duration: 2000
    })
  }
}

// 创建单例实例
const errorHandler = new ErrorHandler()

// 导出便捷方法
export const handleError = (error: any, options?: ErrorHandlerOptions) => 
  errorHandler.handle(error, options)

export const handleImageError = (src: string, defaultImage?: string) =>
  errorHandler.handleImageError(src, defaultImage)

export const handleValidationErrors = (errors: Array<{ field: string, message: string }>) =>
  errorHandler.handleValidationErrors(errors)

// 导出实例
export default errorHandler