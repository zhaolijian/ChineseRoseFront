/**
 * 用户服务
 */

const request = require('../utils/request.js')
const Logger = require('../utils/logger.js')

class UserService {
  constructor() {
    this.apiPrefix = '/api/v1'
  }

  async getProfile() {
    try {
      const res = await request.get(`${this.apiPrefix}/users/profile`, { loading: false })
      return res.data?.data || null
    } catch (e) {
      Logger.error('获取用户信息失败', e)
      throw e
    }
  }
}

module.exports = new UserService()

