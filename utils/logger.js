/**
 * 日志工具
 * 提供统一的日志记录接口，支持不同级别、本地存储、远程上报等功能
 */

/* eslint-disable no-console */

const StorageManager = require('./storage.js')

/**
 * 日志级别枚举
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

/**
 * 日志配置
 */
const CONFIG = {
  // 当前日志级别
  level: LOG_LEVELS.INFO,
  // 是否启用控制台输出
  enableConsole: true,
  // 是否启用本地存储
  enableStorage: true,
  // 是否启用远程上报
  enableRemote: false,
  // 本地日志最大条数
  maxLocalLogs: 1000,
  // 日志保留天数
  retentionDays: 7,
  // 远程上报地址
  remoteUrl: '/api/logs',
  // 批量上报大小
  batchSize: 50
}

/**
 * Logger类 - 日志管理器
 */
class Logger {
  constructor() {
    this.config = CONFIG
    this.logQueue = [] // 待上报日志队列
    this.uploadTimer = null

    // 根据环境调整配置
    this.adjustConfigByEnvironment()

    // 启动定时任务
    this.startBackgroundTasks()
  }

  /**
   * 根据环境调整配置
   */
  adjustConfigByEnvironment() {
    const app = getApp()
    const isDebug = app?.globalData?.config?.debug

    if (isDebug) {
      this.config.level = LOG_LEVELS.DEBUG
      this.config.enableConsole = true
    } else {
      this.config.level = LOG_LEVELS.INFO
      this.config.enableConsole = false
      this.config.enableRemote = true
    }
  }

