/**
 * 书籍服务
 * 处理书籍相关的业务逻辑和API调用
 */

const request = require('../utils/request.js')
const StorageManager = require('../utils/storage.js')
const Logger = require('../utils/logger.js')

/**
 * BookService类 - 书籍服务管理器
 */
class BookService {
  constructor() {
    this.apiPrefix = '/api/v1/books'
    this.cachePrefix = 'book_'
    this.cacheExpire = 30 * 60 * 1000 // 30分钟缓存
  }

  /**
   * 获取书籍列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页大小
   * @param {string} params.category - 分类
   * @param {string} params.status - 状态
   * @param {string} params.search - 搜索关键词
   * @returns {Promise<Array>} 书籍列表
   */
  async getBooksList(params = {}) {
    try {
      Logger.info('获取书籍列表', params)

      // 构建缓存key
      const cacheKey = `${this.cachePrefix}list_${JSON.stringify(params)}`

      // 尝试从缓存获取
      const cachedData = await StorageManager.get(cacheKey)
      if (cachedData && Array.isArray(cachedData)) {
        Logger.info('从缓存获取书籍列表', { count: cachedData.length })
        return cachedData
      }

      // 从服务器获取
      const response = await request.get(this.apiPrefix, {
        data: {
          page: params.page || 1,
          pageSize: params.pageSize || 20,
          // 后端当前不支持 category/status/search 直接过滤
        }
      })

      const books = response.data?.data?.list || []

      // 数据处理和缓存
      const processedBooks = this.processBooksList(books)
      await StorageManager.set(cacheKey, processedBooks, {
        expire: this.cacheExpire
      })

      Logger.info('获取书籍列表成功', { count: processedBooks.length })
      return processedBooks
    } catch (error) {
      Logger.error('获取书籍列表失败', error)

      // 返回本地缓存的书籍（如果有）
      return await this.getLocalBooks()
    }
  }

  /**
   * 获取书籍详情
   * @param {string} bookId - 书籍ID
   * @returns {Promise<Object>} 书籍详情
   */
  async getBookDetail(bookId) {
    if (!bookId) {
      throw new Error('书籍ID不能为空')
    }

    try {
      Logger.info('获取书籍详情', { bookId })

      // 检查缓存
      const cacheKey = `${this.cachePrefix}detail_${bookId}`
      const cachedData = await StorageManager.get(cacheKey)
      if (cachedData) {
        Logger.info('从缓存获取书籍详情')
        return cachedData
      }

      // 从服务器获取
      const response = await request.get(`${this.apiPrefix}/${bookId}`)
      const bookDetail = response.data?.data

      if (!bookDetail) {
        throw new Error('书籍不存在')
      }

      // 处理数据
      const processedBook = this.processBookDetail(bookDetail)

      // 缓存数据
      await StorageManager.set(cacheKey, processedBook, {
        expire: this.cacheExpire
      })

      Logger.info('获取书籍详情成功', { bookId, title: processedBook.title })
      return processedBook
    } catch (error) {
      Logger.error('获取书籍详情失败', { bookId, error })
      throw error
    }
  }

  /**
   * 添加书籍
   * @param {Object} bookData - 书籍数据
   * @returns {Promise<Object>} 新增的书籍
   */
  async addBook(bookData) {
    try {
      // 数据验证
      this.validateBookData(bookData)

      Logger.info('添加书籍', { title: bookData.title })

      // 发送请求
      const response = await request.post(this.apiPrefix, bookData)
      const newBook = response.data?.data

      if (newBook) {
        // 清除相关缓存
        await this.clearBooksCache()

        // 缓存新书详情
        const cacheKey = `${this.cachePrefix}detail_${newBook.id}`
        await StorageManager.set(cacheKey, newBook, {
          expire: this.cacheExpire
        })

        Logger.info('添加书籍成功', {
          bookId: newBook.id,
          title: newBook.title
        })
      }

      return newBook
    } catch (error) {
      Logger.error('添加书籍失败', { bookData, error })
      throw error
    }
  }

  /**
   * 更新书籍信息
   * @param {string} bookId - 书籍ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的书籍
   */
  async updateBook(bookId, updateData) {
    if (!bookId) {
      throw new Error('书籍ID不能为空')
    }

    try {
      Logger.info('更新书籍信息', { bookId, updateData })

      const response = await request.put(`${this.apiPrefix}/${bookId}`, updateData)
      const updatedBook = response.data?.data

      if (updatedBook) {
        // 更新缓存
        const cacheKey = `${this.cachePrefix}detail_${bookId}`
        await StorageManager.set(cacheKey, updatedBook, {
          expire: this.cacheExpire
        })

        // 清除列表缓存
        await this.clearBooksListCache()

        Logger.info('更新书籍成功', {
          bookId,
          title: updatedBook.title
        })
      }

      return updatedBook
    } catch (error) {
      Logger.error('更新书籍失败', { bookId, updateData, error })
      throw error
    }
  }

