/**
 * 思维导图服务
 */

const request = require('../utils/request.js')
const Logger = require('../utils/logger.js')

class MindmapService {
  constructor() {
    this.apiPrefix = '/api/v1'
  }

  async list(page = 1, pageSize = 20) {
    try {
      const res = await request.get(`${this.apiPrefix}/mindmaps`, { data: { page, pageSize } })
      return res.data?.data?.list || []
    } catch (e) {
      Logger.error('获取思维导图列表失败', e)
      throw e
    }
  }
}

module.exports = new MindmapService()

