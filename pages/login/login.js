/**
 * 登录页面 - 页面逻辑
 * 处理微信登录、用户授权等功能
 */

const AuthManager = require('../../utils/auth.js')
const Logger = require('../../utils/logger.js')
const Toast = require('@vant/weapp/toast/toast')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: false,
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    // 登录场景
    scene: '', // 来源场景：'' | 'required' | 'expire'
    redirectUrl: '', // 登录后跳转地址
    // UI状态
    showPrivacyModal: false,
    agreePrivacy: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    Logger.info('登录页加载', options)

    this.setData({
      scene: options.scene || '',
      redirectUrl: decodeURIComponent(options.redirect || ''),
      canIUseGetUserProfile: wx.canIUse('getUserProfile')
    })

    // 检查是否已经登录
    this.checkLoginStatus()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 如果用户已经登录，直接跳转
    if (getApp().isLoggedIn()) {
      this.handleLoginSuccess()
    }
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const app = getApp()
    if (app.isLoggedIn()) {
      this.handleLoginSuccess()
    }
  },

  /**
   * 微信登录
   */
  async onWechatLogin() {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      Toast.loading('登录中...')

      // 执行微信登录流程
      const result = await AuthManager.wxLogin()

      if (result.success) {
        // 登录成功
        Toast.success('登录成功')
        this.handleLoginSuccess(result.userInfo)
      } else {
        // 登录失败
        Toast.fail(result.message || '登录失败')
      }
    } catch (error) {
      Logger.error('微信登录失败', error)
      Toast.fail('登录失败，请重试')
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 获取用户信息（旧版API）
   */
  onGetUserInfo(event) {
    if (event.detail.userInfo) {
      this.setData({
        userInfo: event.detail.userInfo,
        hasUserInfo: true
      })

      // 执行登录
      this.performLogin(event.detail)
    } else {
      Toast.fail('需要用户授权才能继续使用')
    }
  },

  /**
   * 获取用户信息（新版API）
   */
  async onGetUserProfile() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.getUserProfile({
          desc: '用于完善用户资料',
          success: resolve,
          fail: reject
        })
      })

      this.setData({
        userInfo: res.userInfo,
        hasUserInfo: true
      })

      // 执行登录
      await this.performLogin(res)
    } catch (error) {
      Logger.error('获取用户信息失败', error)
      if (error.errMsg && error.errMsg.includes('cancel')) {
        Toast('需要用户授权才能继续使用')
      } else {
        Toast.fail('获取用户信息失败')
      }
    }
  },

  /**
   * 执行登录逻辑
   */
  async performLogin(userAuthInfo) {
    try {
      Toast.loading('登录中...')

      // 调用登录服务
      const result = await AuthManager.login(userAuthInfo)

      if (result.success) {
        Toast.success('登录成功')
        this.handleLoginSuccess(result.userInfo)
      } else {
        Toast.fail(result.message || '登录失败')
      }
    } catch (error) {
      Logger.error('执行登录失败', error)
      Toast.fail('登录失败，请重试')
    }
  },

  /**
   * 处理登录成功
   */
  handleLoginSuccess(userInfo) {
    Logger.info('登录成功', { userInfo })

    // 延时跳转，让用户看到成功提示
    setTimeout(() => {
      if (this.data.redirectUrl) {
        // 跳转到指定页面
        wx.redirectTo({
          url: this.data.redirectUrl,
          fail: () => {
            // 跳转失败，回到首页
            wx.switchTab({ url: '/pages/books/index' })
          }
        })
      } else {
        // 回到首页
        wx.switchTab({ url: '/pages/books/index' })
      }
    }, 1500)
  },

  /**
   * 跳过登录（游客模式）
   */
  onSkipLogin() {
    wx.showModal({
      title: '提示',
      content: '跳过登录将无法同步数据到云端，确定要以游客身份继续使用吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 以游客模式继续
          Logger.info('用户选择游客模式')

          // 设置游客标识
          wx.setStorageSync('guestMode', true)

          // 跳转页面
          if (this.data.redirectUrl) {
            wx.redirectTo({
              url: this.data.redirectUrl,
              fail: () => {
                wx.switchTab({ url: '/pages/books/index' })
              }
            })
          } else {
            wx.switchTab({ url: '/pages/books/index' })
          }
        }
      }
    })
  },

  /**
   * 显示隐私协议
   */
  onShowPrivacy() {
    this.setData({ showPrivacyModal: true })
  },

  /**
   * 关闭隐私协议
   */
  onClosePrivacy() {
    this.setData({ showPrivacyModal: false })
  },

  /**
   * 同意隐私协议
   */
  onAgreePrivacy() {
    this.setData({
      agreePrivacy: true,
      showPrivacyModal: false
    })
  },

  /**
   * 查看用户协议
   */
  onViewUserAgreement() {
    wx.navigateTo({
      url: '/pages/webview/webview?url=' + encodeURIComponent('https://your-domain.com/user-agreement.html')
    })
  },

  /**
   * 查看隐私政策
   */
  onViewPrivacyPolicy() {
    wx.navigateTo({
      url: '/pages/webview/webview?url=' + encodeURIComponent('https://your-domain.com/privacy-policy.html')
    })
  },

  /**
   * 联系客服
   */
  onContactService() {
    wx.makePhoneCall({
      phoneNumber: '400-000-0000' // TODO: 配置实际客服电话
    })
  }
})
