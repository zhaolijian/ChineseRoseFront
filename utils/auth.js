/**
 * 认证管理工具
 * 处理微信登录、token管理、用户信息等功能
 */

const StorageManager = require('./storage.js')
const Logger = require('./logger.js')

/**
 * AuthManager类 - 认证管理器
 */
class AuthManager {
  constructor() {
    this.loginLock = false // 防止重复登录
  }

  /**
   * 微信登录
   * @returns {Promise<Object>} 登录结果
   */
  async wxLogin() {
    if (this.loginLock) {
      throw new Error('正在登录中，请勿重复操作')
    }

    this.loginLock = true

    try {
      // 1. 获取微信登录码
      const loginResult = await this.getWxLoginCode()
      Logger.info('获取微信登录码成功', { code: loginResult.code })

      // 2. 向后端发送登录请求
      const loginData = await this.sendLoginRequest({
        code: loginResult.code,
        platform: 'miniprogram'
      })

      // 3. 保存认证信息
      await this.saveAuthData(loginData)

      // 4. 更新应用全局状态
      this.updateAppUserInfo(loginData)

      Logger.info('微信登录成功', {
        userId: loginData.user?.id,
        token: loginData.token ? '已获取' : '未获取'
      })

      return {
        success: true,
        userInfo: loginData.user,
        token: loginData.token
      }
    } catch (error) {
      Logger.error('微信登录失败', error)
      return {
        success: false,
        message: error.message || '登录失败'
      }
    } finally {
      this.loginLock = false
    }
  }

  /**
   * 完整登录流程（包含用户信息授权）
   * @param {Object} userAuthInfo - 用户授权信息
   * @returns {Promise<Object>} 登录结果
   */
  async login(userAuthInfo) {
    try {
      // 1. 获取微信登录码
      const loginResult = await this.getWxLoginCode()

      // 2. 构建登录请求数据
      const loginData = {
        code: loginResult.code,
        platform: 'miniprogram',
        userInfo: userAuthInfo.userInfo,
        rawData: userAuthInfo.rawData,
        signature: userAuthInfo.signature,
        encryptedData: userAuthInfo.encryptedData,
        iv: userAuthInfo.iv
      }

      // 3. 发送登录请求
      const result = await this.sendLoginRequest(loginData)

      // 4. 保存认证信息
      await this.saveAuthData(result)

      // 5. 更新应用状态
      this.updateAppUserInfo(result)

      return {
        success: true,
        userInfo: result.user,
        token: result.token
      }
    } catch (error) {
      Logger.error('用户登录失败', error)
      throw error
    }
  }

