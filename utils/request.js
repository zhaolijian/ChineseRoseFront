/**
 * 网络请求封装
 * 提供统一的HTTP请求接口，支持拦截器、重试、错误处理等功能
 */

const Logger = require('./logger.js')

/**
 * 请求配置
 */
const CONFIG = {
  baseUrl: '', // 在app.js中动态设置
  timeout: 10000,
  maxRetry: 3,
  retryDelay: 1000,
  // 状态码配置
  successCode: [200, 201, 204],
  // 需要重试的错误码
  retryErrorCodes: ['timeout', 'fail']
}

/**
 * 请求拦截器
 */
const requestInterceptors = []

/**
 * 响应拦截器
 */
const responseInterceptors = []

/**
 * 请求队列（用于token刷新）
 */
let isRefreshing = false
let refreshQueue = []

/**
 * Request类 - 网络请求管理器
 */
class Request {
  constructor(config = {}) {
    this.config = { ...CONFIG, ...config }
    this.baseUrl = this.config.baseUrl || getApp()?.globalData?.config?.baseUrl || ''
  }

  /**
   * 添加请求拦截器
   * @param {Function} fulfilled - 成功回调
   * @param {Function} rejected - 失败回调
   */
  addRequestInterceptor(fulfilled, rejected) {
    requestInterceptors.push({ fulfilled, rejected })
  }

  /**
   * 添加响应拦截器
   * @param {Function} fulfilled - 成功回调
   * @param {Function} rejected - 失败回调
   */
  addResponseInterceptor(fulfilled, rejected) {
    responseInterceptors.push({ fulfilled, rejected })
  }

  /**
   * 处理请求拦截器
   * @param {Object} config - 请求配置
   * @returns {Object} 处理后的配置
   */
  async runRequestInterceptors(config) {
    let processedConfig = config

    for (const interceptor of requestInterceptors) {
      try {
        if (interceptor.fulfilled) {
          processedConfig = await interceptor.fulfilled(processedConfig)
        }
      } catch (error) {
        if (interceptor.rejected) {
          return await interceptor.rejected(error)
        }
        throw error
      }
    }

    return processedConfig
  }

  /**
   * 处理响应拦截器
   * @param {Object} response - 响应数据
   * @returns {Object} 处理后的响应
   */
  async runResponseInterceptors(response) {
    let processedResponse = response

    for (const interceptor of responseInterceptors) {
      try {
        if (interceptor.fulfilled) {
          processedResponse = await interceptor.fulfilled(processedResponse)
        }
      } catch (error) {
        if (interceptor.rejected) {
          return await interceptor.rejected(error)
        }
        throw error
      }
    }

    return processedResponse
  }

  /**
   * 构建完整URL
   * @param {string} url - 请求路径
   * @returns {string} 完整URL
   */
  buildUrl(url) {
    if (url.startsWith('http')) {
      return url
    }
    return `${this.baseUrl}${url.startsWith('/') ? url : '/' + url}`
  }

  /**
   * 获取请求头
   * @returns {Object} 请求头对象
   */
  getHeaders() {
    const app = getApp()
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }

    // 添加认证token
    const token = app?.getToken?.()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    // 添加设备信息
    const systemInfo = app?.getSystemInfo?.()
    if (systemInfo) {
      headers['X-Device-Info'] = JSON.stringify({
        platform: systemInfo.platform,
        version: systemInfo.version,
        model: systemInfo.model
      })
    }

