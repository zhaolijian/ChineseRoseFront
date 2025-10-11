// 统一请求返回：成功直接返回 body.data，失败抛出错误（由拦截器处理）

import { logger } from './logger'
import { createRequestContext, clearRequestContext } from './logger-helpers'
import type { LogContext } from './logger'
import { DEFAULT_REQUEST_TIMEOUT, REDIRECT_THROTTLE_TIME, TOKEN_KEY, USER_INFO_KEY } from '@/constants'
import { handleError } from './error-handler'
import { isAuthError } from '@/types/errorCodes'

// 请求配置
interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  params?: any
  headers?: Record<string, string>
  timeout?: number
  showLoading?: boolean
  showError?: boolean
  logContext?: LogContext  // 日志上下文，可选
}

// 请求拦截器类型
type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
type ResponseInterceptor = (response: any) => any
type ErrorInterceptor = (error: any) => Promise<never>

// 重定向节流标志，避免重复跳转导致 navigateTo/reLaunch timeout
let isRedirectingToLogin = false

class RequestManager {
  private baseURL = ''
  private timeout = DEFAULT_REQUEST_TIMEOUT
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []
  private errorInterceptors: ErrorInterceptor[] = []

  constructor() {
    this.setBaseURL()
    this.setupDefaultInterceptors()
  }

  private setBaseURL() {
    // H5 走同域代理；小程序直连后端（注意合法域名）
    // 可通过环境变量覆盖：VITE_API_BASE
    const env = (import.meta as any).env ?? {}
    const envBase = env.VITE_API_BASE as string | undefined

    const ctx = createRequestContext()
    logger.debug(ctx, '[setBaseURL] 环境变量检查', {
      VITE_API_BASE: envBase,
      MODE: env.MODE,
      DEV: env.DEV
    })

    // 小程序开发环境（微信开发者工具、调试版）需要走HTTP本地/内网地址，否则会因HTTPS证书缺失导致 TLS 错误
    // 提供环境变量覆盖：VITE_API_BASE_MP_DEV；若未配置，默认回退到 http://127.0.0.1:8080/api
    // 该代码在其它平台会被 tree-shaking 掉（#ifdef）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const mpDevFallback = (env.VITE_API_BASE_MP_DEV || env.VITE_API_BASE_DEV || 'http://127.0.0.1:8080/api') as string

    // #ifdef MP-WEIXIN
    let isWechatDevtools = false
    try {
      const systemInfo = uni.getSystemInfoSync?.()
      if (systemInfo?.platform === 'devtools') {
        isWechatDevtools = true
        logger.debug(ctx, '[setBaseURL] 检测到微信开发者工具 platform=devtools')
      }
      const accountInfo = uni.getAccountInfoSync?.()
      const envVersion = accountInfo?.miniProgram?.envVersion
      if (envVersion === 'develop' || envVersion === 'trial') {
        isWechatDevtools = true
        logger.debug(ctx, `[setBaseURL] envVersion=${envVersion}，视为调试环境`)
      }
    } catch (error) {
      logger.warn(ctx, '[setBaseURL] 检测小程序运行环境失败', error)
    }

    if (isWechatDevtools) {
      this.baseURL = mpDevFallback || envBase || 'http://127.0.0.1:8080/api'
      logger.warn(ctx, `[setBaseURL] 微信调试环境强制使用调试基址: ${this.baseURL}`)
      return
    }
    // #endif

    if (envBase) {
      this.baseURL = envBase
      logger.info(ctx, `[setBaseURL] 使用环境变量配置: ${this.baseURL}`)
      return
    }

    // #ifdef H5
    this.baseURL = '/api'
    logger.info(ctx, '[setBaseURL] H5模式使用代理: /api')
    // #endif
    // #ifdef MP-WEIXIN
    this.baseURL = 'http://127.0.0.1:8080/api'
    logger.info(ctx, '[setBaseURL] 小程序默认地址: http://127.0.0.1:8080/api')
    // #endif
    // #ifndef H5 && !MP-WEIXIN
    this.baseURL = 'http://127.0.0.1:8080/api'
    logger.info(ctx, '[setBaseURL] 其他平台默认地址: http://127.0.0.1:8080/api')
    // #endif

    logger.info(ctx, `[setBaseURL] 最终baseURL: ${this.baseURL}`)
  }

