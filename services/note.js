/**
 * 笔记服务
 * 处理笔记相关的业务逻辑和API调用
 */

const request = require('../utils/request.js')
const StorageManager = require('../utils/storage.js')
const Logger = require('../utils/logger.js')

/**
 * NoteService类 - 笔记服务管理器
 */
class NoteService {
  constructor() {
    this.apiPrefix = '/api/v1/notes'
    this.cachePrefix = 'note_'
    this.cacheExpire = 30 * 60 * 1000 // 30分钟缓存
  }

  /**
   * 获取笔记列表
   * @param {Object} params - 查询参数
   * @param {string} params.bookId - 书籍ID
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页大小
   * @param {string} params.search - 搜索关键词
   * @param {string} params.type - 笔记类型
   * @returns {Promise<Array>} 笔记列表
   */
  async getNotesList(params = {}) {
    try {
      Logger.info('获取笔记列表', params)

      // 构建缓存key
      const cacheKey = `${this.cachePrefix}list_${JSON.stringify(params)}`

      // 尝试从缓存获取
      const cachedData = await StorageManager.get(cacheKey)
      if (cachedData && Array.isArray(cachedData)) {
        Logger.info('从缓存获取笔记列表', { count: cachedData.length })
        return cachedData
      }

      let notes = []
      if (params.bookId) {
        // 书籍内笔记列表
        const response = await request.get(`/api/v1/books/${params.bookId}/notes`, {
          data: {
            page: params.page || 1,
            pageSize: params.pageSize || 20
          }
        })
        notes = response.data?.data?.list || []
      } else {
        // 全部笔记：使用同步接口获取（按需可传 lastSyncTime）
        const response = await request.post(`${this.apiPrefix}/sync`, {
          lastSyncTime: params.lastSyncTime || ''
        }, { loading: false })
        notes = response.data?.data?.notes || []
      }

      // 数据处理和缓存
      const processedNotes = this.processNotesList(notes)
      await StorageManager.set(cacheKey, processedNotes, {
        expire: this.cacheExpire
      })

      Logger.info('获取笔记列表成功', { count: processedNotes.length })
      return processedNotes
    } catch (error) {
      Logger.error('获取笔记列表失败', error)

      // 返回本地缓存的笔记（如果有）
      return await this.getLocalNotes(params.bookId)
    }
  }

  /**
   * 获取笔记详情
   * @param {string} noteId - 笔记ID
   * @returns {Promise<Object>} 笔记详情
   */
  async getNoteDetail(noteId) {
    if (!noteId) {
      throw new Error('笔记ID不能为空')
    }

    try {
      Logger.info('获取笔记详情', { noteId })

      // 检查缓存
      const cacheKey = `${this.cachePrefix}detail_${noteId}`
      const cachedData = await StorageManager.get(cacheKey)
      if (cachedData) {
        Logger.info('从缓存获取笔记详情')
        return cachedData
      }

      // 从服务器获取
      const response = await request.get(`${this.apiPrefix}/${noteId}`)
      const noteDetail = response.data?.data

      if (!noteDetail) {
        throw new Error('笔记不存在')
      }

      // 处理数据
      const processedNote = this.processNoteData(noteDetail)

      // 缓存数据
      await StorageManager.set(cacheKey, processedNote, {
        expire: this.cacheExpire
      })

      Logger.info('获取笔记详情成功', { noteId })
      return processedNote
    } catch (error) {
      Logger.error('获取笔记详情失败', { noteId, error })
      throw error
    }
  }

  /**
   * 添加笔记
   * @param {Object} noteData - 笔记数据
   * @returns {Promise<Object>} 新增的笔记
   */
  async addNote(noteData) {
    try {
      // 数据验证
      this.validateNoteData(noteData)

      Logger.info('添加笔记', {
        bookId: noteData.bookId,
        type: noteData.type
      })

      // 处理图片上传（如果有）
      if (noteData.images && noteData.images.length > 0) {
        noteData.images = await this.uploadImages(noteData.images)
      }

      // 发送请求
      const response = await request.post(this.apiPrefix, noteData)
      const newNote = response.data?.data

      if (newNote) {
        // 清除相关缓存
        await this.clearNotesCache(noteData.bookId)

        // 缓存新笔记详情
        const cacheKey = `${this.cachePrefix}detail_${newNote.id}`
        await StorageManager.set(cacheKey, newNote, {
          expire: this.cacheExpire
        })

        // 保存到本地（离线支持）
        await this.saveNoteToLocal(newNote)

        Logger.info('添加笔记成功', {
          noteId: newNote.id,
          bookId: newNote.bookId
        })
      }

      return newNote
    } catch (error) {
      Logger.error('添加笔记失败', { noteData, error })
      throw error
    }
  }

