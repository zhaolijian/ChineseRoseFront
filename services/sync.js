/**
 * 数据同步服务
 * 负责离线数据的同步处理
 */

const RequestManager = require('../utils/request.js')
const StorageManager = require('../utils/storage.js')
const Logger = require('../utils/logger.js')

class SyncService {
  /**
   * 同步离线数据
   * 将离线状态下的数据操作同步到服务器
   */
  static async syncOfflineData() {
    try {
      // 获取离线数据队列
      const offlineQueue = await StorageManager.get('offline_queue') || []

      if (offlineQueue.length === 0) {
        Logger.info('没有需要同步的离线数据')
        return
      }

      Logger.info(`开始同步 ${offlineQueue.length} 条离线数据`)

      const syncResults = []

      // 依次处理离线数据
      for (const item of offlineQueue) {
        try {
          const result = await this.syncSingleItem(item)
          syncResults.push({ success: true, item, result })
        } catch (error) {
          syncResults.push({ success: false, item, error })
          Logger.error('单项数据同步失败', { item, error })
        }
      }

      // 移除成功同步的数据
      const failedItems = syncResults
        .filter(result => !result.success)
        .map(result => result.item)

      await StorageManager.set('offline_queue', failedItems)

      const successCount = syncResults.filter(result => result.success).length
      Logger.info(`数据同步完成: ${successCount}/${offlineQueue.length}`)

      return {
        total: offlineQueue.length,
        success: successCount,
        failed: offlineQueue.length - successCount
      }
    } catch (error) {
      Logger.error('离线数据同步失败', error)
      throw error
    }
  }

  /**
   * 同步单条数据
   * @param {Object} item 离线数据项
   */
  static async syncSingleItem(item) {
    const { type, action, data } = item

    switch (type) {
    case 'book':
      return await this.syncBookData(action, data)
    case 'note':
      return await this.syncNoteData(action, data)
    case 'mindmap':
      return await this.syncMindmapData(action, data)
    default:
      throw new Error(`不支持的同步数据类型: ${type}`)
    }
  }

  /**
   * 同步书籍数据
   */
  static async syncBookData(action, data) {
    switch (action) {
    case 'create':
      return await RequestManager.post('/api/v1/books', data)
    case 'update':
      return await RequestManager.put(`/api/v1/books/${data.id}`, data)
    case 'delete':
      return await RequestManager.delete(`/api/v1/books/${data.id}`)
    default:
      throw new Error(`不支持的书籍操作: ${action}`)
    }
  }

  /**
   * 同步笔记数据
   */
  static async syncNoteData(action, data) {
    switch (action) {
    case 'create':
      return await RequestManager.post('/api/v1/notes', data)
    case 'update':
      return await RequestManager.put(`/api/v1/notes/${data.id}`, data)
    case 'delete':
      return await RequestManager.delete(`/api/v1/notes/${data.id}`)
    default:
      throw new Error(`不支持的笔记操作: ${action}`)
    }
  }

  /**
   * 同步思维导图数据
   */
  static async syncMindmapData(action, data) {
    switch (action) {
    case 'create':
      return await RequestManager.post('/api/v1/mindmaps', data)
    case 'update':
      return await RequestManager.put(`/api/v1/mindmaps/${data.id}`, data)
    case 'delete':
      return await RequestManager.delete(`/api/v1/mindmaps/${data.id}`)
    default:
      throw new Error(`不支持的思维导图操作: ${action}`)
    }
  }

  /**
   * 添加离线数据到队列
   * @param {string} type 数据类型
   * @param {string} action 操作类型
   * @param {Object} data 数据内容
   */
  static async addOfflineData(type, action, data) {
    try {
      const queue = await StorageManager.get('offline_queue') || []

      const item = {
        id: Date.now() + Math.random(),
        type,
        action,
        data,
        timestamp: Date.now()
      }

      queue.push(item)
      await StorageManager.set('offline_queue', queue)

      Logger.info('离线数据已添加到队列', item)
    } catch (error) {
      Logger.error('添加离线数据失败', error)
      throw error
    }
  }

  /**
   * 清空离线数据队列
   */
  static async clearOfflineQueue() {
    await StorageManager.remove('offline_queue')
    Logger.info('离线数据队列已清空')
  }
}

module.exports = SyncService
