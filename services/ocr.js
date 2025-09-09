/**
 * OCR服务
 * 处理OCR识别相关的业务逻辑和API调用
 */

const request = require('../utils/request.js')
const Logger = require('../utils/logger.js')

/**
 * OCRService类 - OCR服务管理器
 */
class OCRService {
  constructor() {
    this.apiPrefix = '/api/v1/ocr'
  }

  // 创建OCR批次（需要传入已上传到COS的图片URL数组，以及bookId）
  async createBatch(bookId, imageUrls = []) {
    if (!bookId) throw new Error('bookId不能为空')
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) throw new Error('imageUrls不能为空')
    const res = await request.post(`${this.apiPrefix}/batch`, { bookId, imageUrls })
    return res.data?.data
  }

  // 更新批次识别结果（小程序侧识别完回传）
  async updateBatchResults(batchId, results = []) {
    if (!batchId) throw new Error('batchId不能为空')
    const res = await request.put(`${this.apiPrefix}/batch/${batchId}`, { batchId, results })
    return res.data?.data
  }

  // AI合并为笔记
  async mergeToNote(batchId, useAI = true) {
    if (!batchId) throw new Error('batchId不能为空')
    const res = await request.post(`${this.apiPrefix}/merge`, { batchId, useAI })
    return res.data?.data
  }

  // 保存为笔记
  async saveAsNote({ bookId, content, batchId, imageIds }) {
    const payload = { bookId, content, batchId, imageIds }
    const res = await request.post(`${this.apiPrefix}/notes`, payload)
    return res.data?.data
  }

  // 服务端直接识别并合并为笔记
  async serverMerge(bookId, imageUrls, useAI = true) {
    const res = await request.post(`${this.apiPrefix}/server/merge`, {
      bookId,
      imageUrls,
      useAI
    })
    return res.data?.data
  }

  /**
   * 文本识别
   * @param {string} imagePath - 图片路径
   * @param {Object} options - 识别选项
   * @returns {Promise<Object>} 识别结果
   */
  async recognizeText(imagePath, options = {}) {
    if (!imagePath) {
      throw new Error('图片路径不能为空')
    }

    try {
      Logger.info('开始文本识别', { imagePath, options })

      const response = await request.upload(`${this.apiPrefix}/text`, imagePath, {
        name: 'image',
        formData: {
          language: options.language || 'zh-cn',
          enhance: options.enhance !== false,
          detectOrientation: options.detectOrientation !== false
        }
      })

      const result = response.data?.data || {}

      Logger.info('文本识别成功', {
        textLength: result.text?.length || 0,
        confidence: result.confidence
      })

      return {
        text: result.text || '',
        confidence: result.confidence || 0,
        words: result.words || [],
        orientation: result.orientation || 0
      }
    } catch (error) {
      Logger.error('文本识别失败', { imagePath, error })
      throw error
    }
  }

  /**
   * 表格识别
   * @param {string} imagePath - 图片路径
   * @param {Object} options - 识别选项
   * @returns {Promise<Object>} 识别结果
   */
  async recognizeTable(imagePath, options = {}) {
    if (!imagePath) {
      throw new Error('图片路径不能为空')
    }

    try {
      Logger.info('开始表格识别', { imagePath, options })

      const response = await request.upload(`${this.apiPrefix}/table`, imagePath, {
        name: 'image',
        formData: {
          format: options.format || 'html',
          includeHeader: options.includeHeader !== false
        }
      })

      const result = response.data?.data || {}

      Logger.info('表格识别成功', {
        rows: result.rows?.length || 0,
        columns: result.columns?.length || 0
      })

      return {
        html: result.html || '',
        rows: result.rows || [],
        columns: result.columns || [],
        confidence: result.confidence || 0
      }
    } catch (error) {
      Logger.error('表格识别失败', { imagePath, error })
      throw error
    }
  }

  /**
   * 手写文字识别
   * @param {string} imagePath - 图片路径
   * @param {Object} options - 识别选项
   * @returns {Promise<Object>} 识别结果
   */
  async recognizeHandwriting(imagePath, options = {}) {
    if (!imagePath) {
      throw new Error('图片路径不能为空')
    }

    try {
      Logger.info('开始手写文字识别', { imagePath, options })

      const response = await request.upload(`${this.apiPrefix}/handwriting`, imagePath, {
        name: 'image',
        formData: {
          language: options.language || 'zh-cn'
        }
      })

      const result = response.data?.data || {}

      Logger.info('手写文字识别成功', {
        textLength: result.text?.length || 0,
        confidence: result.confidence
      })

      return {
        text: result.text || '',
        confidence: result.confidence || 0,
        words: result.words || []
      }
    } catch (error) {
      Logger.error('手写文字识别失败', { imagePath, error })
      throw error
    }
  }

  /**
   * 智能识别（自动判断类型）
   * @param {string} imagePath - 图片路径
   * @param {Object} options - 识别选项
   * @returns {Promise<Object>} 识别结果
   */
  async smartRecognize(imagePath, options = {}) {
    if (!imagePath) {
      throw new Error('图片路径不能为空')
    }

    try {
      Logger.info('开始智能识别', { imagePath, options })

      const response = await request.upload(`${this.apiPrefix}/smart`, imagePath, {
        name: 'image',
        formData: {
          language: options.language || 'zh-cn',
          enhance: options.enhance !== false,
          autoRotate: options.autoRotate !== false
        }
      })

      const result = response.data?.data || {}

      Logger.info('智能识别成功', {
        type: result.type,
        textLength: result.text?.length || 0,
        confidence: result.confidence
      })

      return {
        type: result.type || 'text', // text, table, handwriting
        text: result.text || '',
        confidence: result.confidence || 0,
        words: result.words || [],
        table: result.table || null,
        orientation: result.orientation || 0
      }
    } catch (error) {
      Logger.error('智能识别失败', { imagePath, error })
      throw error
    }
  }

  /**
   * 批量识别
   * @param {Array<string>} imagePaths - 图片路径数组
   * @param {Object} options - 识别选项
   * @returns {Promise<Array>} 识别结果数组
   */
  async batchRecognize(imagePaths, options = {}) {
    if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
      throw new Error('图片路径数组不能为空')
    }

    try {
      Logger.info('开始批量识别', { count: imagePaths.length })

      const results = []

      // 根据选项决定是否并发执行
      if (options.concurrent && options.concurrent > 1) {
        // 并发执行
        const chunks = this.chunkArray(imagePaths, options.concurrent)

        for (const chunk of chunks) {
          const chunkPromises = chunk.map(imagePath =>
            this.smartRecognize(imagePath, options)
              .then(result => ({ success: true, imagePath, result }))
              .catch(error => ({ success: false, imagePath, error: error.message }))
          )

          const chunkResults = await Promise.all(chunkPromises)
          results.push(...chunkResults)
        }
      } else {
        // 顺序执行
        for (const imagePath of imagePaths) {
          try {
            const result = await this.smartRecognize(imagePath, options)
            results.push({ success: true, imagePath, result })
          } catch (error) {
            results.push({ success: false, imagePath, error: error.message })
          }
        }
      }

      const successCount = results.filter(r => r.success).length

      Logger.info('批量识别完成', {
        total: imagePaths.length,
        success: successCount,
        failed: imagePaths.length - successCount
      })

      return results
    } catch (error) {
      Logger.error('批量识别失败', error)
      throw error
    }
  }

  /**
   * 图像预处理
   * @param {string} imagePath - 图片路径
   * @param {Object} options - 预处理选项
   * @returns {Promise<string>} 处理后的图片路径
   */
  async preprocessImage(imagePath, options = {}) {
    if (!imagePath) {
      throw new Error('图片路径不能为空')
    }

    try {
      Logger.info('开始图像预处理', { imagePath, options })

      const response = await request.upload(`${this.apiPrefix}/preprocess`, imagePath, {
        name: 'image',
        formData: {
          enhance: options.enhance !== false,
          denoise: options.denoise !== false,
          rotate: options.rotate || 0,
          brightness: options.brightness || 0,
          contrast: options.contrast || 0,
          binarize: options.binarize || false
        }
      })

      const result = response.data?.data || {}
      const processedImageUrl = result.url || result.imageUrl

      Logger.info('图像预处理成功', {
        originalPath: imagePath,
        processedUrl: processedImageUrl
      })

      return processedImageUrl
    } catch (error) {
      Logger.error('图像预处理失败', { imagePath, error })
      throw error
    }
  }

  /**
   * 获取识别历史
   * @param {Object} params - 查询参数
   * @returns {Promise<Array>} 识别历史列表
   */
  async getRecognitionHistory(params = {}) {
    try {
      Logger.info('获取识别历史', params)

      const response = await request.get(`${this.apiPrefix}/history`, {
        data: {
          page: params.page || 1,
          pageSize: params.pageSize || 20,
          type: params.type,
          startDate: params.startDate,
          endDate: params.endDate
        }
      })

      const history = response.data?.data || []

      Logger.info('获取识别历史成功', { count: history.length })
      return history
    } catch (error) {
      Logger.error('获取识别历史失败', error)
      throw error
    }
  }

  /**
   * 获取识别统计
   * @returns {Promise<Object>} 识别统计数据
   */
  async getRecognitionStats() {
    try {
      Logger.info('获取识别统计')

      const response = await request.get(`${this.apiPrefix}/stats`)
      const stats = response.data?.data || {
        totalRecognitions: 0,
        todayRecognitions: 0,
        monthlyRecognitions: 0,
        averageAccuracy: 0,
        typeDistribution: {}
      }

      Logger.info('获取识别统计成功', stats)
      return stats
    } catch (error) {
      Logger.error('获取识别统计失败', error)
      return {
        totalRecognitions: 0,
        todayRecognitions: 0,
        monthlyRecognitions: 0,
        averageAccuracy: 0,
        typeDistribution: {}
      }
    }
  }

  /**
   * 微信OCR插件识别（备选方案）
   * @param {string} imagePath - 图片路径
   * @param {Object} options - 识别选项
   * @returns {Promise<Object>} 识别结果
   */
  async wxOcrRecognize(imagePath, options = {}) {
    return new Promise((resolve, reject) => {
      // 检查微信OCR插件是否可用
      if (!wx.canIUse('ocr.detectText')) {
        reject(new Error('当前微信版本不支持OCR插件'))
        return
      }

      wx.ocr.detectText({
        path: imagePath,
        mode: options.mode || 'printed', // printed | handwritten
        success: (res) => {
          const result = {
            text: res.text || '',
            confidence: res.confidence || 0,
            words: res.words || []
          }

          Logger.info('微信OCR识别成功', {
            textLength: result.text.length,
            confidence: result.confidence
          })

          resolve(result)
        },
        fail: (error) => {
          Logger.error('微信OCR识别失败', error)
          reject(new Error(`微信OCR识别失败: ${error.errMsg}`))
        }
      })
    })
  }

  /**
   * 文本矫正
   * @param {string} text - 原始文本
   * @param {Object} options - 矫正选项
   * @returns {Promise<string>} 矫正后的文本
   */
  async correctText(text, options = {}) {
    if (!text || !text.trim()) {
      return text
    }

    try {
      Logger.info('开始文本矫正', { textLength: text.length })

      const response = await request.post(`${this.apiPrefix}/correct`, {
        text,
        language: options.language || 'zh-cn',
        correctSpelling: options.correctSpelling !== false,
        correctGrammar: options.correctGrammar !== false,
        removeDuplicates: options.removeDuplicates !== false
      })

      const correctedText = response.data?.data?.correctedText || text

      Logger.info('文本矫正完成', {
        originalLength: text.length,
        correctedLength: correctedText.length
      })

      return correctedText
    } catch (error) {
      Logger.error('文本矫正失败', error)
      // 矫正失败时返回原始文本
      return text
    }
  }

  /**
   * 工具方法：数组分块
   * @param {Array} array - 原数组
   * @param {number} size - 块大小
   * @returns {Array<Array>} 分块后的数组
   */
  chunkArray(array, size) {
    const chunks = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * 图片质量检测
   * @param {string} imagePath - 图片路径
   * @returns {Promise<Object>} 质量检测结果
   */
  async checkImageQuality(imagePath) {
    return new Promise((resolve) => {
      wx.getImageInfo({
        src: imagePath,
        success: (res) => {
          const quality = {
            width: res.width,
            height: res.height,
            size: res.size || 0,
            type: res.type || 'unknown',
            isHighQuality: res.width >= 800 && res.height >= 600,
            aspectRatio: res.width / res.height
          }

          // 简单的质量评估
          if (quality.width < 400 || quality.height < 300) {
            quality.recommendation = '图片分辨率较低，建议使用高分辨率图片以提高识别准确率'
          } else if (quality.aspectRatio < 0.3 || quality.aspectRatio > 3) {
            quality.recommendation = '图片宽高比异常，建议调整图片比例'
          } else {
            quality.recommendation = '图片质量良好'
          }

          resolve(quality)
        },
        fail: () => {
          resolve({
            width: 0,
            height: 0,
            size: 0,
            type: 'unknown',
            isHighQuality: false,
            aspectRatio: 1,
            recommendation: '无法获取图片信息'
          })
        }
      })
    })
  }

  /**
   * 获取最佳识别参数
   * @param {string} imagePath - 图片路径
   * @returns {Promise<Object>} 推荐的识别参数
   */
  async getOptimalParams(imagePath) {
    try {
      const quality = await this.checkImageQuality(imagePath)

      const params = {
        enhance: !quality.isHighQuality, // 低质量图片启用增强
        language: 'zh-cn',
        detectOrientation: true
      }

      if (quality.width > 1920 || quality.height > 1080) {
        params.resize = true
        params.maxWidth = 1920
        params.maxHeight = 1080
      }

      Logger.info('获取最佳识别参数', { imagePath, params, quality })
      return params
    } catch (error) {
      Logger.error('获取最佳识别参数失败', error)
      return {
        enhance: true,
        language: 'zh-cn',
        detectOrientation: true
      }
    }
  }
}

// 创建单例
const ocrService = new OCRService()

module.exports = ocrService