  private setupDefaultInterceptors() {
    // 请求拦截器：添加token和traceId
    this.addRequestInterceptor((config) => {
      // 创建或复用日志上下文
      const ctx = config.logContext || createRequestContext()
      config.logContext = ctx
      
      // 添加X-Trace-Id请求头
      config.headers = {
        ...config.headers,
        'X-Trace-Id': ctx.traceId
      }
      
      // 🔧 修复：使用与storage模块一致的key获取token
      let token = ''
      try {
        const rawData = uni.getStorageSync(TOKEN_KEY)
        if (rawData) {
          const data = JSON.parse(rawData)
          // 检查是否过期
          if (!data.expires || Date.now() <= data.expires) {
            token = data.value
          } else {
            // token过期，清除存储
            uni.removeStorageSync(TOKEN_KEY)
          }
        }
      } catch (error) {
        logger.error(ctx, '[setupDefaultInterceptors] 获取token失败', error)
      }
      
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        }
        logger.debug(ctx, '[addRequestInterceptor] 已添加token')
      } else {
        logger.debug(ctx, '[addRequestInterceptor] 无token')
      }
      
      logger.debug(ctx, `[addRequestInterceptor] 请求 ${config.method || 'GET'} ${config.url}`)
      return config
    })

    // 响应拦截器：统一处理响应 - 简化版本
    this.addResponseInterceptor((response) => {
      const { statusCode, data } = response

      const ctx = (response.config as RequestConfig)?.logContext || createRequestContext()
      logger.info(ctx, `[addResponseInterceptor] 响应状态码: ${statusCode}`)

      // 处理HTTP层面的401和403 - 认证失败（ADR-007: 懒验证机制）
      // 只在API调用遇到401/403时才清除登录状态，其他错误（网络、5xx）不改变登录状态
      if (statusCode === 401 || statusCode === 403) {
        logger.warn(ctx, `[addResponseInterceptor] HTTP ${statusCode} 认证失败，清除登录状态并跳转登录`)
        this.redirectToLogin()
        return Promise.reject({ code: statusCode, message: statusCode === 401 ? '登录已过期，请重新登录' : '访问被拒绝' })
      }

      // 检查响应数据格式
      if (!data || typeof data.code === 'undefined') {
        logger.error(ctx, '[addResponseInterceptor] 响应数据格式异常', data)
        uni.showToast({ title: '服务器响应格式异常', icon: 'none' })
        return Promise.reject({ code: -1, message: '响应格式异常' })
      }

      // 简化成功判断：仅 code === 0 表示成功
      if (data.code === 0) {
        logger.debug(ctx, '[addResponseInterceptor] 请求成功')
        return data.data
      } else {
        // 所有非0错误码都交给业务错误处理器
        logger.warn(ctx, `[addResponseInterceptor] 业务错误 - 错误码: ${data.code}, 信息: ${data.message}`)
        this.handleBusinessError(data)
        return Promise.reject(data)
      }
    })

    // 错误拦截器：处理网络错误
    this.addErrorInterceptor((error) => {
      this.handleNetworkError(error)
      return Promise.reject(error)
    })
  }

  // 添加请求拦截器
  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor)
  }

  // 添加响应拦截器
  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor)
  }

  // 添加错误拦截器
  addErrorInterceptor(interceptor: ErrorInterceptor) {
    this.errorInterceptors.push(interceptor)
  }

  // 处理业务错误 - 使用统一的错误处理器
  private handleBusinessError(data: any) {
    const errorCode = data?.code || 0
    
    const ctx = createRequestContext()
    logger.warn(ctx, `[handleBusinessError] 业务错误`, data)
    
    // 使用统一的错误处理器
    handleError(data, {
      showToast: true,
      needLogin: isAuthError(errorCode)
    })
  }

  // 未授权跳转登录（带防抖）
  private redirectToLogin() {
    const ctx = createRequestContext()

    if (isRedirectingToLogin) {
      logger.warn(ctx, '[redirectToLogin] 正在跳转中，忽略重复请求')
      return
    }
    isRedirectingToLogin = true

    try {
      // 🔧 修复：清除用户相关的所有存储，使用正确的key
      uni.removeStorageSync(TOKEN_KEY)
      uni.removeStorageSync(USER_INFO_KEY)
      uni.removeStorageSync('chinese_rose_token')
      uni.removeStorageSync('chinese_rose_userInfo')
      uni.removeStorageSync('token') // 兼容旧key
      uni.removeStorageSync('user') // 兼容旧key
      uni.removeStorageSync('userInfo') // 兼容旧key
      clearRequestContext()

      // 清除Pinia store的内存状态
      try {
        // 动态导入避免循环依赖
        import('@/stores/modules/user').then(module => {
          const { useUserStore } = module
          const userStore = useUserStore()
          userStore.token = ''
          userStore.userInfo = null
          logger.debug(ctx, '[redirectToLogin] 已清除store状态')
        })
      } catch (error) {
        logger.warn(ctx, '[redirectToLogin] 清除store状态失败（非致命错误）', error)
      }

      logger.info(ctx, '[redirectToLogin] 已清除用户信息，跳转到登录页')
      // 使用 reLaunch 清空页面栈，避免 navigateTo 频繁调用报超时
      uni.reLaunch({ url: '/pages/login/login' })
    } finally {
      setTimeout(() => { isRedirectingToLogin = false }, REDIRECT_THROTTLE_TIME)
    }
  }

  // 处理网络错误 - 使用统一的错误处理器
  private handleNetworkError(error: any) {
    const ctx = createRequestContext()
    logger.error(ctx, '[handleNetworkError] 网络请求错误', error)
    
    // 使用统一的错误处理器，支持重试
    handleError(error, {
      showToast: true,
      canRetry: true,
      retryCallback: () => {
        // 重试最后一次请求
        const pages = getCurrentPages()
        const currentPage = pages[pages.length - 1]
        if (currentPage && currentPage.onLoad) {
          currentPage.onLoad(currentPage.options)
        }
      }
    })
  }

  // 主请求方法
  async request<T = any>(config: RequestConfig): Promise<T> {
    // 应用请求拦截器
    let finalConfig = config
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig)
    }

    // 显示加载提示
    if (finalConfig.showLoading !== false) {
      uni.showLoading({
        title: '加载中...',
        mask: true
      })
    }

    try {
      // 构建完整URL
      const url = finalConfig.url.startsWith('http') 
        ? finalConfig.url 
        : this.baseURL + finalConfig.url

      // 处理 GET params：统一映射到 data 以便 uni.request 拼接查询串
      const payloadData = (finalConfig.method || 'GET').toUpperCase() === 'GET'
        ? (finalConfig.params ?? finalConfig.data)
        : finalConfig.data
      
      const ctx = finalConfig.logContext || createRequestContext()
      // 注入logContext到config以便响应拦截器使用
      finalConfig.logContext = ctx
      
      logger.info(ctx, `[request] 开始请求 ${finalConfig.method || 'GET'} ${url}`, {
        data: payloadData,
        headers: finalConfig.headers
      })

      // 发起请求（兼容不同端）
      const response = await new Promise<any>((resolve, reject) => {
        // #ifdef MP-WEIXIN
        wx.request({
          url,
          method: (finalConfig.method || 'GET') as any,
          data: payloadData,
          header: {
            'Content-Type': 'application/json',
            ...finalConfig.headers
          },
          timeout: finalConfig.timeout || this.timeout,
          success: (res) => resolve(res),
          fail: (err) => reject(err)
        })
        // #endif
        // #ifndef MP-WEIXIN
        uni.request({
          url,
          method: finalConfig.method || 'GET',
          data: payloadData,
          header: {
            'Content-Type': 'application/json',
            ...finalConfig.headers
          },
          timeout: finalConfig.timeout || this.timeout,
          success: (res) => resolve(res),
          fail: (err) => reject(err)
        })
        // #endif
      })

      // 隐藏加载提示
      if (finalConfig.showLoading !== false) {
        uni.hideLoading()
      }

      // 应用响应拦截器
      let finalResponse = response
      for (const interceptor of this.responseInterceptors) {
        finalResponse = interceptor(finalResponse)
      }

      // 此处 finalResponse 为后续拦截器产物：直接是 data（即 body.data）
      return finalResponse as T
    } catch (error) {
      // 隐藏加载提示
      if (finalConfig.showLoading !== false) {
        uni.hideLoading()
      }

      // 应用错误拦截器
      for (const interceptor of this.errorInterceptors) {
        await interceptor(error)
      }

      throw error
    } finally {
      clearRequestContext()
    }
  }

  // GET请求
  get<T = any>(url: string, params?: any, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      url,
      method: 'GET',
      params,
      ...config
    })
  }

  // POST请求
  post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      ...config
    })
  }

  // PUT请求
  put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...config
    })
  }

  // DELETE请求
  delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config
    })
  }

  // 文件上传
  upload(filePath: string, formData?: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      // 🔧 修复：使用与storage模块一致的key获取token
      let token = ''
      try {
        const rawData = uni.getStorageSync(TOKEN_KEY)
        if (rawData) {
          const data = JSON.parse(rawData)
          if (!data.expires || Date.now() <= data.expires) {
            token = data.value
          }
        }
      } catch (error) {
        const ctx = createRequestContext()
        logger.error(ctx, '[upload] 文件上传获取token失败', error)
      }
      
      uni.uploadFile({
        url: this.baseURL + '/upload',
        filePath,
        name: 'file',
        formData,
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.code === 0) {
              resolve(data)
            } else {
              reject(data)
            }
          } catch (e) {
            reject({ code: -1, message: '响应解析失败' })
          }
        },
        fail: reject
      })
    })
  }
}

// 创建请求实例
const http = new RequestManager()

// 定义可调用且带方法签名的类型
type RequestCallable = {
  <T = any>(config: RequestConfig): Promise<T>
  get<T = any>(url: string, params?: any, config?: Partial<RequestConfig>): Promise<T>
  post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T>
  put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T>
  delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<T>
  upload(filePath: string, formData?: Record<string, any>): Promise<any>
}

// 同时支持函数式与面向对象式两种用法：
// - 函数式：request({ url, method, ... })
// - 面向对象式：request.get('/path'), request.post('/path', data)
const requestFn = (<T = any>(config: RequestConfig) => http.request<T>(config)) as RequestCallable
requestFn.get = http.get.bind(http)
requestFn.post = http.post.bind(http)
requestFn.put = http.put.bind(http)
requestFn.delete = http.delete.bind(http)
requestFn.upload = http.upload.bind(http)

// 导出具备双重用法的 request
export const request = requestFn

// 默认导出实例，兼容直接 `request.get/post` 的旧式导入
export default http

// 可选导出实例
export const requestManager = http
