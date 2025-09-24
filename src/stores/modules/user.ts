import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'
import { logger, createContext } from '@/utils'
import { wechatCodeLogin as apiWechatCodeLogin, smsLogin as apiSmsLogin, sendSMSCode as apiSendSMSCode, getUserInfo, updateUserInfo as apiUpdateUserInfo, logout as apiLogout, wechatPhoneLogin } from '@/api/modules/auth'
import type { WeChatLoginData, PhoneLoginData, LoginResponse, UserInfo } from '@/api/modules/auth'
import type { ApiResponse } from '@/types'
import { ErrorCode, getFriendlyErrorMessage, isNetworkError } from '@/types/errorCodes'

// 标准错误类 - 自动绑定错误码和友好消息
class BusinessError extends Error {
  constructor(public code: ErrorCode, customMessage?: string) {
    const friendlyMessage = getFriendlyErrorMessage(code, customMessage)
    super(friendlyMessage)
    this.name = 'BusinessError'
  }
}

// 重新导出类型，便于外部使用
export type { UserInfo, WeChatLoginData, PhoneLoginData, LoginResponse }

// Store特有的参数类型
export interface WeChatLoginParams {
  code: string
  userInfo: any
}


export const useUserStore = defineStore('user', () => {
  // 状态
  const userInfo = ref<UserInfo | null>(null)
  const token = ref<string>('')

  // 防重复登录锁
  let loginLock = false
  let phoneLoginLock = false

  // API调用优化 - 防重复checkLoginStatus调用
  let checkLoginStatusPromise: Promise<boolean> | null = null
  
  // 计算属性
  const isLoggedIn = computed(() => {
    return !!token.value && !!userInfo.value
  })
  
  const userNickname = computed(() => {
    return userInfo.value?.nickname || userInfo.value?.phone || '用户'
  })
  
  const userAvatar = computed(() => {
    return userInfo.value?.avatar || '/static/images/default-avatar.png'
  })
  
  // 初始化 - 修复异步获取问题，添加数据验证
  const initUserInfo = async () => {
    const ctx = createContext()
    try {
      const savedToken = await getStorage('token')
      const savedUserInfo = await getStorage('userInfo')

      if (savedToken && savedUserInfo) {
        // 验证数据的完整性和有效性
        if (validateUserData(savedToken, savedUserInfo)) {
          token.value = savedToken
          userInfo.value = savedUserInfo
          logger.debug(ctx, '[initUserInfo] 用户信息初始化成功')
        } else {
          logger.warn(ctx, '[initUserInfo] 检测到损坏的用户数据，清除本地存储')
          await clearUserInfo()
        }
      } else {
        logger.debug(ctx, '[initUserInfo] 本地无用户信息')
      }
    } catch (error) {
      logger.error(ctx, '[initUserInfo] 初始化用户信息失败，清除可能损坏的数据', error)
      try {
        await clearUserInfo()
      } catch (clearError) {
        logger.error(ctx, '[initUserInfo] 清除数据失败', clearError)
      }
    }
  }

  // 验证Token格式和有效性 - 基于项目实际的JWT生成逻辑
  const validateToken = (token: string): boolean => {
    const ctx = createContext()
    try {
      // 基础格式检查
      if (!token || typeof token !== 'string' || token.trim().length === 0) {
        logger.debug(ctx, '[validateToken] Token为空或格式无效')
        return false
      }

      // 基于我们的JWT实现，token应该是标准的三段式结构
      const parts = token.split('.')
      if (parts.length !== 3) {
        logger.debug(ctx, '[validateToken] Token格式错误，期望三段式结构')
        return false
      }

      // 检查每个部分都不为空
      if (parts.some(part => !part || part.length === 0)) {
        logger.debug(ctx, '[validateToken] Token部分段落为空')
        return false
      }

      try {
        // 解析JWT header验证基本结构
        const header = JSON.parse(atob(parts[0]))
        if (!header.alg || !header.typ) {
          logger.debug(ctx, '[validateToken] JWT header格式无效')
          return false
        }

        // 验证算法是否为我们使用的HS256
        if (header.alg !== 'HS256') {
          logger.debug(ctx, '[validateToken] JWT算法不匹配', { expected: 'HS256', actual: header.alg })
          return false
        }

        // 解析JWT payload验证业务字段
        const payload = JSON.parse(atob(parts[1]))

        // 检查必需的业务字段（基于我们的Claims结构）
        if (!payload.user_id || typeof payload.user_id !== 'number') {
          logger.debug(ctx, '[validateToken] JWT payload缺少有效的user_id字段')
          return false
        }

        // 检查JWT标准字段
        if (!payload.exp || !payload.iat || !payload.nbf) {
          logger.debug(ctx, '[validateToken] JWT payload缺少标准时间字段')
          return false
        }

        // 检查过期时间
        const currentTime = Math.floor(Date.now() / 1000)
        if (payload.exp <= currentTime) {
          logger.debug(ctx, '[validateToken] JWT已过期', {
            exp: payload.exp,
            expDate: new Date(payload.exp * 1000).toLocaleString(),
            now: currentTime,
            nowDate: new Date(currentTime * 1000).toLocaleString()
          })
          return false
        }

        // 检查生效时间
        if (payload.nbf > currentTime) {
          logger.debug(ctx, '[validateToken] JWT尚未生效', { nbf: payload.nbf, now: currentTime })
          return false
        }

        logger.debug(ctx, '[validateToken] JWT格式和内容验证通过', {
          userId: payload.user_id,
          expireAt: new Date(payload.exp * 1000).toLocaleString(),
          algorithm: header.alg
        })
        return true

      } catch (parseError) {
        logger.debug(ctx, '[validateToken] JWT解析失败，可能是伪造或损坏的token', parseError)
        return false
      }

    } catch (error) {
      logger.error(ctx, '[validateToken] 验证过程异常', error)
      return false
    }
  }

  // 验证用户数据的完整性
  const validateUserData = (tokenData: any, userInfoData: any): boolean => {
    const ctx = createContext()
    try {
      // 使用新的token验证逻辑
      if (!validateToken(tokenData)) {
        logger.debug(ctx, '[validateUserData] Token验证失败')
        return false
      }

      // 验证userInfo结构
      if (!userInfoData || typeof userInfoData !== 'object') {
        logger.debug(ctx, '[validateUserData] 用户信息格式无效')
        return false
      }

      // 检查必需字段
      const requiredFields = ['id']
      for (const field of requiredFields) {
        if (!(field in userInfoData)) {
          logger.debug(ctx, '[validateUserData] 缺少必需字段', { field })
          return false
        }
      }

      logger.debug(ctx, '[validateUserData] 数据验证通过')
      return true
    } catch (error) {
      logger.error(ctx, '[validateUserData] 数据验证异常', error)
      return false
    }
  }
  
  // 保存用户信息 - 添加异常处理和回滚机制
  const saveUserInfo = async (newToken: string, newUserInfo: UserInfo) => {
    const ctx = createContext()
    
    // 参数验证
    if (!newToken || !newUserInfo) {
      logger.error(ctx, '[saveUserInfo] 参数验证失败，用户信息或token不能为空')
      throw new BusinessError(ErrorCode.ERR_INVALID_PARAMS, '用户信息或token不能为空')
    }

    // 保存当前状态用于回滚
    const previousToken = token.value
    const previousUserInfo = userInfo.value

    try {
      logger.debug(ctx, '[saveUserInfo] 开始保存用户信息')
      
      // 先更新内存状态
      token.value = newToken
      userInfo.value = newUserInfo

      // 尝试保存到Storage
      await setStorage('token', newToken)
      await setStorage('userInfo', newUserInfo)
      
      logger.info(ctx, '[saveUserInfo] 用户信息保存成功')
    } catch (error) {
      // 保存失败时回滚内存状态
      token.value = previousToken
      userInfo.value = previousUserInfo

      logger.error(ctx, '[saveUserInfo] 保存用户信息失败，已回滚状态', error)
      throw new BusinessError(ErrorCode.ERR_STORAGE_FAILED, '保存用户信息失败')
    }
  }
  
  // 清除用户信息 - 支持async操作
  const clearUserInfo = async () => {
    const ctx = createContext()
    
    logger.debug(ctx, '[clearUserInfo] 开始清除用户信息')
    token.value = ''
    userInfo.value = null

    try {
      await removeStorage('token')
      await removeStorage('userInfo')
      logger.info(ctx, '[clearUserInfo] 用户信息清除成功')
    } catch (error) {
      logger.error(ctx, '[clearUserInfo] 清除存储数据失败', error)
      // 即使清除失败，内存状态已经重置，继续执行
    }
  }
  
  // 微信登录
  const loginWithWeChat = async (params: WeChatLoginParams): Promise<ApiResponse> => {
    const ctx = createContext()
    
    try {
      logger.info(ctx, '[loginWithWeChat] 开始微信登录')
      
      const data = await apiWechatCodeLogin({
        code: params.code,
        nickname: params.userInfo.nickName,
        avatar: params.userInfo.avatarUrl,
        gender: params.userInfo.gender
      })
      
      await saveUserInfo(data.token, data.user)
      logger.info(ctx, '[loginWithWeChat] 微信登录成功')
      
      return { code: 0, message: '登录成功', data, success: true }
    } catch (error: any) {
      logger.error(ctx, '[loginWithWeChat] 微信登录失败', error)
      return {
        code: -1,
        message: error.message || '网络错误',
        data: null,
        success: false
      }
    }
  }
  
  // 登录前状态检查 - 实现正确的登录UX模式
  const preLoginCheck = async (): Promise<void> => {
    const ctx = createContext()
    
    logger.debug(ctx, '[preLoginCheck] 检查当前登录状态')

    // 检查用户是否已经登录
    if (isLoggedIn.value) {
      logger.warn(ctx, '[preLoginCheck] 用户已登录，拒绝重复登录')
      throw new BusinessError(ErrorCode.ERR_ALREADY_LOGGED_IN, '您已经登录，如需切换账号请先退出当前账号')
    }

    logger.debug(ctx, '[preLoginCheck] 当前未登录，可以进行登录')
  }

  // 微信手机号快捷登录
  const wechatLogin = async (params: { code: string; encryptedData: string; iv: string }): Promise<void> => {
    const ctx = createContext()
    
    logger.info(ctx, '[wechatLogin] 开始微信手机号快捷登录流程')

    // 参数验证
    if (!params.code || !params.encryptedData || !params.iv) {
      logger.error(ctx, '[wechatLogin] 登录参数不完整', params)
      throw new BusinessError(ErrorCode.ERR_INVALID_PARAMS, '获取手机号失败，请重试')
    }

    // 原子性检查并设置登录锁 - 防重复登录
    if (loginLock) {
      logger.warn(ctx, '[wechatLogin] 登录正在进行中，拒绝重复请求')
      throw new BusinessError(ErrorCode.ERR_OPERATION_IN_PROGRESS)
    }
    loginLock = true // 立即设置锁，避免竞态条件
    logger.debug(ctx, '[wechatLogin] 已设置登录锁')

    try {
      // 登录前状态检查 - 防止重复登录
      await preLoginCheck()

      // 显示loading状态
      uni.showLoading({ title: '登录中...', mask: true })

      // 调用后端微信手机号登录接口
      logger.debug(ctx, '[wechatLogin] 调用后端微信手机号登录接口', params)

      const apiResult = await wechatPhoneLogin(params)

      logger.info(ctx, '[wechatLogin] 微信手机号登录成功', { userId: apiResult.user.id })

      // 保存登录信息
      await saveUserInfo(apiResult.token, apiResult.user)

      logger.debug(ctx, '[wechatLogin] 用户信息已保存')
      logger.info(ctx, '[wechatLogin] 微信手机号快捷登录流程成功!')

      // 隐藏loading
      uni.hideLoading()

    } catch (error: any) {
      logger.error(ctx, '[wechatLogin] 微信手机号登录失败', error)

      // 隐藏loading
      uni.hideLoading()

      // 如果是 BusinessError，直接使用其错误码和消息
      if (error instanceof BusinessError) {
        uni.showToast({
          title: error.message,
          icon: 'none'
        })
        throw error
      }

      // 处理其他类型的错误
      const errorMessage = '登录失败，请重试'
      let errorCode = ErrorCode.ERR_OPERATION_FAILED

      if (error.message?.includes('Network Error') ||
          error.message?.includes('timeout') ||
          error.message?.includes('连接') ||
          error.message?.includes('ECONNREFUSED')) {
        errorCode = ErrorCode.ERR_REQUEST_TIMEOUT
      } else if (error.message?.includes('404')) {
        errorCode = ErrorCode.ERR_NOT_FOUND
      }

      const businessError = new BusinessError(errorCode)
      uni.showToast({
        title: businessError.message,
        icon: 'none'
      })

      throw businessError
    } finally {
      // 释放登录锁 - 无论成功还是失败都要释放
      loginLock = false
      logger.debug(ctx, '[wechatLogin] 已释放登录锁')
    }
  }
  
  // 手机号登录
  const loginWithPhone = async (params: PhoneLoginData): Promise<ApiResponse> => {
    const ctx = createContext()
    
    // 原子性检查并设置手机号登录锁 - 防重复登录
    if (phoneLoginLock) {
      logger.warn(ctx, '[loginWithPhone] 登录正在进行中，拒绝重复请求')
      throw new BusinessError(ErrorCode.ERR_OPERATION_IN_PROGRESS)
    }
    phoneLoginLock = true // 立即设置锁，避免竞态条件
    logger.debug(ctx, '[loginWithPhone] 已设置登录锁')

    try {
      // 登录前状态检查 - 防止重复登录
      await preLoginCheck()

      logger.info(ctx, '[loginWithPhone] 开始手机号登录', { phone: params.phone })
      
      const data = await apiSmsLogin(params)
      await saveUserInfo(data.token, data.user)
      
      logger.info(ctx, '[loginWithPhone] 手机号登录成功', { userId: data.user.id })
      return { code: 0, message: '登录成功', data, success: true }
    } catch (error: any) {
      logger.error(ctx, '[loginWithPhone] 手机登录失败', error)
      return {
        code: -1,
        message: error.message || '网络错误',
        data: null,
        success: false
      }
    } finally {
      // 释放手机号登录锁 - 无论成功还是失败都要释放
      phoneLoginLock = false
      logger.debug(ctx, '[loginWithPhone] 已释放登录锁')
    }
  }
  
  // 发送短信验证码
  const sendSMSCode = async (phone: string): Promise<ApiResponse> => {
    const ctx = createContext()
    
    try {
      logger.info(ctx, '[sendSMSCode] 发送验证码', { phone })
      
      await apiSendSMSCode(phone)
      
      logger.info(ctx, '[sendSMSCode] 验证码发送成功')
      return { code: 0, message: '验证码发送成功', data: { sent: true }, success: true }
    } catch (error: any) {
      logger.error(ctx, '[sendSMSCode] 发送验证码失败', error)
      return {
        code: -1,
        message: error.message || '网络错误',
        data: null,
        success: false
      }
    }
  }
  
  // 获取用户信息
  const fetchUserInfo = async (): Promise<ApiResponse<UserInfo>> => {
    const ctx = createContext()
    
    try {
      logger.debug(ctx, '[fetchUserInfo] 开始获取用户信息')
      
      const data = await getUserInfo()
      userInfo.value = data
      setStorage('userInfo', data)
      
      logger.info(ctx, '[fetchUserInfo] 获取用户信息成功', { userId: data.id })
      return { code: 0, message: '获取成功', data, success: true }
    } catch (error: any) {
      logger.error(ctx, '[fetchUserInfo] 获取用户信息失败', error)
      return {
        code: -1,
        message: error.message || '网络错误',
        data: {} as UserInfo,
        success: false
      }
    }
  }
  
  // 验证用户信息字段长度 - 基于主流产品调研（严格限制模式）
  const validateUserInfoFields = (updates: Partial<UserInfo>): { valid: boolean; message: string } => {
    // 字段长度限制（基于调研：微信16个中文字符，抖音20-30字符）
    const fieldLimits = {
      nickname: 16,    // 对标微信：最多16个中文字符
      phone: 15,       // 中国手机号11位 + 格式化字符
      avatar: 500      // 头像URL最大500字符
    }

    for (const [field, value] of Object.entries(updates)) {
      if (value && typeof value === 'string') {
        const limit = fieldLimits[field as keyof typeof fieldLimits]
        if (limit && value.length > limit) {
          return {
            valid: false,
            message: `${field === 'nickname' ? '昵称' : field === 'phone' ? '手机号' : '头像'}长度超限，最多${limit}个字符`
          }
        }
      }
    }

    return { valid: true, message: '' }
  }

  // 更新用户信息 - 采用严格验证模式（对标抖音）
  const updateUserInfo = async (updates: Partial<UserInfo>): Promise<ApiResponse<UserInfo>> => {
    const ctx = createContext()
    
    try {
      logger.debug(ctx, '[updateUserInfo] 开始更新用户信息', updates)
      
      // 严格字段验证 - 直接拒绝，提示用户修正
      const validation = validateUserInfoFields(updates)
      if (!validation.valid) {
        logger.warn(ctx, '[updateUserInfo] 字段验证失败', { message: validation.message })
        return {
          code: -1,
          message: validation.message,
          data: {} as UserInfo,
          success: false
        }
      }

      const data = await apiUpdateUserInfo(updates)
      userInfo.value = { ...userInfo.value, ...data }
      setStorage('userInfo', userInfo.value)
      
      logger.info(ctx, '[updateUserInfo] 用户信息更新成功', { userId: data.id })
      return { code: 0, message: '更新成功', data, success: true }
    } catch (error: any) {
      logger.error(ctx, '[updateUserInfo] 更新用户信息失败', error)
      return {
        code: -1,
        message: error.message || '网络错误',
        data: {} as UserInfo,
        success: false
      }
    }
  }
  
  // 退出登录
  const logout = async (): Promise<void> => {
    const ctx = createContext()
    
    try {
      logger.info(ctx, '[logout] 开始退出登录')
      
      // 调用后端退出接口（可选）
      await apiLogout()
      logger.debug(ctx, '[logout] 后端退出接口调用成功')
    } catch (error) {
      logger.error(ctx, '[logout] 退出登录接口调用失败', error)
    } finally {
      // 清除本地存储
      await clearUserInfo()

      // 释放所有锁
      loginLock = false
      phoneLoginLock = false
      
      logger.info(ctx, '[logout] 退出登录完成')
    }
  }
  
  // 检查登录状态 - 优化并发调用
  const checkLoginStatus = async (): Promise<boolean> => {
    const ctx = createContext()
    
    // API调用优化：防止重复的checkLoginStatus调用
    if (checkLoginStatusPromise) {
      logger.debug(ctx, '[checkLoginStatus] 检测到并发调用，复用现有Promise')
      return checkLoginStatusPromise
    }

    // 创建新的检查Promise
    checkLoginStatusPromise = (async (): Promise<boolean> => {
      try {
        // 修复：先从本地存储初始化用户信息
        await initUserInfo()

        if (!token.value) {
          logger.debug(ctx, '[checkLoginStatus] 无token，用户未登录')
          return false
        }

        // 本地Token验证 - 避免无效token的API调用
        if (!validateToken(token.value)) {
          logger.debug(ctx, '[checkLoginStatus] Token本地验证失败，清除无效数据')
          await clearUserInfo()
          return false
        }

        try {
          logger.debug(ctx, '[checkLoginStatus] Token本地验证通过，调用API验证token有效性')
          const result = await fetchUserInfo()
          if (result.success) {
            logger.info(ctx, '[checkLoginStatus] token验证成功，用户已登录')
            return true
          } else {
            logger.debug(ctx, '[checkLoginStatus] token验证失败', { message: result.message })
            await clearUserInfo()
            return false
          }
        } catch (error) {
          logger.error(ctx, '[checkLoginStatus] 检查登录状态失败', error)
          await clearUserInfo()
          return false
        }
      } finally {
        // 清理Promise缓存，允许后续新的调用
        checkLoginStatusPromise = null
      }
    })()

    return checkLoginStatusPromise
  }
  
  return {
    // 状态
    userInfo,
    token,
    
    // 计算属性
    isLoggedIn,
    userNickname,
    userAvatar,
    
    // 方法
    initUserInfo,
    loginWithWeChat,
    wechatLogin, // 调试版微信登录
    loginWithPhone,
    sendSMSCode,
    fetchUserInfo,
    updateUserInfo,
    logout,
    checkLoginStatus,
    clearUserInfo
  }
})
