/**
 * 日志辅助函数
 * 提供Context创建、TraceID生成等功能
 */

import type { LogContext } from './logger'
import CryptoJS from 'crypto-js'
import { getActivePinia } from 'pinia'
import { useUserStore } from '@/stores/modules/user'
import { getUni, getPlatform } from '@/utils/safeUni'

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
 * 惰性获取用户信息
 * 避免在Pinia未初始化时调用useUserStore导致错误
 * @returns 用户ID（已哈希），如果获取失败返回空字符串
 */
function getUserIdSafely(): string {
  try {
    // 优先从活动实例获取，其次从全局 app 中获取
    const active = typeof getActivePinia === 'function' ? getActivePinia() : null
    // @ts-ignore
    const globalPinia = (typeof getApp === 'function' && (getApp() as any)?.$pinia) || null
    const pinia = active || globalPinia

    let userStore: ReturnType<typeof useUserStore> | null = null
    if (pinia) {
      userStore = useUserStore(pinia)
    } else {
      // 测试环境兜底：允许无参数调用（vitest 中已 mock useUserStore）
      try { userStore = useUserStore() as any } catch { userStore = null }
    }

    if (userStore?.userInfo?.id) {
      return hashUserId(userStore.userInfo.id)
    }
  } catch (error) {
    // Pinia未初始化或其他错误时，静默失败
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Logger] 获取用户信息失败（可能是Pinia未初始化）:', error)
    }
  }
  return ''
}

/**
 * 创建日志上下文（惰性读取 uni，带兜底，避免首屏抢跑）
 * 统一创建包含所有必填字段的Context
 * @returns LogContext
 */
export function createContext(): LogContext {
  const userId = getUserIdSafely()

  // 平台：优先编译期常量；运行时可进一步补充
  let platform = getPlatform()

  // systemInfo 仅在 runtime 注入后尝试获取（未注入时不抛错）
  try {
    const u = getUni()
    if (typeof u.getSystemInfoSync === 'function') {
      const sys = u.getSystemInfoSync()
      // 如果编译期没有标识，这里用运行时填充
      platform = platform || sys?.platform || 'unknown'
    }
  } catch (error) {
    console.warn('[Logger] 获取平台信息失败:', error)
  }

  return {
    traceId: generateTraceId(),
    userId,
    timestamp: Date.now(),
    platform
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
