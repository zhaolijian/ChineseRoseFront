/**
 * 日志辅助函数
 * 提供Context创建、TraceID生成等功能
 */

import { useUserStore } from '@/stores/modules/user'
import type { LogContext } from './logger'
import CryptoJS from 'crypto-js'

/**
 * 生成唯一的TraceID
 * 格式：时间戳(13位) + 随机字符串(4位)
 * @returns traceId
 */
export function generateTraceId(): string {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 6)
  return timestamp + random
}

/**
 * 哈希用户ID
 * 使用MD5哈希，取前8位+后8位，共16位
 * @param userId 原始用户ID
 * @returns 哈希后的16位ID，失败返回空字符串
 */
export function hashUserId(userId: string | null | undefined): string {
  try {
    // 处理空值
    if (!userId) {
      return ''
    }

    // 使用MD5哈希
    const hash = CryptoJS.MD5(userId).toString()
    
    // 取前8位 + 后8位
    return hash.substring(0, 8) + hash.substring(hash.length - 8)
  } catch (error) {
    console.warn('[Logger] 哈希用户ID失败:', error)
    return ''
  }
}

/**
 * 创建日志上下文
 * 统一创建包含所有必填字段的Context
 * @returns LogContext
 */
export function createContext(): LogContext {
  let userId = ''
  let platform = 'unknown'
  
  // 获取用户ID
  try {
    const userStore = useUserStore()
    if (userStore.userInfo?.id) {
      userId = hashUserId(userStore.userInfo.id)
    }
  } catch (error) {
    // userStore异常时使用空字符串
    console.warn('[Logger] 获取用户信息失败:', error)
  }
  
  // 获取平台信息
  try {
    const systemInfo = uni.getSystemInfoSync()
    platform = systemInfo.platform || 'unknown'
  } catch (error) {
    // 获取失败时使用默认值
    console.warn('[Logger] 获取平台信息失败:', error)
  }
  
  return {
    traceId: generateTraceId(),
    userId: userId,
    timestamp: Date.now(),
    platform: platform
  }
}

/**
 * 为请求创建Context（带缓存的版本）
 * 在同一个请求周期内复用traceId
 */
let requestContext: LogContext | null = null
let requestContextTimer: ReturnType<typeof setTimeout> | null = null

export function createRequestContext(): LogContext {
  // 如果已有context且未过期，直接返回
  if (requestContext) {
    return requestContext
  }
  
  // 创建新的context
  requestContext = createContext()
  
  // 设置过期时间（5秒后清除，避免内存泄漏）
  if (requestContextTimer) {
    clearTimeout(requestContextTimer)
  }
  requestContextTimer = setTimeout(() => {
    requestContext = null
    requestContextTimer = null
  }, 5000)
  
  return requestContext
}

/**
 * 清除请求上下文缓存
 * 在请求结束时调用
 */
export function clearRequestContext(): void {
  requestContext = null
  if (requestContextTimer) {
    clearTimeout(requestContextTimer)
    requestContextTimer = null
  }
}