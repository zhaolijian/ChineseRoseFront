import type { StorageOptions } from '@/types'
import { STORAGE_PREFIX } from '@/constants'
import { logger } from './logger'
import { createContext } from './logger-helpers'

/**
 * 统一存储管理类
 * 支持加密存储、过期时间等功能
 */
class StorageManager {
  private prefix = STORAGE_PREFIX
  
  /**
   * 设置存储
   */
  async set(key: string, value: any, options: StorageOptions = {}): Promise<void> {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        expires: options.expires ? Date.now() + options.expires * 1000 : null
      }
      
      let finalData = JSON.stringify(data)
      
      // 如果需要加密（简单处理，生产环境建议使用专业加密库）
      if (options.encrypt) {
        finalData = this.encrypt(finalData)
      }
      
      // #ifdef MP-WEIXIN
      return new Promise((resolve, reject) => {
        wx.setStorage({
          key: this.prefix + key,
          data: finalData,
          success: () => resolve(),
          fail: reject
        })
      })
      // #endif
      
      // #ifdef H5
      localStorage.setItem(this.prefix + key, finalData)
      return Promise.resolve()
      // #endif
      
      // #ifdef APP-PLUS
      return new Promise((resolve) => {
        plus.storage.setItem(this.prefix + key, finalData)
        resolve()
      })
      // #endif
      
    } catch (error) {
      const ctx = createContext()
      logger.error(ctx, '[StorageManager.set] 存储设置失败', error)
      throw error
    }
  }

  /**
   * 获取存储
   */
  async get<T = any>(key: string, defaultValue: T | null = null): Promise<T | null> {
    try {
      let rawData: string | null = null
      
      // #ifdef MP-WEIXIN
      rawData = await new Promise((resolve, reject) => {
        wx.getStorage({
          key: this.prefix + key,
          success: (res) => resolve(res.data),
          fail: () => resolve(null)
        })
      })
      // #endif
      
      // #ifdef H5
      rawData = localStorage.getItem(this.prefix + key)
      // #endif
      
      // #ifdef APP-PLUS
      rawData = plus.storage.getItem(this.prefix + key)
      // #endif
      
      if (!rawData) {
        return defaultValue
      }
      
      // 尝试解密
      let decryptedData = rawData
      try {
        decryptedData = this.decrypt(rawData)
      } catch {
        // 如果解密失败，说明数据未加密，使用原数据
      }
      
      const data = JSON.parse(decryptedData)
      
      // 检查是否过期
      if (data.expires && Date.now() > data.expires) {
        await this.remove(key)
        return defaultValue
      }
      
      return data.value
    } catch (error) {
      const ctx = createContext()
      logger.error(ctx, '[StorageManager.get] 存储获取失败', error)
      return defaultValue
    }
  }

  /**
   * 删除存储
   */
  async remove(key: string): Promise<void> {
    try {
      // #ifdef MP-WEIXIN
      return new Promise((resolve, reject) => {
        wx.removeStorage({
          key: this.prefix + key,
          success: () => resolve(),
          fail: reject
        })
      })
      // #endif
      
      // #ifdef H5
      localStorage.removeItem(this.prefix + key)
      return Promise.resolve()
      // #endif
      
      // #ifdef APP-PLUS
      return new Promise((resolve) => {
        plus.storage.removeItem(this.prefix + key)
        resolve()
      })
      // #endif
    } catch (error) {
      const ctx = createContext()
      logger.error(ctx, '[StorageManager.remove] 存储删除失败', error)
      throw error
    }
  }

  /**
   * 清空所有存储
   */
  async clear(): Promise<void> {
    try {
      // #ifdef MP-WEIXIN
      const mpKeys = await new Promise<string[]>((resolve) => {
        wx.getStorageInfo({
          success: (res) => {
            const keys = res.keys.filter(key => key.startsWith(this.prefix))
            resolve(keys)
          },
          fail: () => resolve([])
        })
      })
      
      for (const key of mpKeys) {
        await new Promise<void>((resolve) => {
          wx.removeStorage({
            key,
            success: () => resolve(),
            fail: () => resolve()
          })
        })
      }
      // #endif
      
      // #ifdef H5
      const h5Keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix))
      h5Keys.forEach(key => localStorage.removeItem(key))
      // #endif
      
      // #ifdef APP-PLUS
      const appKeys = plus.storage.getLength()
      for (let i = 0; i < appKeys; i++) {
        const key = plus.storage.key(i)
        if (key && key.startsWith(this.prefix)) {
          plus.storage.removeItem(key)
        }
      }
      // #endif
    } catch (error) {
      const ctx = createContext()
      logger.error(ctx, '[StorageManager.clear] 存储清空失败', error)
      throw error
    }
  }

  /**
   * 获取存储信息
   */
  async getStorageInfo(): Promise<{ keys: string[], currentSize: number, limitSize: number }> {
    try {
      // #ifdef MP-WEIXIN
      return new Promise((resolve, reject) => {
        wx.getStorageInfo({
          success: (res) => {
            const filteredKeys = res.keys.filter(key => key.startsWith(this.prefix))
            resolve({
              keys: filteredKeys,
              currentSize: res.currentSize,
              limitSize: res.limitSize
            })
          },
          fail: reject
        })
      })
      // #endif
      
      // #ifdef H5
      const h5StorageKeys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix))
      // 计算大概大小（字节）
      let currentSize = 0
      h5StorageKeys.forEach(key => {
        const value = localStorage.getItem(key)
        if (value) {
          currentSize += key.length + value.length
        }
      })
      
      return Promise.resolve({
        keys: h5StorageKeys,
        currentSize: Math.ceil(currentSize / 1024), // 转换为KB
        limitSize: 5 * 1024 // H5一般限制5MB
      })
      // #endif
      
      // #ifdef APP-PLUS
      const length = plus.storage.getLength()
      const appStorageKeys: string[] = []
      for (let i = 0; i < length; i++) {
        const key = plus.storage.key(i)
        if (key && key.startsWith(this.prefix)) {
          appStorageKeys.push(key)
        }
      }
      
      return Promise.resolve({
        keys: appStorageKeys,
        currentSize: 0, // App端暂无法准确计算
        limitSize: 50 * 1024 // App端通常限制更大
      })
      // #endif
      
      return Promise.resolve({ keys: [], currentSize: 0, limitSize: 0 })
    } catch (error) {
      const ctx = createContext()
      logger.error(ctx, '[StorageManager.getStorageInfo] 获取存储信息失败', error)
      return { keys: [], currentSize: 0, limitSize: 0 }
    }
  }

  /**
   * 简单加密（仅做基础混淆，非安全加密）
   */
  private encrypt(text: string): string {
    try {
      return btoa(encodeURIComponent(text))
    } catch {
      return text
    }
  }

  /**
   * 简单解密
   */
  private decrypt(text: string): string {
    try {
      return decodeURIComponent(atob(text))
    } catch {
      return text
    }
  }

  /**
   * 大文件存储（使用文件系统）
   */
  async setFile(fileName: string, content: string): Promise<string> {
    // #ifdef MP-WEIXIN
    const fs = wx.getFileSystemManager()
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
    
    return new Promise((resolve, reject) => {
      fs.writeFile({
        filePath,
        data: content,
        encoding: 'utf8',
        success: () => resolve(filePath),
        fail: reject
      })
    })
    // #endif
    
    // #ifdef H5
    // H5端使用IndexedDB存储大文件
    return this.saveToIndexedDB(fileName, content)
    // #endif
    
    // #ifdef APP-PLUS
    // App端使用plus.io存储
    return this.saveToAppStorage(fileName, content)
    // #endif
    
    throw new Error('当前平台不支持文件存储')
  }

  /**
   * 获取大文件
   */
  async getFile(fileName: string): Promise<string | null> {
    // #ifdef MP-WEIXIN
    const fs = wx.getFileSystemManager()
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
    
    return new Promise((resolve) => {
      fs.readFile({
        filePath,
        encoding: 'utf8',
        success: (res) => resolve(res.data as string),
        fail: () => resolve(null)
      })
    })
    // #endif
    
    // #ifdef H5
    return this.getFromIndexedDB(fileName)
    // #endif
    
    // #ifdef APP-PLUS
    return this.getFromAppStorage(fileName)
    // #endif
    
    return null
  }

  // H5端IndexedDB实现（简化版）
  private async saveToIndexedDB(fileName: string, content: string): Promise<string> {
    // 这里应该实现IndexedDB存储逻辑
    // 简化处理，使用localStorage
    const key = `file_${fileName}`
    localStorage.setItem(key, content)
    return Promise.resolve(key)
  }

  private async getFromIndexedDB(fileName: string): Promise<string | null> {
    const key = `file_${fileName}`
    return Promise.resolve(localStorage.getItem(key))
  }

  // App端存储实现
  private async saveToAppStorage(fileName: string, content: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // 这里应该使用plus.io.requestFileSystem
      // 简化处理
      plus.storage.setItem(`file_${fileName}`, content)
      resolve(`file_${fileName}`)
    })
  }

  private async getFromAppStorage(fileName: string): Promise<string | null> {
    return Promise.resolve(plus.storage.getItem(`file_${fileName}`))
  }
}

