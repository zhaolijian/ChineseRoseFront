const AuthManager = require('../../utils/auth.js')
const UserService = require('../../services/user.js')
const Logger = require('../../utils/logger.js')

Page({
  data: {
    loggedIn: false,
    profile: {}
  },

  async onShow() {
    try {
      const app = getApp()
      const loggedIn = app.isLoggedIn()
      this.setData({ loggedIn })
      if (loggedIn) {
        const profile = await UserService.getProfile()
        this.setData({ profile })
      }
    } catch (e) {
      Logger.error('加载我的页失败', e)
    }
  },

  onGoLogin() {
    AuthManager.requireLogin('required', '/pages/mine/mine')
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '退出后将清空本地登录信息，是否继续？',
      confirmText: '退出',
      success: async (res) => {
        if (res.confirm) {
          await AuthManager.logout()
          this.setData({ loggedIn: false, profile: {} })
          wx.showToast({ title: '已退出', icon: 'none' })
        }
      }
    })
  },

  onViewStats() {
    wx.navigateTo({ url: '/pages/export/export' })
  },

  onOpenSettings() {
    wx.showToast({ title: '设置开发中', icon: 'none' })
  }
})