    return headers
  }

  /**
   * 核心请求方法
   * @param {Object} options - 请求选项
   * @returns {Promise} 请求Promise
   */
  async request(options) {
    // 构建请求配置
    let config = {
      url: this.buildUrl(options.url),
      method: (options.method || 'GET').toUpperCase(),
      data: options.data || {},
      header: {
        ...this.getHeaders(),
        ...options.header
      },
      timeout: options.timeout || this.config.timeout,
      dataType: options.dataType || 'json',
      responseType: options.responseType || 'text'
    }

    // 执行请求拦截器
    config = await this.runRequestInterceptors(config)

    Logger.info('发起网络请求', {
      url: config.url,
      method: config.method,
      data: config.data
    })

    return this.executeRequest(config, 0)
  }

  /**
   * 执行请求（含重试逻辑）
   * @param {Object} config - 请求配置
   * @param {number} retryCount - 重试次数
   * @returns {Promise} 请求结果
   */
  async executeRequest(config, retryCount = 0) {
    return new Promise((resolve, reject) => {
      wx.request({
        ...config,
        success: async(res) => {
          try {
            Logger.info('网络请求成功', {
              url: config.url,
              statusCode: res.statusCode,
              data: res.data
            })

            // 检查HTTP状态码
            if (!this.config.successCode.includes(res.statusCode)) {
              const httpError = new Error(`HTTP Error: ${res.statusCode}`)
              // 附加关键信息，便于后续拦截判断（如401）
              httpError.code = res.statusCode
              httpError.status = res.statusCode
              httpError.response = {
                status: res.statusCode,
                data: res.data,
                headers: res.header,
                config
              }
              throw httpError
            }

            // 构建响应对象
            const response = {
              data: res.data,
              status: res.statusCode,
              statusText: this.getStatusText(res.statusCode),
              headers: res.header,
              config,
              request: res
            }

            // 执行响应拦截器
            const processedResponse = await this.runResponseInterceptors(response)

            // 检查业务状态码
            await this.checkBusinessCode(processedResponse)

            resolve(processedResponse)
          } catch (error) {
            // 401 未授权：直接触发登录引导，不做刷新重试
            const status = error?.response?.status || error?.status || error?.code
            if (status === 401) {
              Logger.warn('认证失败或已过期，重定向到登录')
              this.handleAuthError()
            }
            reject(error)
          }
        },
        fail: async(error) => {
          Logger.error('网络请求失败', {
            url: config.url,
            error
          })

          // 判断是否需要重试
          if (this.shouldRetry(error, retryCount)) {
            Logger.info(`网络请求重试 ${retryCount + 1}/${this.config.maxRetry}`, {
              url: config.url
            })

            // 延时重试
            setTimeout(() => {
              this.executeRequest(config, retryCount + 1)
                .then(resolve)
                .catch(reject)
            }, this.config.retryDelay * (retryCount + 1))
          } else {
            const requestError = new Error(error.errMsg || '网络请求失败')
            requestError.config = config
            requestError.code = error.errno
            reject(requestError)
          }
        }
      })
    })
  }

  /**
   * 检查业务状态码
   * @param {Object} response - 响应对象
   * @throws {Error} 业务逻辑错误
   */
  async checkBusinessCode(response) {
    const { data } = response

    // 标准响应格式：{ code, message, data }
    if (data && typeof data === 'object' && 'code' in data) {
      if (data.code !== 0 && data.code !== 200) {
        const error = new Error(data.message || '请求失败')
        error.code = data.code
        error.response = response
        throw error
      }
    }
  }

  /**
   * 判断是否为token过期错误
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否为token过期
   */
  isTokenExpired(error) {
    return (
      error?.code === 401 ||
      (error?.response && error.response.status === 401)
    )
  }

  /**
   * 处理token刷新
   * @returns {Promise} 刷新Promise
   */
  async handleTokenRefresh() {
    // 后端未提供刷新token接口，直接拒绝，触发登录
    return Promise.reject(new Error('TOKEN_REFRESH_UNSUPPORTED'))
  }

  /**
   * 处理认证错误
   */
  handleAuthError() {
    const app = getApp()
    if (app?.clearUserAuth) {
      app.clearUserAuth()
    }

    // 跳转登录页
    wx.navigateTo({
      url: '/pages/login/login?scene=expire'
    })
  }

  /**
   * 判断是否需要重试
   * @param {Object} error - 错误对象
   * @param {number} retryCount - 当前重试次数
   * @returns {boolean} 是否需要重试
   */
  shouldRetry(error, retryCount) {
    if (retryCount >= this.config.maxRetry) {
      return false
    }

    // 检查错误类型
    const errorCode = error.errMsg || error.errno
    return this.config.retryErrorCodes.some(code =>
      String(errorCode).includes(code)
    )
  }

  /**
   * 获取状态文本
   * @param {number} status - HTTP状态码
   * @returns {string} 状态文本
   */
  getStatusText(status) {
    const statusMap = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error'
    }
    return statusMap[status] || 'Unknown Status'
  }

  /**
   * GET请求
   */
  get(url, config = {}) {
    return this.request({
      ...config,
      url,
      method: 'GET'
    })
  }

  /**
   * POST请求
   */
  post(url, data, config = {}) {
    return this.request({
      ...config,
      url,
      method: 'POST',
      data
    })
  }

  /**
   * PUT请求
   */
  put(url, data, config = {}) {
    return this.request({
      ...config,
      url,
      method: 'PUT',
      data
    })
  }

  /**
   * DELETE请求
   */
  delete(url, config = {}) {
    return this.request({
      ...config,
      url,
      method: 'DELETE'
    })
  }

  /**
   * 上传文件
   */
  upload(url, filePath, config = {}) {
    const headers = this.getHeaders()
    delete headers['Content-Type'] // 上传文件时不设置Content-Type

    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: this.buildUrl(url),
        filePath,
        name: config.name || 'file',
        formData: config.formData || {},
        header: {
          ...headers,
          ...config.header
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            resolve({
              data,
              status: res.statusCode,
              headers: res.header
            })
          } catch (error) {
            resolve({
              data: res.data,
              status: res.statusCode,
              headers: res.header
            })
          }
        },
        fail: reject
      })
    })
  }

  /**
   * 下载文件
   */
  download(url, config = {}) {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: this.buildUrl(url),
        header: {
          ...this.getHeaders(),
          ...config.header
        },
        success: resolve,
        fail: reject
      })
    })
  }
}

// 创建默认实例
const request = new Request()

// 设置默认拦截器
request.addRequestInterceptor(
  (config) => {
    // 请求开始时显示loading
    if (config.loading !== false) {
      wx.showLoading({
        title: config.loadingText || '请求中...',
        mask: true
      })
    }
    return config
  },
  (error) => {
    wx.hideLoading()
    return Promise.reject(error)
  }
)

request.addResponseInterceptor(
  (response) => {
    // 请求完成时隐藏loading
    wx.hideLoading()
    return response
  },
  (error) => {
    wx.hideLoading()

    // 显示错误提示
    if (error.message && !error.config?.silent) {
      wx.showToast({
        title: error.message,
        icon: 'none',
        duration: 2000
      })
    }

    return Promise.reject(error)
  }
)

module.exports = request