// 创建存储实例
export const storage = new StorageManager()

// 导出简化的存储函数供store使用
export const getStorage = <T = any>(key: string, defaultValue: T | null = null): Promise<T | null> => {
  return storage.get(key, defaultValue)
}

export const setStorage = (key: string, value: any, options?: StorageOptions): Promise<void> => {
  return storage.set(key, value, options)
}

export const removeStorage = (key: string): Promise<void> => {
  return storage.remove(key)
}

// 同步版本的存储函数（适配uni-app原生API）
export const getStorageSync = <T = any>(key: string, defaultValue: T | null = null): T | null => {
  try {
    const fullKey = STORAGE_PREFIX + key
    let rawData: string | null = null
    
    // #ifdef MP-WEIXIN
    rawData = uni.getStorageSync(fullKey)
    // #endif
    
    // #ifdef H5
    rawData = localStorage.getItem(fullKey)
    // #endif
    
    // #ifdef APP-PLUS
    rawData = plus.storage.getItem(fullKey)
    // #endif
    
    if (!rawData) return defaultValue
    
    const data = JSON.parse(rawData)
    if (data.expires && Date.now() > data.expires) {
      // 过期则删除并返回默认值
      removeStorageSync(key)
      return defaultValue
    }
    return data.value
  } catch (error) {
    const ctx = createContext()
    logger.error(ctx, '[getStorageSync] 同步存储获取失败', error)
    return defaultValue
  }
}

