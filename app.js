/**
 * 阅记小程序 - 应用入口文件
 * 提供全局生命周期管理、用户认证、数据初始化等功能
 */

const AuthManager = require('./utils/auth.js')
const StorageManager = require('./utils/storage.js')
const Logger = require('./utils/logger.js')

App({
  /**
   * 全局数据
   */
  globalData: {
    userInfo: null,
    token: null,
    systemInfo: {},
    networkType: 'unknown',
    isOnline: true,
    // 应用配置
    config: {
      baseUrl: 'http://localhost:8080', // 开发环境后端地址
      version: '1.0.0',
      debug: true // 生产环境设为 false
    }
  },

  /**
   * 小程序初始化完成
   * 初始化系统信息、网络状态监听、用户认证等
   */
  onLaunch(options) {
    Logger.info('小程序启动', { options })
    
    // 初始化系统信息
    this.initSystemInfo()
    
    // 初始化网络状态监听
    this.initNetworkListener()
    
    // 检查用户登录状态
    this.checkUserAuth()
    
    // 检查小程序更新
    this.checkForUpdates()
  },

  /**
   * 小程序显示
   */
  onShow(options) {
    Logger.info('小程序显示', { options })
    
    // 更新网络状态
    this.updateNetworkStatus()
    
    // 同步离线数据
    this.syncOfflineData()
  },

  /**
   * 小程序隐藏
   */
  onHide() {
    Logger.info('小程序隐藏')
    
    // 保存关键数据
    this.saveAppState()
  },

  /**
   * 错误监听
   */
  onError(msg) {
    Logger.error('小程序错误', { error: msg })
    
    // 错误上报
    this.reportError(msg)
  },

  /**
   * 页面不存在监听
   */
  onPageNotFound(res) {
    Logger.warn('页面不存在', res)
    
    // 重定向到首页
    wx.reLaunch({
      url: '/pages/books/index'
    })
  },

  /**
   * 初始化系统信息
   */
  initSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      this.globalData.systemInfo = systemInfo
      
      Logger.info('系统信息初始化成功', systemInfo)
    } catch (e) {
      Logger.error('获取系统信息失败', e)
    }
  },

  /**
   * 初始化网络状态监听
   */
  initNetworkListener() {
    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      this.globalData.networkType = res.networkType
      this.globalData.isOnline = res.isConnected
      
      Logger.info('网络状态变化', res)
      
      if (res.isConnected) {
        // 网络恢复时同步数据
        this.syncOfflineData()
      }
    })
    
    // 获取当前网络状态
    wx.getNetworkType({
      success: (res) => {
        this.globalData.networkType = res.networkType
        this.globalData.isOnline = res.networkType !== 'none'
      }
    })
  },

  /**
   * 检查用户认证状态
   */
  async checkUserAuth() {
    try {
      const token = await StorageManager.get('token')
      const userInfo = await StorageManager.get('userInfo')
      
      if (token && userInfo) {
        this.globalData.token = token
        this.globalData.userInfo = userInfo
        
        // 验证 token 有效性
        const isValid = await AuthManager.validateToken(token)
        if (!isValid) {
          // token 失效，清除登录状态
          await this.clearUserAuth()
        }
      }
    } catch (e) {
      Logger.error('检查用户认证状态失败', e)
      await this.clearUserAuth()
    }
  },

  /**
   * 清除用户认证信息
   */
  async clearUserAuth() {
    this.globalData.token = null
    this.globalData.userInfo = null
    await StorageManager.remove('token')
    await StorageManager.remove('userInfo')
  },

  /**
   * 检查小程序更新
   */
  checkForUpdates() {
    if (!wx.canIUse('getUpdateManager')) {
      return
    }
    
    const updateManager = wx.getUpdateManager()
    
    // 检查更新
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        Logger.info('发现新版本')
      }
    })
    
    // 下载完成
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    })
    
    // 更新失败
    updateManager.onUpdateFailed(() => {
      Logger.error('新版本下载失败')
    })
  },

  /**
   * 更新网络状态
   */
  updateNetworkStatus() {
    wx.getNetworkType({
      success: (res) => {
        this.globalData.networkType = res.networkType
        this.globalData.isOnline = res.networkType !== 'none'
      }
    })
  },

  /**
   * 同步离线数据
   */
  async syncOfflineData() {
    if (!this.globalData.isOnline) {
      return
    }
    
    try {
      const SyncService = require('./services/sync.js')
      await SyncService.syncOfflineData()
      Logger.info('离线数据同步完成')
    } catch (e) {
      Logger.error('离线数据同步失败', e)
    }
  },

  /**
   * 保存应用状态
   */
  async saveAppState() {
    try {
      await StorageManager.set('lastActiveTime', Date.now())
      Logger.info('应用状态保存完成')
    } catch (e) {
      Logger.error('保存应用状态失败', e)
    }
  },

  /**
   * 错误上报
   */
  reportError(error) {
    // TODO: 实现错误上报逻辑
    // 可以上报到第三方错误监控平台
    Logger.error('应用错误', { error })
  },

  /**
   * 获取用户信息
   */
  getUserInfo() {
    return this.globalData.userInfo
  },

  /**
   * 获取认证 Token
   */
  getToken() {
    return this.globalData.token
  },

  /**
   * 设置用户信息
   */
  setUserInfo(userInfo, token) {
    this.globalData.userInfo = userInfo
    this.globalData.token = token
    
    // 持久化存储
    StorageManager.set('userInfo', userInfo)
    StorageManager.set('token', token)
  },

  /**
   * 检查是否已登录
   */
  isLoggedIn() {
    return !!(this.globalData.token && this.globalData.userInfo)
  },

  /**
   * 获取系统信息
   */
  getSystemInfo() {
    return this.globalData.systemInfo
  },

  /**
   * 检查网络状态
   */
  isOnline() {
    return this.globalData.isOnline
  }
})