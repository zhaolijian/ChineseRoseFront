/**
 * H5 开发环境自动登录工具
 * 仅在 H5 + 开发环境下生效，用于 UI 测试和开发调试
 */

import { request } from './request'
import { getStorage, setStorage } from './storage'
import { logger } from './logger'

/**
 * H5 开发环境自动登录
 * 使用白名单测试手机号自动获取 Token
 *
 * @description
 * - 仅在开发环境（import.meta.env.DEV）下执行
 * - 使用白名单手机号 13800138000
 * - 后端会跳过验证码验证，直接返回 Token
 * - Token 存储到 localStorage，后续请求自动携带
 */
export async function autoLoginInDev(): Promise<void> {
  // 仅在 H5 + 开发环境执行
  // @ts-ignore
  const isH5 = process.env.UNI_PLATFORM === 'h5'

  if (!isH5 || !import.meta.env.DEV) {
    return
  }

  try {
    const token = getStorage('token')

    // 如果已有 Token，跳过
    if (token) {
      logger.info('[DevAuth] Token 已存在，跳过自动登录')
      return
    }

    logger.info('[DevAuth] 开始自动登录...')

    // 调用登录接口（后端会识别白名单并跳过验证码验证）
    const res = await request.post<{ token: string; userInfo: any }>('/api/v1/auth/phone/login', {
      phone: '13800138000',
      code: '123456'  // 任意值，白名单会跳过验证
    })

    if (res.data?.token) {
      setStorage('token', res.data.token)
      logger.info('[DevAuth] 自动登录成功，Token 已保存')
    } else {
      logger.warn('[DevAuth] 登录响应中未找到 Token')
    }
  } catch (error: any) {
    logger.error('[DevAuth] 自动登录失败:', error?.message || error)
    // 登录失败不影响应用启动，静默处理
  }
}