export const setStorageSync = (key: string, value: any): void => {
  try {
    const data = {
      value,
      timestamp: Date.now(),
      expires: null
    }
    
    const finalData = JSON.stringify(data)
    const fullKey = STORAGE_PREFIX + key
    
    // #ifdef MP-WEIXIN
    uni.setStorageSync(fullKey, finalData)
    // #endif
    
    // #ifdef H5
    localStorage.setItem(fullKey, finalData)
    // #endif
    
    // #ifdef APP-PLUS
    plus.storage.setItem(fullKey, finalData)
    // #endif
  } catch (error) {
    const ctx = createContext()
    logger.error(ctx, '[setStorageSync] 同步存储设置失败', error)
  }
}

export const removeStorageSync = (key: string): void => {
  try {
    const fullKey = STORAGE_PREFIX + key
    
    // #ifdef MP-WEIXIN
    uni.removeStorageSync(fullKey)
    // #endif
    
    // #ifdef H5
    localStorage.removeItem(fullKey)
    // #endif
    
    // #ifdef APP-PLUS
    plus.storage.removeItem(fullKey)
    // #endif
  } catch (error) {
    const ctx = createContext()
    logger.error(ctx, '[removeStorageSync] 同步存储删除失败', error)
  }
}

// 导出默认实例
export default storage