  /**
   * 更新笔记
   * @param {string} noteId - 笔记ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的笔记
   */
  async updateNote(noteId, updateData) {
    if (!noteId) {
      throw new Error('笔记ID不能为空')
    }

    try {
      Logger.info('更新笔记', { noteId, updateData })

      // 处理图片上传（如果有新图片）
      if (updateData.images) {
        updateData.images = await this.uploadImages(updateData.images)
      }

      const response = await request.put(`${this.apiPrefix}/${noteId}`, updateData)
      const updatedNote = response.data?.data

      if (updatedNote) {
        // 更新缓存
        const cacheKey = `${this.cachePrefix}detail_${noteId}`
        await StorageManager.set(cacheKey, updatedNote, {
          expire: this.cacheExpire
        })

        // 清除列表缓存
        await this.clearNotesListCache(updatedNote.bookId)

        // 更新本地存储
        await this.updateNoteInLocal(updatedNote)

        Logger.info('更新笔记成功', { noteId })
      }

      return updatedNote
    } catch (error) {
      Logger.error('更新笔记失败', { noteId, updateData, error })
      throw error
    }
  }

  /**
   * 删除笔记
   * @param {string} noteId - 笔记ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteNote(noteId) {
    if (!noteId) {
      throw new Error('笔记ID不能为空')
    }

    try {
      Logger.info('删除笔记', { noteId })

      // 先获取笔记信息（用于清除缓存）
      const note = await this.getNoteDetail(noteId)

      await request.delete(`${this.apiPrefix}/${noteId}`)

      // 清除缓存
      await Promise.all([
        StorageManager.remove(`${this.cachePrefix}detail_${noteId}`),
        this.clearNotesListCache(note?.bookId)
      ])

      // 从本地删除
      await this.deleteNoteFromLocal(noteId)

      Logger.info('删除笔记成功', { noteId })
      return true
    } catch (error) {
      Logger.error('删除笔记失败', { noteId, error })
      throw error
    }
  }

  /**
   * 搜索笔记
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 搜索结果
   */
  async searchNotes(keyword, options = {}) {
    if (!keyword || !keyword.trim()) {
      return []
    }

    try {
      Logger.info('搜索笔记', { keyword, options })

      // 后端暂无笔记搜索端点，退化为本地过滤（不降级功能入口，仅用于页面内筛选）
      const list = await this.getNotesList({
        bookId: options.bookId,
        page: 1,
        pageSize: 200
      })
      const processedResults = (list || []).filter(n =>
        (n.content || '').toLowerCase().includes(keyword.trim().toLowerCase())
      )

      Logger.info('搜索笔记完成', {
        keyword,
        count: processedResults.length
      })

      return processedResults
    } catch (error) {
      Logger.error('搜索笔记失败', { keyword, error })
      throw error
    }
  }

  /**
   * OCR识别笔记
   * @param {string} imagePath - 图片路径
   * @param {Object} options - OCR选项
   * @returns {Promise<Object>} OCR结果
   */
  async ocrRecognition(imagePath, options = {}) {
    if (!imagePath) {
      throw new Error('图片路径不能为空')
    }

    try {
      Logger.info('开始OCR识别', { imagePath, options })

      // 上传图片并进行OCR识别
      const response = await request.upload('/api/ocr/recognize', imagePath, {
        name: 'image',
        formData: {
          language: options.language || 'zh-cn',
          enhance: options.enhance || true,
          rotate: options.rotate || 0
        }
      })

      const ocrResult = response.data?.data

      if (ocrResult) {
        Logger.info('OCR识别成功', {
          textLength: ocrResult.text?.length || 0,
          confidence: ocrResult.confidence
        })
      }

      return ocrResult
    } catch (error) {
      Logger.error('OCR识别失败', { imagePath, error })
      throw error
    }
  }

  /**
   * 批量OCR识别
   * @param {Array<string>} imagePaths - 图片路径数组
   * @param {Object} options - OCR选项
   * @returns {Promise<Array>} OCR结果数组
   */
  async batchOcrRecognition(imagePaths, options = {}) {
    if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
      throw new Error('图片路径数组不能为空')
    }

