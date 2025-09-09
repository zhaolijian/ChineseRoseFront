/**
 * 存储管理工具
 * 提供统一的本地存储接口，支持加密、过期时间、类型转换等功能
 */

const Logger = require('./logger.js')

/**
 * 存储配置
 */
const CONFIG = {
  // 存储前缀
  prefix: 'chinese_rose_',
  // 默认过期时间（毫秒）
  defaultExpire: 30 * 24 * 60 * 60 * 1000, // 30天
  // 加密密钥（生产环境应该动态生成）
  encryptKey: 'chinese_rose_encrypt_key_2024',
  // 需要加密的key列表
  encryptKeys: ['token', 'refreshToken', 'userInfo', 'sensitiveData']
}

/**
 * StorageManager类 - 存储管理器
 */
class StorageManager {
  constructor() {
    this.config = CONFIG
  }

  /**
   * 生成存储key
   * @param {string} key - 原始key
   * @returns {string} 带前缀的key
   */
  generateKey(key) {
    return `${this.config.prefix}${key}`
  }

  /**
   * 检查是否需要加密
   * @param {string} key - 存储key
   * @returns {boolean} 是否需要加密
   */
  shouldEncrypt(key) {
    return this.config.encryptKeys.includes(key)
  }

  /**
   * 简单加密（生产环境建议使用更安全的加密算法）
   * @param {string} data - 要加密的数据
   * @returns {string} 加密后的数据
   */
  encrypt(data) {
    try {
      // 简单的Base64编码（实际项目中应使用AES等加密算法）
      const encoded = Buffer.from(data, 'utf8').toString('base64')
      return encoded
    } catch (error) {
      Logger.error('数据加密失败', error)
      return data
    }
  }

  /**
   * 简单解密
   * @param {string} data - 要解密的数据
   * @returns {string} 解密后的数据
   */
  decrypt(data) {
    try {
      const decoded = Buffer.from(data, 'base64').toString('utf8')
      return decoded
    } catch (error) {
      Logger.error('数据解密失败', error)
      return data
    }
  }

  /**
   * 构造存储数据对象
   * @param {any} value - 存储值
   * @param {number} expire - 过期时间（毫秒）
   * @returns {Object} 存储对象
   */
  buildStorageData(value, expire) {
    return {
      value,
      timestamp: Date.now(),
      expire: expire || this.config.defaultExpire,
      type: this.getDataType(value)
    }
  }

  /**
   * 获取数据类型
   * @param {any} value - 数据值
   * @returns {string} 数据类型
   */
  getDataType(value) {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    return typeof value
  }

  /**
   * 类型转换
   * @param {any} value - 存储值
   * @param {string} type - 数据类型
   * @returns {any} 转换后的值
   */
  parseValue(value, type) {
    switch (type) {
    case 'number':
      return Number(value)
    case 'boolean':
      return Boolean(value)
    case 'object':
    case 'array':
      return typeof value === 'string' ? JSON.parse(value) : value
    case 'null':
      return null
    case 'undefined':
      return undefined
    default:
      return value
    }
  }

  /**
   * 设置存储数据
   * @param {string} key - 存储key
   * @param {any} value - 存储值
   * @param {Object} options - 选项
   * @param {number} options.expire - 过期时间（毫秒）
   * @param {boolean} options.encrypt - 是否强制加密
   * @returns {Promise<void>}
   */
  async set(key, value, options = {}) {
    try {
      const storageKey = this.generateKey(key)
      const storageData = this.buildStorageData(value, options.expire)

      let dataToStore = JSON.stringify(storageData)

      // 检查是否需要加密
      if (this.shouldEncrypt(key) || options.encrypt) {
        dataToStore = this.encrypt(dataToStore)
      }

      // 同步存储
      wx.setStorageSync(storageKey, dataToStore)

      Logger.info('数据存储成功', { key, type: storageData.type })
    } catch (error) {
      Logger.error('数据存储失败', { key, error })
      throw new Error(`存储失败: ${error.message}`)
    }
  }

  /**
   * 获取存储数据
   * @param {string} key - 存储key
   * @param {any} defaultValue - 默认值
   * @param {Object} options - 选项
   * @param {boolean} options.decrypt - 是否强制解密
   * @returns {Promise<any>} 存储值
   */
  async get(key, defaultValue = null, options = {}) {
    try {
      const storageKey = this.generateKey(key)
      let data = wx.getStorageSync(storageKey)

      if (!data) {
        return defaultValue
      }

      // 检查是否需要解密
      if (this.shouldEncrypt(key) || options.decrypt) {
        data = this.decrypt(data)
      }

      // 解析数据
      let storageData
      try {
        storageData = JSON.parse(data)
      } catch (e) {
        // 如果解析失败，可能是旧版本数据，直接返回
        Logger.warn('存储数据解析失败，返回原始数据', { key })
        return data || defaultValue
      }

      // 检查数据格式
      if (!storageData || typeof storageData !== 'object' || !('value' in storageData)) {
        return defaultValue
      }

      // 检查是否过期
      if (this.isExpired(storageData)) {
        await this.remove(key)
        Logger.info('存储数据已过期', { key })
        return defaultValue
      }

      // 类型转换
      const value = this.parseValue(storageData.value, storageData.type)

      Logger.info('数据获取成功', { key, type: storageData.type })
      return value
    } catch (error) {
      Logger.error('数据获取失败', { key, error })
      return defaultValue
    }
  }