  /**
   * 获取微信登录码
   * @returns {Promise<Object>} 登录码结果
   */
  async getWxLoginCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: (error) => {
          reject(new Error(`获取登录码失败: ${error.errMsg}`))
        }
      })
    })
  }

  /**
   * 向后端发送登录请求
   * @param {Object} data - 登录数据
   * @returns {Promise<Object>} 服务器响应
   */
  async sendLoginRequest(data) {
    const request = require('./request.js')

    try {
      const response = await request.post('/api/v1/auth/login', data, {
        loading: false,
        silent: true
      })

      if (response.data && (response.data.code === 0 || response.data.code === 200)) {
        // 兼容后端响应：data = { token, user }
        return response.data.data
      } else {
        throw new Error(response.data?.message || '登录请求失败')
      }
    } catch (error) {
      if (error.code === 'ENOTFOUND' || (error.message && error.message.includes('网络'))) {
        throw new Error('网络连接失败，请检查网络设置')
      }
      throw error
    }
  }

  /**
   * 保存认证数据到本地存储
   * @param {Object} data - 认证数据
   */
  async saveAuthData(data) {
    const tasks = []

    if (data.token) {
      tasks.push(StorageManager.set('token', data.token))
    }

    if (data.user) {
      tasks.push(StorageManager.set('userInfo', data.user))
    }

    if (data.refreshToken) {
      tasks.push(StorageManager.set('refreshToken', data.refreshToken))
    }

    // 保存登录时间
    tasks.push(StorageManager.set('loginTime', Date.now()))

    await Promise.all(tasks)
  }

  /**
   * 更新应用全局用户信息
   * @param {Object} data - 用户数据
   */
  updateAppUserInfo(data) {
    const app = getApp()
    if (app && app.setUserInfo) {
      app.setUserInfo(data.user, data.token)
    }
  }

  /**
   * 验证Token有效性
   * @param {string} token - 要验证的token
   * @returns {Promise<boolean>} 是否有效
   */
  async validateToken(token) {
    if (!token) {
      return false
    }

    try {
      // 直接访问受保护接口，成功即视为有效
      const request = require('./request.js')
      const response = await request.get('/api/v1/users/profile', {
        header: {
          Authorization: `Bearer ${token}`
        },
        loading: false,
        silent: true
      })

      return response?.status === 200
    } catch (error) {
      Logger.error('Token验证失败', error)
      return false
    }
  }

  /**
   * 刷新Token
   * @returns {Promise<string>} 新的token
   */
  async refreshToken() {
    // 当前后端不支持刷新token
    throw new Error('TOKEN_REFRESH_UNSUPPORTED')
  }

  /**
   * 退出登录
   * @returns {Promise<void>}
   */
  async logout() {
    // 当前后端未提供登出接口，直接清理本地态
    await this.clearAuthData()

    const app = getApp()
    if (app && app.clearUserAuth) {
      app.clearUserAuth()
    }
    Logger.info('用户退出登录（本地）')
  }

  /**
   * 清除认证数据
   * @returns {Promise<void>}
   */
  async clearAuthData() {
    await Promise.all([
      StorageManager.remove('token'),
      StorageManager.remove('userInfo'),
      StorageManager.remove('refreshToken'),
      StorageManager.remove('loginTime')
    ])
  }

  /**
   * 检查登录状态
   * @returns {Promise<boolean>} 是否已登录
   */
  async checkLoginStatus() {
    try {
      const [token, userInfo] = await Promise.all([
        StorageManager.get('token'),
        StorageManager.get('userInfo')
      ])

      if (!token || !userInfo) {
        return false
      }

      // 验证token
      const isValid = await this.validateToken(token)
      if (!isValid) {
        await this.clearAuthData()
        return false
      }

      return true
    } catch (error) {
      Logger.error('检查登录状态失败', error)
      return false
    }
  }

  /**
   * 获取用户信息
   * @returns {Promise<Object|null>} 用户信息
   */
  async getUserInfo() {
    try {
      return await StorageManager.get('userInfo')
    } catch (error) {
      Logger.error('获取用户信息失败', error)
      return null
    }
  }

  /**
   * 获取Token
   * @returns {Promise<string|null>} 认证token
   */
  async getToken() {
    try {
      return await StorageManager.get('token')
    } catch (error) {
      Logger.error('获取Token失败', error)
      return null
    }
  }

  /**
   * 更新用户信息
   * @param {Object} userInfo - 新的用户信息
   * @returns {Promise<void>}
   */
  async updateUserInfo(userInfo) {
    try {
      await StorageManager.set('userInfo', userInfo)

      // 更新应用状态
      const app = getApp()
      if (app && app.setUserInfo) {
        const token = await this.getToken()
        app.setUserInfo(userInfo, token)
      }

      Logger.info('用户信息更新成功')
    } catch (error) {
      Logger.error('更新用户信息失败', error)
      throw error
    }
  }

  /**
   * 检查是否需要更新用户信息
   * @returns {Promise<boolean>} 是否需要更新
   */
  async shouldUpdateUserInfo() {
    try {
      const loginTime = await StorageManager.get('loginTime')
      if (!loginTime) {
        return true
      }

      // 7天更新一次用户信息
      const updateInterval = 7 * 24 * 60 * 60 * 1000
      return Date.now() - loginTime > updateInterval
    } catch (error) {
      return false
    }
  }

  /**
   * 获取登录跳转URL
   * @param {string} scene - 登录场景
   * @param {string} redirect - 登录后跳转地址
   * @returns {string} 登录页面URL
   */
  getLoginUrl(scene = '', redirect = '') {
    const qs = []
    if (scene) qs.push(`scene=${encodeURIComponent(scene)}`)
    if (redirect) qs.push(`redirect=${encodeURIComponent(redirect)}`)
    return `/pages/login/login${qs.length ? '?' + qs.join('&') : ''}`
  }

  /**
   * 需要登录时的处理
   * @param {string} scene - 登录场景
   * @param {string} redirect - 登录后跳转地址
   */
  requireLogin(scene = 'required', redirect = '') {
    const url = this.getLoginUrl(scene, redirect)

    wx.navigateTo({
      url,
      fail: () => {
        // 如果当前页面栈满了，使用重定向
        wx.redirectTo({ url })
      }
    })
  }
}

// 创建单例
const authManager = new AuthManager()

module.exports = authManager
