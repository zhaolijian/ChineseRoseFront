/**
 * 首页（书架）- 页面逻辑
 * 负责书籍展示、搜索、筛选、排序等功能
 */

const BookService = require('../../services/book.js')
const StorageManager = require('../../utils/storage.js')
const Logger = require('../../utils/logger.js')
// 使用 Vant 的提示组件（通过组件实例调用）
// const Toast = require('@vant/weapp/toast/toast')
// const Dialog = require('@vant/weapp/dialog/dialog')
// const Notify = require('@vant/weapp/notify/notify')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 搜索相关
    searchValue: '',

    // 书籍数据
    books: [],
    filteredBooks: [],
    loading: false,
    refreshing: false,

    // 统计信息
    bookStats: {
      totalBooks: 0,
      totalNotes: 0,
      readingDays: 0
    },

    // 筛选和排序
    activeCategory: 'all',
    sortType: 'lastRead',
    viewMode: 'grid', // grid | list

    // 配置选项
    sortOptions: [
      { text: '最近阅读', value: 'lastRead' },
      { text: '书名排序', value: 'title' },
      { text: '作者排序', value: 'author' },
      { text: '添加时间', value: 'addTime' },
      { text: '阅读进度', value: 'progress' }
    ],

    // 添加选项
    showAddSheet: false,
    addActions: [
      {
        name: 'ocr',
        subname: '拍照识别书籍信息',
        openType: '',
        className: '',
        loading: false,
        disabled: false
      },
      {
        name: 'manual',
        subname: '手动输入书籍信息',
        openType: '',
        className: '',
        loading: false,
        disabled: false
      },
      {
        name: 'scan',
        subname: '扫描ISBN条形码',
        openType: '',
        className: '',
        loading: false,
        disabled: false
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    Logger.info('首页加载', options)
    this.initPage()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    Logger.info('首页渲染完成')
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    Logger.info('首页显示')
    this.refreshData()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    Logger.info('首页隐藏')
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    Logger.info('首页卸载')
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    Logger.info('下拉刷新')
    this.refreshData()
      .finally(() => {
        wx.stopPullDownRefresh()
      })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    Logger.info('上拉加载更多')
    this.loadMoreBooks()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '阅记 - 让阅读更有价值',
      path: '/pages/books/index',
      imageUrl: '/images/share-cover.png'
    }
  },

  /**
   * 用户点击右上角分享朋友圈
   */
  onShareTimeline() {
    return {
      title: '阅记 - 让阅读更有价值',
      imageUrl: '/images/share-timeline.png'
    }
  },

  /* ==================== 初始化方法 ==================== */

  /**
   * 初始化页面
   */
  async initPage() {
    try {
      // 加载用户配置
      await this.loadUserSettings()

      // 加载书籍数据
      await this.loadBooksData()

      // 计算统计信息
      this.calculateStats()
    } catch (error) {
      Logger.error('页面初始化失败', error)
      wx.showToast({
        title: '页面加载失败',
        icon: 'none'
      })
    }
  },

  /**
   * 加载用户设置
   */
  async loadUserSettings() {
    try {
      const settings = await StorageManager.get('userSettings', {
        viewMode: 'grid',
        sortType: 'lastRead',
        defaultCategory: 'all'
      })

      this.setData({
        viewMode: settings.viewMode,
        sortType: settings.sortType,
        activeCategory: settings.defaultCategory
      })
    } catch (error) {
      Logger.error('加载用户设置失败', error)
    }
  },

  /**
   * 加载书籍数据
   */
  async loadBooksData() {
    this.setData({ loading: true })

    try {
      const books = await BookService.getBooksList({
        page: 1,
        pageSize: 50
      })

      this.setData({
        books,
        filteredBooks: this.filterAndSortBooks(books)
      })

      Logger.info(`加载书籍数据成功，共${books.length}本`)
    } catch (error) {
      Logger.error('加载书籍数据失败', error)
      wx.showToast({
        title: '加载书籍失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 刷新数据
   */
  async refreshData() {
    this.setData({ refreshing: true })

    try {
      await Promise.all([
        this.loadBooksData(),
        this.loadUserSettings()
      ])

      this.calculateStats()
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
    } catch (error) {
      Logger.error('刷新数据失败', error)
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      })
    } finally {
      this.setData({ refreshing: false })
    }
  },

  /**
   * 加载更多书籍
   */
  async loadMoreBooks() {
    // TODO: 首页书籍列表可以实现虚拟滚动 - 记录在CLAUDE.md前端技术债务 2025-09-05 [项目:chinese-rose-front]
    Logger.info('加载更多书籍')
  },

  /**
   * 计算统计信息
   */
  calculateStats() {
    const { books } = this.data

    const stats = {
      totalBooks: books.length,
      totalNotes: books.reduce((sum, book) => sum + (book.noteCount || 0), 0),
      readingDays: this.calculateReadingDays(books)
    }

    this.setData({ bookStats: stats })
  },

  /**
   * 计算阅读天数
   */
  calculateReadingDays(books) {
    const readingDates = new Set()

    books.forEach(book => {
      if (book.readingHistory && Array.isArray(book.readingHistory)) {
        book.readingHistory.forEach(record => {
          const date = new Date(record.date).toDateString()
          readingDates.add(date)
        })
      }
    })

    return readingDates.size
  },

  /* ==================== 搜索功能 ==================== */

  /**
   * 搜索输入变化
   */
  onSearchChange(event) {
    this.setData({
      searchValue: event.detail
    })

    // 实时搜索（防抖）
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }

    this.searchTimer = setTimeout(() => {
      this.performSearch(event.detail)
    }, 300)
  },

  /**
   * 搜索确认
   */
  onSearch(event) {
    const keyword = event.detail
    this.performSearch(keyword)
    Logger.info('搜索确认', { keyword })
  },

  /**
   * 点击搜索框
   */
  onSearchClick() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  /**
   * 执行搜索
   */
  performSearch(keyword) {
    if (!keyword.trim()) {
      this.setData({
        filteredBooks: this.filterAndSortBooks(this.data.books)
      })
      return
    }

    const { books } = this.data
    const searchResults = books.filter(book => {
      return (
        book.title.toLowerCase().includes(keyword.toLowerCase()) ||
        book.author.toLowerCase().includes(keyword.toLowerCase()) ||
        (book.notes && book.notes.some(note =>
          note.content.toLowerCase().includes(keyword.toLowerCase())
        ))
      )
    })

    this.setData({
      filteredBooks: this.filterAndSortBooks(searchResults)
    })

    Logger.info('搜索结果', { keyword, count: searchResults.length })
  },

  /* ==================== 筛选和排序 ==================== */

  /**
   * 分类切换
   */
  onCategoryChange(event) {
    const category = event.detail.name
    this.setData({
      activeCategory: category,
      filteredBooks: this.filterAndSortBooks(this.data.books)
    })

    // 保存用户偏好
    this.saveUserPreference('defaultCategory', category)

    Logger.info('分类切换', { category })
  },

  /**
   * 排序方式改变
   */
  onSortChange(event) {
    const sortType = event.detail
    this.setData({
      sortType,
      filteredBooks: this.filterAndSortBooks(this.data.books)
    })

    // 保存用户偏好
    this.saveUserPreference('sortType', sortType)

    Logger.info('排序方式改变', { sortType })
  },

  /**
   * 筛选和排序书籍
   */
  filterAndSortBooks(books) {
    const { activeCategory, sortType, searchValue } = this.data

    // 筛选
    const filteredBooks = books.filter(book => {
      // 分类筛选
      if (activeCategory !== 'all' && book.status !== activeCategory) {
        return false
      }

      // 搜索筛选
      if (searchValue.trim()) {
        const keyword = searchValue.toLowerCase()
        return (
          book.title.toLowerCase().includes(keyword) ||
          book.author.toLowerCase().includes(keyword)
        )
      }

      return true
    })

    // 排序
    filteredBooks.sort((a, b) => {
      switch (sortType) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'author':
        return a.author.localeCompare(b.author)
      case 'addTime':
        return new Date(b.createdAt) - new Date(a.createdAt)
      case 'progress':
        return (b.readProgress || 0) - (a.readProgress || 0)
      case 'lastRead':
      default:
        return new Date(b.lastReadTime || b.updatedAt) - new Date(a.lastReadTime || a.updatedAt)
      }
    })

    return filteredBooks
  },

  /* ==================== 视图切换 ==================== */

  /**
   * 切换视图模式
   */
  toggleViewMode() {
    const viewMode = this.data.viewMode === 'grid' ? 'list' : 'grid'
    this.setData({ viewMode })

    // 保存用户偏好
    this.saveUserPreference('viewMode', viewMode)

    Logger.info('视图模式切换', { viewMode })
  },

  /* ==================== 书籍操作 ==================== */

  /**
   * 点击书籍
   */
  onBookClick(event) {
    const book = event.currentTarget.dataset.book

    wx.navigateTo({
      url: `/pages/book-detail/book-detail?id=${book.id}`,
      success: () => {
        Logger.info('导航到书籍详情', { bookId: book.id })
      }
    })
  },

  /**
   * 扫码添加书籍
   */
  onScanCode() {
    wx.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        Logger.info('扫码结果', res)

        if (res.scanType === 'WX_CODE' || res.scanType === 'QR_CODE') {
          // 处理二维码
          this.handleQRCodeResult(res.result)
        } else {
          // 处理条形码（ISBN）
          this.handleBarcodeResult(res.result)
        }
      },
      fail: (error) => {
        Logger.error('扫码失败', error)
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 处理二维码结果
   */
  handleQRCodeResult(result) {
    // TODO: 处理二维码扫描结果
    Logger.info('二维码结果', { result })
    wx.showToast({
      title: '暂不支持二维码扫描',
      icon: 'none'
    })
  },

  /**
   * 处理条形码结果
   */
  async handleBarcodeResult(isbn) {
    try {
      wx.showLoading({
        title: '查询书籍信息...'
      })

      // 根据ISBN查询书籍信息
      const bookInfo = await BookService.getBookByISBN(isbn)

      wx.hideLoading()

      if (bookInfo) {
        // 跳转到书籍添加页面
        wx.navigateTo({
          url: `/pages/note-add/note-add?bookInfo=${JSON.stringify(bookInfo)}`
        })
      } else {
        wx.showToast({
          title: '未找到书籍信息',
          icon: 'none'
        })
      }
    } catch (error) {
      Logger.error('查询书籍信息失败', error)
      wx.hideLoading()
      wx.showToast({
        title: '查询失败',
        icon: 'none'
      })
    }
  },

  /* ==================== 快速操作 ==================== */

  /**
   * 快速OCR
   */
  onQuickOCR() {
    wx.navigateTo({
      url: '/pages/ocr-camera/ocr-camera'
    })
  },

  /**
   * 添加书籍
   */
  onAddBook() {
    wx.navigateTo({
      url: '/pages/note-add/note-add'
    })
  },

  /**
   * 查看所有笔记
   */
  onViewAllNotes() {
    wx.navigateTo({
      url: '/pages/note-list/note-list'
    })
  },

  /* ==================== 浮动按钮操作 ==================== */

  /**
   * 显示添加选项
   */
  onShowAddOptions() {
    this.setData({ showAddSheet: true })
  },

  /**
   * 关闭添加选项
   */
  onCloseAddSheet() {
    this.setData({ showAddSheet: false })
  },

  /**
   * 选择添加方式
   */
  onSelectAddAction(event) {
    const { name } = event.detail

    this.setData({ showAddSheet: false })

    switch (name) {
    case 'ocr':
      this.onQuickOCR()
      break
    case 'manual':
      this.onAddBook()
      break
    case 'scan':
      this.onScanCode()
      break
    }

    Logger.info('选择添加方式', { name })
  },

  /**
   * 添加第一本书
   */
  onAddFirstBook() {
    this.onShowAddOptions()
  },

  /* ==================== 工具方法 ==================== */

  /**
   * 获取状态文本
   */
  getStatusText(status) {
    const statusMap = {
      reading: '在读',
      finished: '已读',
      wishlist: '想读'
    }
    return statusMap[status] || '未知'
  },

  /**
   * 格式化最后阅读时间
   */
  formatLastReadTime(time) {
    if (!time) return '未读过'

    const now = new Date()
    const readTime = new Date(time)
    const diffMs = now - readTime
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return '今天'
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks}周前`
    } else {
      return readTime.toLocaleDateString()
    }
  },

  /**
   * 获取空状态描述
   */
  getEmptyDescription() {
    const { activeCategory } = this.data
    const descriptions = {
      all: '还没有添加任何书籍\n开始记录你的阅读之旅吧',
      reading: '当前没有正在阅读的书籍\n去书架添加一本开始阅读吧',
      finished: '还没有读完任何一本书\n继续努力，完成第一本书吧',
      wishlist: '愿望清单是空的\n添加一些想读的书籍吧'
    }
    return descriptions[activeCategory] || descriptions.all
  },

  /**
   * 保存用户偏好设置
   */
  async saveUserPreference(key, value) {
    try {
      const settings = await StorageManager.get('userSettings', {})
      settings[key] = value
      await StorageManager.set('userSettings', settings)
    } catch (error) {
      Logger.error('保存用户偏好失败', { key, value, error })
    }
  }
})