  /**
   * 检查数据是否过期
   * @param {Object} storageData - 存储数据对象
   * @returns {boolean} 是否过期
   */
  isExpired(storageData) {
    if (!storageData.expire || storageData.expire === -1) {
      return false // 永不过期
    }

    return Date.now() - storageData.timestamp > storageData.expire
  }

  /**
   * 移除存储数据
   * @param {string} key - 存储key
   * @returns {Promise<void>}
   */
  async remove(key) {
    try {
      const storageKey = this.generateKey(key)
      wx.removeStorageSync(storageKey)
      Logger.info('数据移除成功', { key })
    } catch (error) {
      Logger.error('数据移除失败', { key, error })
      throw new Error(`移除失败: ${error.message}`)
    }
  }

  /**
   * 清空所有存储数据
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      // 获取所有key
      const { keys } = wx.getStorageInfoSync()

      // 只清除带有项目前缀的key
      const projectKeys = keys.filter(key => key.startsWith(this.config.prefix))

      // 批量删除
      projectKeys.forEach(key => {
        wx.removeStorageSync(key)
      })

      Logger.info(`清空存储数据成功，共删除${projectKeys.length}条记录`)
    } catch (error) {
      Logger.error('清空存储数据失败', error)
      throw new Error(`清空失败: ${error.message}`)
    }
  }

  /**
   * 获取存储信息
   * @returns {Promise<Object>} 存储信息
   */
  async getInfo() {
    try {
      const { keys, currentSize, limitSize } = wx.getStorageInfoSync()

      // 计算项目存储占用
      const projectKeys = keys.filter(key => key.startsWith(this.config.prefix))
      let projectSize = 0

      projectKeys.forEach(key => {
        try {
          const data = wx.getStorageSync(key)
          projectSize += JSON.stringify(data).length
        } catch (e) {
          // 忽略读取失败的数据
        }
      })

      return {
        totalKeys: keys.length,
        projectKeys: projectKeys.length,
        currentSize, // KB
        limitSize, // KB
        projectSize: Math.round(projectSize / 1024), // KB
        usage: Math.round((currentSize / limitSize) * 100) // 百分比
      }
    } catch (error) {
      Logger.error('获取存储信息失败', error)
      return null
    }
  }

  /**
   * 检查存储容量
   * @returns {Promise<boolean>} 是否接近容量上限
   */
  async checkCapacity() {
    try {
      const info = await this.getInfo()
      if (!info) return false

      // 如果使用率超过80%，认为接近上限
      return info.usage > 80
    } catch (error) {
      Logger.error('检查存储容量失败', error)
      return false
    }
  }

  /**
   * 清理过期数据
   * @returns {Promise<number>} 清理的数据条数
   */
  async cleanExpired() {
    try {
      const { keys } = wx.getStorageInfoSync()
      const projectKeys = keys.filter(key => key.startsWith(this.config.prefix))

      let cleanedCount = 0

      for (const storageKey of projectKeys) {
        try {
          let data = wx.getStorageSync(storageKey)

          if (!data) continue

          // 检查是否需要解密
          const key = storageKey.replace(this.config.prefix, '')
          if (this.shouldEncrypt(key)) {
            data = this.decrypt(data)
          }

          const storageData = JSON.parse(data)

          if (this.isExpired(storageData)) {
            wx.removeStorageSync(storageKey)
            cleanedCount++
          }
        } catch (e) {
          // 数据格式错误，直接删除
          wx.removeStorageSync(storageKey)
          cleanedCount++
        }
      }

      Logger.info(`过期数据清理完成，共清理${cleanedCount}条记录`)
      return cleanedCount
    } catch (error) {
      Logger.error('清理过期数据失败', error)
      return 0
    }
  }

  /**
   * 批量设置
   * @param {Object} data - 批量数据对象
   * @param {Object} options - 选项
   * @returns {Promise<void>}
   */
  async batchSet(data, options = {}) {
    const tasks = Object.entries(data).map(([key, value]) =>
      this.set(key, value, options)
    )

    await Promise.all(tasks)
    Logger.info(`批量设置完成，共设置${tasks.length}条记录`)
  }

  /**
   * 批量获取
   * @param {Array<string>} keys - key数组
   * @param {any} defaultValue - 默认值
   * @returns {Promise<Object>} 批量数据对象
   */
  async batchGet(keys, defaultValue = null) {
    const tasks = keys.map(async(key) => {
      const value = await this.get(key, defaultValue)
      return [key, value]
    })

    const results = await Promise.all(tasks)
    const data = Object.fromEntries(results)

    Logger.info(`批量获取完成，共获取${keys.length}条记录`)
    return data
  }

  /**
   * 批量移除
   * @param {Array<string>} keys - key数组
   * @returns {Promise<void>}
   */
  async batchRemove(keys) {
    const tasks = keys.map(key => this.remove(key))

    await Promise.all(tasks)
    Logger.info(`批量移除完成，共移除${keys.length}条记录`)
  }
}

// 创建单例
const storageManager = new StorageManager()

module.exports = storageManager