  /**
   * 删除书籍
   * @param {string} bookId - 书籍ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteBook(bookId) {
    if (!bookId) {
      throw new Error('书籍ID不能为空')
    }

    try {
      Logger.info('删除书籍', { bookId })

      await request.delete(`${this.apiPrefix}/${bookId}`)

      // 清除缓存
      await Promise.all([
        StorageManager.remove(`${this.cachePrefix}detail_${bookId}`),
        this.clearBooksListCache()
      ])

      Logger.info('删除书籍成功', { bookId })
      return true
    } catch (error) {
      Logger.error('删除书籍失败', { bookId, error })
      throw error
    }
  }

  /**
   * 根据ISBN获取书籍信息
   * @param {string} isbn - ISBN码
   * @returns {Promise<Object>} 书籍信息
   */
  async getBookByISBN(isbn) {
    if (!isbn) {
      throw new Error('ISBN不能为空')
    }

    try {
      Logger.info('根据ISBN获取书籍信息', { isbn })

      const response = await request.get(`${this.apiPrefix}/isbn`, {
        data: { isbn }
      })
      const bookInfo = response.data?.data

      if (bookInfo) {
        Logger.info('ISBN查询成功', {
          isbn,
          title: bookInfo.title
        })
      }

      return bookInfo
    } catch (error) {
      Logger.error('ISBN查询失败', { isbn, error })
      throw error
    }
  }

  /**
   * 搜索书籍
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 搜索结果
   */
  async searchBooks(keyword, options = {}) {
    if (!keyword || !keyword.trim()) {
      return []
    }

    try {
      Logger.info('搜索书籍', { keyword, options })

      const response = await request.get(`${this.apiPrefix}/search`, {
        data: {
          keyword: keyword.trim(),
          type: options.type || 'all',
          page: options.page || 1,
          pageSize: options.pageSize || 20
        }
      })

      const results = response.data?.data?.list || []
      const processedResults = this.processBooksList(results)

      Logger.info('搜索书籍完成', {
        keyword,
        count: processedResults.length
      })

      return processedResults
    } catch (error) {
      Logger.error('搜索书籍失败', { keyword, error })
      throw error
    }
  }

  /**
   * 更新阅读进度
   * @param {string} bookId - 书籍ID
   * @param {number} progress - 阅读进度（0-100）
   * @returns {Promise<Object>} 更新结果
   */
  async updateReadingProgress(bookId, progress) {
    if (!bookId) {
      throw new Error('书籍ID不能为空')
    }

    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      throw new Error('阅读进度必须是0-100之间的数字')
    }