  /**
   * 启动后台任务
   */
  startBackgroundTasks() {
    // 定期清理过期日志
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredLogs()
    }, 60 * 60 * 1000) // 每小时执行一次

    // 定期上报日志
    if (this.config.enableRemote) {
      this.uploadTimer = setInterval(() => {
        this.uploadLogs()
      }, 5 * 60 * 1000) // 每5分钟上报一次
    }
  }

  /**
   * 获取日志级别名称
   * @param {number} level - 日志级别
   * @returns {string} 级别名称
   */
  getLevelName(level) {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR']
    return levelNames[level] || 'UNKNOWN'
  }

  /**
   * 格式化日志消息
   * @param {number} level - 日志级别
   * @param {string} message - 日志消息
   * @param {any} data - 附加数据
   * @param {string} category - 日志分类
   * @returns {Object} 格式化后的日志对象
   */
  formatLog(level, message, data, category = 'APP') {
    const now = new Date()
    const timestamp = now.getTime()
    const timeString = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })

    return {
      timestamp,
      timeString,
      level,
      levelName: this.getLevelName(level),
      category,
      message,
      data: data ? this.safeStringify(data) : null,
      // 环境信息
      env: this.getEnvironmentInfo(),
      // 页面信息
      page: this.getCurrentPageInfo(),
      // 用户信息（不包含敏感数据）
      user: this.getSafeUserInfo()
    }
  }

  /**
   * 安全的JSON序列化
   * @param {any} obj - 要序列化的对象
   * @returns {string} JSON字符串
   */
  safeStringify(obj) {
    try {
      return JSON.stringify(obj, null, 2)
    } catch (error) {
      return String(obj)
    }
  }

  /**
   * 获取环境信息
   * @returns {Object} 环境信息
   */
  getEnvironmentInfo() {
    try {
      const app = getApp()
      const systemInfo = app?.getSystemInfo?.() || {}

      return {
        platform: systemInfo.platform,
        system: systemInfo.system,
        version: systemInfo.version,
        SDKVersion: systemInfo.SDKVersion,
        model: systemInfo.model,
        brand: systemInfo.brand,
        networkType: app?.globalData?.networkType
      }
    } catch (error) {
      return {}
    }
  }

  /**
   * 获取当前页面信息
   * @returns {Object} 页面信息
   */
  getCurrentPageInfo() {
    try {
      const pages = getCurrentPages()
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        return {
          route: currentPage.route,
          options: currentPage.options
        }
      }
    } catch (error) {
      // 忽略获取页面信息失败
    }
    return null
  }

  /**
   * 获取安全的用户信息
   * @returns {Object} 用户信息（脱敏）
   */
  getSafeUserInfo() {
    try {
      const app = getApp()
      const userInfo = app?.getUserInfo?.()

      if (userInfo) {
        return {
          id: userInfo.id,
          nickName: userInfo.nickName ? '***' : null // 脱敏处理
        }
      }
    } catch (error) {
      // 忽略获取用户信息失败
    }
    return null
  }

  /**
   * 核心日志记录方法
   * @param {number} level - 日志级别
   * @param {string} message - 日志消息
   * @param {any} data - 附加数据
   * @param {string} category - 日志分类
   */
  log(level, message, data, category) {
    // 检查日志级别
    if (level < this.config.level) {
      return
    }

    // 格式化日志
    const logEntry = this.formatLog(level, message, data, category)

    // 控制台输出
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry)
    }

    // 本地存储
    if (this.config.enableStorage) {
      this.saveToLocal(logEntry)
    }

    // 添加到上报队列
    if (this.config.enableRemote && level >= LOG_LEVELS.WARN) {
      this.addToUploadQueue(logEntry)
    }
  }

  /**
   * 控制台输出
   * @param {Object} logEntry - 日志条目
   */
  outputToConsole(logEntry) {
    const { levelName, timeString, category, message, data } = logEntry
    const prefix = `[${timeString}] [${levelName}] [${category}]`

    // TODO: 存在15个代码质量警告（主要是console.log使用）- 记录在CLAUDE.md前端技术债务 2025-09-05 [项目:chinese-rose-front]
    switch (logEntry.level) {
    case LOG_LEVELS.DEBUG:
      console.log(`${prefix} ${message}`, data || '')
      break
    case LOG_LEVELS.INFO:
      console.info(`${prefix} ${message}`, data || '')
      break
    case LOG_LEVELS.WARN:
      console.warn(`${prefix} ${message}`, data || '')
      break
    case LOG_LEVELS.ERROR:
      console.error(`${prefix} ${message}`, data || '')
      break
    }
  }

  /**
   * 保存到本地存储
   * @param {Object} logEntry - 日志条目
   */
  async saveToLocal(logEntry) {
    try {
      // 获取现有日志
      const existingLogs = await StorageManager.get('local_logs', [])

      // 添加新日志
      existingLogs.push(logEntry)

      // 限制日志数量
      if (existingLogs.length > this.config.maxLocalLogs) {
        existingLogs.splice(0, existingLogs.length - this.config.maxLocalLogs)
      }

      // 保存回存储
      await StorageManager.set('local_logs', existingLogs, {
        expire: this.config.retentionDays * 24 * 60 * 60 * 1000
      })
    } catch (error) {
      console.error('保存日志到本地失败:', error)
    }
  }

  /**
   * 添加到上报队列
   * @param {Object} logEntry - 日志条目
   */
  addToUploadQueue(logEntry) {
    this.logQueue.push(logEntry)

    // 如果队列满了，立即上报
    if (this.logQueue.length >= this.config.batchSize) {
      this.uploadLogs()
    }
  }

  /**
   * 上报日志到服务器
   */
  async uploadLogs() {
    if (this.logQueue.length === 0) {
      return
    }

    const logs = this.logQueue.splice(0, this.config.batchSize)

    try {
      const request = require('./request.js')

      await request.post(this.config.remoteUrl, {
        logs,
        device: this.getEnvironmentInfo(),
        timestamp: Date.now()
      }, {
        loading: false,
        silent: true
      })

      console.info(`日志上报成功，上报${logs.length}条`)
    } catch (error) {
      // 上报失败，将日志放回队列
      this.logQueue.unshift(...logs)
      console.error('日志上报失败:', error)
    }
  }

  /**
   * 清理过期日志
   */
  async cleanupExpiredLogs() {
    try {
      const logs = await StorageManager.get('local_logs', [])
      const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000)

      const validLogs = logs.filter(log => log.timestamp > cutoffTime)

      if (validLogs.length !== logs.length) {
        await StorageManager.set('local_logs', validLogs)
        console.info(`清理过期日志完成，删除${logs.length - validLogs.length}条`)
      }
    } catch (error) {
      console.error('清理过期日志失败:', error)
    }
  }

  /**
   * 获取本地日志
   * @param {Object} options - 选项
   * @param {number} options.level - 最小日志级别
   * @param {string} options.category - 日志分类
   * @param {number} options.limit - 限制条数
   * @returns {Promise<Array>} 日志数组
   */
  async getLocalLogs(options = {}) {
    try {
      let logs = await StorageManager.get('local_logs', [])

      // 按级别筛选
      if (options.level !== undefined) {
        logs = logs.filter(log => log.level >= options.level)
      }

      // 按分类筛选
      if (options.category) {
        logs = logs.filter(log => log.category === options.category)
      }

      // 排序（最新的在前面）
      logs.sort((a, b) => b.timestamp - a.timestamp)

      // 限制条数
      if (options.limit) {
        logs = logs.slice(0, options.limit)
      }

      return logs
    } catch (error) {
      console.error('获取本地日志失败:', error)
      return []
    }
  }

  /**
   * 清空本地日志
   */
  async clearLocalLogs() {
    try {
      await StorageManager.remove('local_logs')
      console.info('本地日志清空完成')
    } catch (error) {
      console.error('清空本地日志失败:', error)
    }
  }

  /**
   * 导出日志
   * @returns {Promise<string>} 日志文本
   */
  async exportLogs() {
    try {
      const logs = await this.getLocalLogs()

      let logText = '阅记小程序日志导出\n'
      logText += `导出时间: ${new Date().toLocaleString()}\n`
      logText += `总条数: ${logs.length}\n`
      logText += '=' * 50 + '\n\n'

      logs.forEach(log => {
        logText += `[${log.timeString}] [${log.levelName}] [${log.category}]\n`
        logText += `消息: ${log.message}\n`
        if (log.data) {
          logText += `数据: ${log.data}\n`
        }
        if (log.page) {
          logText += `页面: ${log.page.route}\n`
        }
        logText += '-'.repeat(30) + '\n'
      })

      return logText
    } catch (error) {
      console.error('导出日志失败:', error)
      return '导出日志失败'
    }
  }

  // 便捷方法
  debug(message, data, category) {
    this.log(LOG_LEVELS.DEBUG, message, data, category)
  }

  info(message, data, category) {
    this.log(LOG_LEVELS.INFO, message, data, category)
  }

  warn(message, data, category) {
    this.log(LOG_LEVELS.WARN, message, data, category)
  }

  error(message, data, category) {
    this.log(LOG_LEVELS.ERROR, message, data, category)
  }

  /**
   * 销毁日志器
   */
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    if (this.uploadTimer) {
      clearInterval(this.uploadTimer)
    }

    // 上报剩余日志
    if (this.config.enableRemote && this.logQueue.length > 0) {
      this.uploadLogs()
    }
  }
}

// 创建单例
const logger = new Logger()

module.exports = logger