    try {
      Logger.info('开始批量OCR识别', { count: imagePaths.length })

      const ocrResults = []

      // 逐个进行OCR识别（可以优化为并发）
      for (const imagePath of imagePaths) {
        try {
          const result = await this.ocrRecognition(imagePath, options)
          ocrResults.push({
            imagePath,
            success: true,
            result
          })
        } catch (error) {
          Logger.error(`OCR识别失败: ${imagePath}`, error)
          ocrResults.push({
            imagePath,
            success: false,
            error: error.message
          })
        }
      }

      Logger.info('批量OCR识别完成', {
        total: imagePaths.length,
        success: ocrResults.filter(r => r.success).length
      })

      return ocrResults
    } catch (error) {
      Logger.error('批量OCR识别失败', error)
      throw error
    }
  }

  /**
   * 智能合并笔记
   * @param {Array} ocrResults - OCR识别结果数组
   * @param {Object} options - 合并选项
   * @returns {Promise<string>} 合并后的文本
   */
  async smartMergeNotes(ocrResults, options = {}) {
    if (!Array.isArray(ocrResults) || ocrResults.length === 0) {
      throw new Error('OCR结果数组不能为空')
    }

    try {
      Logger.info('开始智能合并笔记', { count: ocrResults.length })

      const response = await request.post('/api/ai/merge-notes', {
        ocrResults: ocrResults.map(result => ({
          text: result.result?.text || '',
          confidence: result.result?.confidence || 0,
          imagePath: result.imagePath
        })),
        options: {
          removeBlank: options.removeBlank !== false,
          mergeDuplicate: options.mergeDuplicate !== false,
          formatText: options.formatText !== false
        }
      })

      const mergedText = response.data?.data?.mergedText || ''

      Logger.info('智能合并笔记成功', {
        originalLength: ocrResults.length,
        mergedLength: mergedText.length
      })

      return mergedText
    } catch (error) {
      Logger.error('智能合并笔记失败', error)

      // 如果AI合并失败，使用简单合并
      return this.simpleMergeNotes(ocrResults)
    }
  }

  /**
   * 简单合并笔记（备选方案）
   * @param {Array} ocrResults - OCR识别结果数组
   * @returns {string} 合并后的文本
   */
  simpleMergeNotes(ocrResults) {
    try {
      const texts = ocrResults
        .filter(result => result.success && result.result?.text)
        .map(result => result.result.text.trim())
        .filter(text => text.length > 0)

      const mergedText = texts.join('\n\n')

      Logger.info('简单合并笔记完成', {
        count: texts.length,
        length: mergedText.length
      })

      return mergedText
    } catch (error) {
      Logger.error('简单合并笔记失败', error)
      return ''
    }
  }

  /**
   * 处理笔记列表数据
   * @param {Array} notes - 原始笔记数据
   * @returns {Array} 处理后的笔记数据
   */
  processNotesList(notes) {
    if (!Array.isArray(notes)) {
      return []
    }

    return notes.map(note => this.processNoteData(note))
  }

  /**
   * 处理单个笔记数据
   * @param {Object} note - 原始笔记数据
   * @returns {Object} 处理后的笔记数据
   */
  processNoteData(note) {
    if (!note) return null

    return {
      id: note.id,
      bookId: note.book_id || note.bookId,
      title: note.title || '无标题',
      content: note.content || '',
      type: note.type || 'text', // text, image, ocr, bookmark
      page: note.page || 0,
      chapter: note.chapter || '',
      images: Array.isArray(note.images) ? note.images : [],
      tags: Array.isArray(note.tags) ? note.tags : [],
      color: note.color || '#4A90E2',
      isBookmark: note.is_bookmark || note.isBookmark || false,
      isImportant: note.is_important || note.isImportant || false,
      createdAt: note.created_at || note.createdAt,
      updatedAt: note.updated_at || note.updatedAt,
      // 关联数据
      book: note.book
        ? {
          id: note.book.id,
          title: note.book.title,
          author: note.book.author,
          coverUrl: note.book.cover_url || note.book.coverUrl
        }
        : null,
      // 计算属性
      hasImages: Array.isArray(note.images) && note.images.length > 0,
      wordCount: note.content ? note.content.length : 0,
      preview: note.content ? note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '') : ''
    }
  }

  /**
   * 验证笔记数据
   * @param {Object} noteData - 笔记数据
   * @throws {Error} 验证失败时抛出错误
   */
  validateNoteData(noteData) {
    if (!noteData || typeof noteData !== 'object') {
      throw new Error('笔记数据不能为空')
    }

    if (!noteData.bookId) {
      throw new Error('书籍ID不能为空')
    }

    if (!noteData.content || !noteData.content.trim()) {
      throw new Error('笔记内容不能为空')
    }

    if (noteData.content.length > 10000) {
      throw new Error('笔记内容长度不能超过10000个字符')
    }

    if (noteData.title && noteData.title.length > 100) {
      throw new Error('笔记标题长度不能超过100个字符')
    }

    const validTypes = ['text', 'image', 'ocr', 'bookmark']
    if (noteData.type && !validTypes.includes(noteData.type)) {
      throw new Error('笔记类型不正确')
    }

    if (noteData.page && (typeof noteData.page !== 'number' || noteData.page < 0)) {
      throw new Error('页码必须是非负数')
    }

    if (noteData.images && !Array.isArray(noteData.images)) {
      throw new Error('图片数据必须是数组格式')
    }
  }

  /**
   * 上传图片
   * @param {Array} images - 图片数组
   * @returns {Promise<Array>} 上传后的图片URL数组
   */
  async uploadImages(images) {
    if (!Array.isArray(images) || images.length === 0) {
      return []
    }

    try {
      const uploadPromises = images.map(async(image) => {
        if (typeof image === 'string' && image.startsWith('http')) {
          // 已经是URL，直接返回
          return image
        }

        // 上传本地图片
        const response = await request.upload('/api/upload/image', image, {
          name: 'image'
        })

        return response.data?.data?.url || image
      })

      const uploadedImages = await Promise.all(uploadPromises)

      Logger.info('图片上传完成', {
        count: images.length,
        success: uploadedImages.filter(url => url.startsWith('http')).length
      })

      return uploadedImages
    } catch (error) {
      Logger.error('图片上传失败', error)
      throw new Error('图片上传失败')
    }
  }

  /**
   * 获取本地笔记
   * @param {string} bookId - 书籍ID（可选）
   * @returns {Promise<Array>} 本地笔记列表
   */
  async getLocalNotes(bookId) {
    try {
      let localNotes = await StorageManager.get('offline_notes', [])

      if (bookId) {
        localNotes = localNotes.filter(note => note.bookId === bookId)
      }

      Logger.info('获取本地笔记', { count: localNotes.length, bookId })
      return localNotes
    } catch (error) {
      Logger.error('获取本地笔记失败', error)
      return []
    }
  }

  /**
   * 保存笔记到本地
   * @param {Object} note - 笔记对象
   * @returns {Promise<void>}
   */
  async saveNoteToLocal(note) {
    try {
      const localNotes = await StorageManager.get('offline_notes', [])

      // 检查是否已存在
      const existingIndex = localNotes.findIndex(n => n.id === note.id)

      if (existingIndex >= 0) {
        localNotes[existingIndex] = note
      } else {
        localNotes.push(note)
      }

      await StorageManager.set('offline_notes', localNotes, {
        expire: 7 * 24 * 60 * 60 * 1000 // 7天
      })

      Logger.info('保存笔记到本地成功', { noteId: note.id })
    } catch (error) {
      Logger.error('保存笔记到本地失败', error)
    }
  }

  /**
   * 更新本地笔记
   * @param {Object} note - 笔记对象
   * @returns {Promise<void>}
   */
  async updateNoteInLocal(note) {
    return this.saveNoteToLocal(note)
  }

  /**
   * 从本地删除笔记
   * @param {string} noteId - 笔记ID
   * @returns {Promise<void>}
   */
  async deleteNoteFromLocal(noteId) {
    try {
      const localNotes = await StorageManager.get('offline_notes', [])
      const filteredNotes = localNotes.filter(note => note.id !== noteId)

      await StorageManager.set('offline_notes', filteredNotes, {
        expire: 7 * 24 * 60 * 60 * 1000 // 7天
      })

      Logger.info('从本地删除笔记成功', { noteId })
    } catch (error) {
      Logger.error('从本地删除笔记失败', error)
    }
  }

  /**
   * 清除笔记缓存
   * @param {string} bookId - 书籍ID
   * @returns {Promise<void>}
   */
  async clearNotesCache(bookId) {
    try {
      await this.clearNotesListCache(bookId)
      Logger.info('清除笔记缓存完成', { bookId })
    } catch (error) {
      Logger.error('清除笔记缓存失败', error)
    }
  }

  /**
   * 清除笔记列表缓存
   * @param {string} bookId - 书籍ID
   * @returns {Promise<void>}
   */
  async clearNotesListCache(bookId) {
    try {
      // 删除相关的列表缓存
      const cacheKeys = [
        'list_{}',
        'list_{"page":1,"pageSize":20}',
        bookId ? `list_{"bookId":"${bookId}"}` : null,
        bookId ? `list_{"bookId":"${bookId}","page":1,"pageSize":20}` : null
      ].filter(Boolean)

      await Promise.all(
        cacheKeys.map(key =>
          StorageManager.remove(`${this.cachePrefix}${key}`)
        )
      )
    } catch (error) {
      Logger.error('清除笔记列表缓存失败', error)
    }
  }
}

// 创建单例
const noteService = new NoteService()

module.exports = noteService