    try {
      Logger.info('更新阅读进度', { bookId, progress })

      const response = await request.put(`${this.apiPrefix}/${bookId}/progress`, {
        progress,
        lastReadTime: new Date().toISOString()
      })

      const result = response.data?.data

      if (result) {
        // 更新缓存
        const cacheKey = `${this.cachePrefix}detail_${bookId}`
        const cachedBook = await StorageManager.get(cacheKey)
        if (cachedBook) {
          cachedBook.readProgress = progress
          cachedBook.lastReadTime = result.lastReadTime
          await StorageManager.set(cacheKey, cachedBook, {
            expire: this.cacheExpire
          })
        }

        Logger.info('更新阅读进度成功', { bookId, progress })
      }

      return result
    } catch (error) {
      Logger.error('更新阅读进度失败', { bookId, progress, error })
      throw error
    }
  }

  /**
   * 获取阅读统计
   * @returns {Promise<Object>} 阅读统计数据
   */
  async getReadingStats() {
    try {
      Logger.info('获取阅读统计')

      // 检查缓存
      const cacheKey = `${this.cachePrefix}stats`
      const cachedStats = await StorageManager.get(cacheKey)
      if (cachedStats) {
        return cachedStats
      }

      const response = await request.get(`${this.apiPrefix}/stats`)
      const stats = response.data?.data || {
        totalBooks: 0,
        readingBooks: 0,
        finishedBooks: 0,
        totalNotes: 0,
        readingDays: 0,
        totalPages: 0,
        avgProgress: 0
      }

      // 缓存统计数据（较短的缓存时间）
      await StorageManager.set(cacheKey, stats, {
        expire: 5 * 60 * 1000 // 5分钟
      })

      Logger.info('获取阅读统计成功', stats)
      return stats
    } catch (error) {
      Logger.error('获取阅读统计失败', error)
      return {
        totalBooks: 0,
        readingBooks: 0,
        finishedBooks: 0,
        totalNotes: 0,
        readingDays: 0,
        totalPages: 0,
        avgProgress: 0
      }
    }
  }

  /**
   * 处理书籍列表数据
   * @param {Array} books - 原始书籍数据
   * @returns {Array} 处理后的书籍数据
   */
  processBooksList(books) {
    if (!Array.isArray(books)) {
      return []
    }

    return books.map(book => this.processBookData(book))
  }

  /**
   * 处理单个书籍数据
   * @param {Object} book - 原始书籍数据
   * @returns {Object} 处理后的书籍数据
   */
  processBookData(book) {
    if (!book) return null

    return {
      id: book.id,
      title: book.title || '未知书名',
      author: book.author || '未知作者',
      isbn: book.isbn || '',
      coverUrl: book.cover_url || book.coverUrl || '',
      description: book.description || '',
      category: book.category || '未分类',
      status: book.status || 'wishlist', // wishlist, reading, finished
      readProgress: Math.min(100, Math.max(0, book.read_progress || book.readProgress || 0)),
      noteCount: book.totalNotes || book.note_count || book.noteCount || 0,
      pageCount: book.page_count || book.pageCount || 0,
      publishedAt: book.published_at || book.publishedAt,
      publisher: book.publisher || '',
      createdAt: book.created_at || book.createdAt,
      updatedAt: book.updated_at || book.updatedAt,
      lastReadTime: book.last_read_time || book.lastReadTime,
      tags: Array.isArray(book.tags) ? book.tags : [],
      // 计算属性
      isReading: book.status === 'reading',
      isFinished: book.status === 'finished',
      hasNotes: (book.note_count || book.noteCount || 0) > 0
    }
  }

  /**
   * 处理书籍详情数据
   * @param {Object} book - 原始书籍详情
   * @returns {Object} 处理后的书籍详情
   */
  processBookDetail(book) {
    const processedBook = this.processBookData(book)

    if (processedBook && book) {
      // 详情页特有的字段
      processedBook.notes = Array.isArray(book.notes) ? book.notes : []
      processedBook.readingHistory = Array.isArray(book.reading_history || book.readingHistory)
        ? (book.reading_history || book.readingHistory)
        : []
      processedBook.bookmarks = Array.isArray(book.bookmarks) ? book.bookmarks : []
    }

    return processedBook
  }

  /**
   * 验证书籍数据
   * @param {Object} bookData - 书籍数据
   * @throws {Error} 验证失败时抛出错误
   */
  validateBookData(bookData) {
    if (!bookData || typeof bookData !== 'object') {
      throw new Error('书籍数据不能为空')
    }

    if (!bookData.title || !bookData.title.trim()) {
      throw new Error('书名不能为空')
    }

    if (bookData.title.length > 100) {
      throw new Error('书名长度不能超过100个字符')
    }

    if (bookData.author && bookData.author.length > 50) {
      throw new Error('作者名长度不能超过50个字符')
    }

    if (bookData.isbn && !/^[\d-X]+$/.test(bookData.isbn)) {
      throw new Error('ISBN格式不正确')
    }

    const validStatuses = ['wishlist', 'reading', 'finished']
    if (bookData.status && !validStatuses.includes(bookData.status)) {
      throw new Error('书籍状态不正确')
    }

    if (bookData.readProgress !== undefined) {
      const progress = Number(bookData.readProgress)
      if (isNaN(progress) || progress < 0 || progress > 100) {
        throw new Error('阅读进度必须是0-100之间的数字')
      }
    }
  }

  /**
   * 获取本地书籍（离线模式）
   * @returns {Promise<Array>} 本地书籍列表
   */
  async getLocalBooks() {
    try {
      const localBooks = await StorageManager.get('offline_books', [])
      Logger.info('获取本地书籍', { count: localBooks.length })
      return localBooks
    } catch (error) {
      Logger.error('获取本地书籍失败', error)
      return []
    }
  }

  /**
   * 保存书籍到本地（离线模式）
   * @param {Array} books - 书籍列表
   * @returns {Promise<void>}
   */
  async saveLocalBooks(books) {
    try {
      await StorageManager.set('offline_books', books, {
        expire: 7 * 24 * 60 * 60 * 1000 // 7天
      })
      Logger.info('保存本地书籍成功', { count: books.length })
    } catch (error) {
      Logger.error('保存本地书籍失败', error)
    }
  }

  /**
   * 清除书籍缓存
   * @returns {Promise<void>}
   */
  async clearBooksCache() {
    try {
      // TODO: 缓存策略可以进一步优化 - 记录在CLAUDE.md前端技术债务 2025-09-05 [项目:chinese-rose-front]
      // 获取所有存储key
      const info = await StorageManager.getInfo()
      if (!info) return

      // 删除书籍相关的缓存
      // const booksCachePattern = new RegExp(`^${StorageManager.config.prefix}${this.cachePrefix}`)

      // 这里需要遍历所有key来删除，实际项目中可能需要优化
      await Promise.all([
        this.clearBooksListCache(),
        StorageManager.remove(`${this.cachePrefix}stats`)
      ])

      Logger.info('清除书籍缓存完成')
    } catch (error) {
      Logger.error('清除书籍缓存失败', error)
    }
  }

  /**
   * 清除书籍列表缓存
   * @returns {Promise<void>}
   */
  async clearBooksListCache() {
    try {
      // 简单实现：删除常用的列表缓存key
      const commonCacheKeys = [
        'list_{}',
        'list_{"page":1,"pageSize":20}',
        'list_{"page":1,"pageSize":50}'
      ]

      await Promise.all(
        commonCacheKeys.map(key =>
          StorageManager.remove(`${this.cachePrefix}${key}`)
        )
      )
    } catch (error) {
      Logger.error('清除书籍列表缓存失败', error)
    }
  }
}

// 创建单例
const bookService = new BookService()

module.exports = bookService
