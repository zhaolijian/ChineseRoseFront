/**
 * 书籍卡片组件
 * 支持网格和列表两种显示模式
 */

const Logger = require('../../utils/logger.js')

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 书籍数据
    book: {
      type: Object,
      value: {},
      observer(newVal) {
        if (newVal && newVal.id) {
          this.processBookData(newVal)
        }
      }
    },

    // 显示模式：grid | list
    mode: {
      type: String,
      value: 'grid'
    },

    // 是否显示状态标签
    showStatus: {
      type: Boolean,
      value: true
    },

    // 是否显示进度
    showProgress: {
      type: Boolean,
      value: true
    },

    // 是否显示笔记数量
    showNoteCount: {
      type: Boolean,
      value: true
    },

    // 是否显示最后阅读时间
    showLastRead: {
      type: Boolean,
      value: true
    },

    // 自定义样式类
    customClass: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    processedBook: {}
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 处理书籍数据
     * @param {Object} book - 书籍数据
     */
    processBookData(book) {
      const processedBook = {
        id: book.id,
        title: book.title || '未知书名',
        author: book.author || '未知作者',
        coverUrl: book.coverUrl || book.cover_url || '',
        status: book.status || 'reading',
        readProgress: Math.min(100, Math.max(0, book.readProgress || book.read_progress || 0)),
        noteCount: book.noteCount || book.note_count || 0,
        category: book.category || '',
        lastReadTime: book.lastReadTime || book.last_read_time,
        createdAt: book.createdAt || book.created_at,
        updatedAt: book.updatedAt || book.updated_at
      }

      this.setData({
        processedBook
      })
    },

    /**
     * 获取状态文本
     * @param {string} status - 状态值
     * @returns {string} 状态文本
     */
    getStatusText(status) {
      const statusMap = {
        reading: '在读',
        finished: '已读',
        wishlist: '想读',
        paused: '暂停'
      }
      return statusMap[status] || '未知'
    },

    /**
     * 格式化时间
     * @param {string|number} time - 时间戳或时间字符串
     * @returns {string} 格式化后的时间
     */
    formatTime(time) {
      if (!time) return ''

      try {
        const date = new Date(time)
        const now = new Date()
        const diffMs = now - date
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 0) {
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
          if (diffHours === 0) {
            const diffMinutes = Math.floor(diffMs / (1000 * 60))
            return diffMinutes <= 0 ? '刚刚' : `${diffMinutes}分钟前`
          }
          return `${diffHours}小时前`
        } else if (diffDays === 1) {
          return '昨天'
        } else if (diffDays < 7) {
          return `${diffDays}天前`
        } else if (diffDays < 30) {
          const weeks = Math.floor(diffDays / 7)
          return `${weeks}周前`
        } else if (diffDays < 365) {
          const months = Math.floor(diffDays / 30)
          return `${months}个月前`
        } else {
          return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        }
      } catch (error) {
        // TODO: 组件props类型检查需要优化 - 记录在CLAUDE.md前端技术债务 2025-09-05 [项目:chinese-rose-front]
        Logger.error('时间格式化失败', error)
        return ''
      }
    },

    /**
     * 点击书籍卡片
     */
    onBookClick() {
      const { book } = this.properties

      if (!book || !book.id) {
        Logger.warn('书籍数据无效')
        return
      }

      // 触发自定义事件
      this.triggerEvent('bookclick', {
        book: this.data.processedBook,
        originalBook: book
      }, {
        bubbles: true,
        composed: true
      })
    },

    /**
     * 长按书籍卡片
     */
    onBookLongPress() {
      const { book } = this.properties

      if (!book || !book.id) {
        return
      }

      // 触发长按事件
      this.triggerEvent('booklongpress', {
        book: this.data.processedBook,
        originalBook: book
      }, {
        bubbles: true,
        composed: true
      })
    },

    /**
     * 点击状态标签
     */
    onStatusClick(event) {
      event.stopPropagation() // 阻止冒泡到卡片点击事件

      const { book } = this.properties

      this.triggerEvent('statusclick', {
        book: this.data.processedBook,
        originalBook: book,
        currentStatus: book.status
      }, {
        bubbles: true,
        composed: true
      })
    },

    /**
     * 点击进度条
     */
    onProgressClick(event) {
      event.stopPropagation()

      const { book } = this.properties

      this.triggerEvent('progressclick', {
        book: this.data.processedBook,
        originalBook: book,
        currentProgress: book.readProgress || 0
      }, {
        bubbles: true,
        composed: true
      })
    },

    /**
     * 获取卡片样式类
     * @returns {string} 样式类字符串
     */
    getCardClass() {
      const { mode, customClass } = this.properties
      const classes = ['book-card', mode]

      if (customClass) {
        classes.push(customClass)
      }

      return classes.join(' ')
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    /**
     * 组件实例被创建
     */
    created() {
      // 组件创建时的逻辑
    },

    /**
     * 组件实例进入页面节点树
     */
    attached() {
      // 处理初始书籍数据
      if (this.properties.book && this.properties.book.id) {
        this.processBookData(this.properties.book)
      }
    },

    /**
     * 组件实例被从页面节点树移除
     */
    detached() {
      // 清理逻辑
    }
  },

  /**
   * 组件所在页面生命周期
   */
  pageLifetimes: {
    /**
     * 页面显示
     */
    show() {
      // 页面显示时的逻辑
    },

    /**
     * 页面隐藏
     */
    hide() {
      // 页面隐藏时的逻辑
    }
  }
})
