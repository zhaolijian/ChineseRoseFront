/**
 * 笔记添加页面 - 页面逻辑
 * 负责OCR识别、笔记录入和数据管理等功能
 */

const BookService = require('../../services/book.js')
const NoteService = require('../../services/note.js')
const OCRService = require('../../services/ocr.js')
const Logger = require('../../utils/logger.js')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 书籍信息
    currentBook: null,

    // 笔记表单
    noteForm: {
      title: '',
      content: '',
      page: '',
      chapter: '',
      type: 'text', // text, ocr, voice
      color: '#4A90E2',
      isImportant: false,
      tags: []
    },

    // 图片相关
    selectedImages: [],
    ocrResults: [],
    isOcrProcessing: false,

    // UI状态
    loading: false,
    saving: false,
    showColorPicker: false,
    showTagInput: false,

    // 配置选项
    colors: [
      '#4A90E2', '#50C878', '#FF6B35', '#FFA726',
      '#9C27B0', '#F44336', '#607D8B', '#795548'
    ],
    quickTags: ['重点', '疑问', '想法', '引用', '总结', '感悟'],

    // 表单验证
    errors: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    Logger.info('笔记添加页面加载', options)

    // 加载书籍信息
    if (options.bookId) {
      this.loadBookInfo(options.bookId)
    } else if (options.bookInfo) {
      try {
        const bookInfo = JSON.parse(decodeURIComponent(options.bookInfo))
        this.setData({ currentBook: bookInfo })
      } catch (error) {
        Logger.error('解析书籍信息失败', error)
        this.showError('书籍信息解析失败')
      }
    } else {
      this.showBookSelector()
    }

    // 处理OCR预设文本
    if (options.ocrText) {
      this.setData({
        'noteForm.content': decodeURIComponent(options.ocrText),
        'noteForm.type': 'ocr'
      })
    }

    // 预设页码
    if (options.page) {
      this.setData({
        'noteForm.page': options.page
      })
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 检查页面状态等逻辑
  },

  /**
   * 加载书籍信息
   */
  async loadBookInfo(bookId) {
    if (!bookId) return

    try {
      this.setData({ loading: true })

      const book = await BookService.getBookDetail(bookId)
      this.setData({ currentBook: book })

      Logger.info('加载书籍信息成功', { bookId, title: book.title })
    } catch (error) {
      Logger.error('加载书籍信息失败', { bookId, error })
      this.showError('加载书籍信息失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 显示书籍选择器
   */
  async showBookSelector() {
    try {
      const books = await BookService.getBooksList({ pageSize: 50 })

      if (books.length === 0) {
        wx.showModal({
          title: '提示',
          content: '还没有添加任何书籍，请先添加书籍',
          confirmText: '去添加',
          success: (res) => {
            if (res.confirm) {
              wx.switchTab({ url: '/pages/books/index' })
            } else {
              wx.navigateBack()
            }
          }
        })
        return
      }

      const bookNames = books.map(book => `${book.title} - ${book.author}`)

      wx.showActionSheet({
        itemList: bookNames,
        success: (res) => {
          const selectedBook = books[res.tapIndex]
          this.setData({ currentBook: selectedBook })
          Logger.info('选择书籍', { bookId: selectedBook.id, title: selectedBook.title })
        },
        fail: () => {
          wx.navigateBack()
        }
      })
    } catch (error) {
      Logger.error('显示书籍选择器失败', error)
      this.showError('加载书籍列表失败')
    }
  },

  /* ==================== 表单输入 ==================== */

  /**
   * 标题输入
   */
  onTitleInput(event) {
    this.setData({
      'noteForm.title': event.detail.value
    })
    this.clearFieldError('title')
  },

  /**
   * 内容输入
   */
  onContentInput(event) {
    this.setData({
      'noteForm.content': event.detail.value
    })
    this.clearFieldError('content')
  },

  /**
   * 页码输入
   */
  onPageInput(event) {
    const page = event.detail.value
    this.setData({
      'noteForm.page': page
    })
  },

  /**
   * 章节输入
   */
  onChapterInput(event) {
    this.setData({
      'noteForm.chapter': event.detail.value
    })
  },

  /**
   * 重要性切换
   */
  onImportantChange(event) {
    this.setData({
      'noteForm.isImportant': event.detail
    })
  },

  /* ==================== 颜色标签 ==================== */

  /**
   * 显示颜色选择器
   */
  showColorPicker() {
    this.setData({ showColorPicker: true })
  },

  /**
   * 隐藏颜色选择器
   */
  hideColorPicker() {
    this.setData({ showColorPicker: false })
  },

  /**
   * 选择颜色
   */
  onColorSelect(event) {
    const color = event.currentTarget.dataset.color
    this.setData({
      'noteForm.color': color,
      showColorPicker: false
    })
  },

  /**
   * 显示标签输入
   */
  showTagInput() {
    this.setData({ showTagInput: true })
  },

  /**
   * 隐藏标签输入
   */
  hideTagInput() {
    this.setData({ showTagInput: false })
  },

  /**
   * 添加标签
   */
  addTag(event) {
    const tag = event.currentTarget.dataset.tag || event.detail.value
    const { tags } = this.data.noteForm

    if (!tag || tag.trim() === '') return

    const trimmedTag = tag.trim()

    if (tags.includes(trimmedTag)) {
      wx.showToast({
        title: '标签已存在',
        icon: 'none'
      })
      return
    }

    if (tags.length >= 5) {
      wx.showToast({
        title: '最多添加5个标签',
        icon: 'none'
      })
      return
    }

    this.setData({
      'noteForm.tags': [...tags, trimmedTag],
      showTagInput: false
    })
  },

  /**
   * 删除标签
   */
  removeTag(event) {
    const index = event.currentTarget.dataset.index
    const { tags } = this.data.noteForm

    tags.splice(index, 1)
    this.setData({
      'noteForm.tags': tags
    })
  },

  /* ==================== 图片OCR ==================== */

  /**
   * 选择图片
   */
  chooseImage() {
    wx.chooseMedia({
      count: 9 - this.data.selectedImages.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(file => ({
          path: file.tempFilePath,
          size: file.size
        }))

        this.setData({
          selectedImages: [...this.data.selectedImages, ...newImages]
        })

        Logger.info('选择图片', { count: newImages.length })
      },
      fail: (error) => {
        Logger.error('选择图片失败', error)
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 删除图片
   */
  deleteImage(event) {
    const index = event.currentTarget.dataset.index
    const images = this.data.selectedImages

    images.splice(index, 1)
    this.setData({
      selectedImages: images
    })

    // 删除对应OCR结果
    if (this.data.ocrResults[index]) {
      const ocrResults = this.data.ocrResults
      ocrResults.splice(index, 1)
      this.setData({ ocrResults })
    }
  },

  /**
   * 预览图片
   */
  previewImage(event) {
    const index = event.currentTarget.dataset.index
    const urls = this.data.selectedImages.map(img => img.path)

    wx.previewImage({
      current: urls[index],
      urls
    })
  },

  /**
   * OCR识别
   */
  async performOCR() {
    wx.showModal({
      title: 'OCR配置待完成',
      content: '当前OCR依赖COS直传/STS授权及后端批处理接口，需完成上传方案后启用。',
      confirmText: '知道了'
    })
  },

  /* ==================== 语音记录 ==================== */

  /**
   * 开始录音
   */
  startRecord() {
    // TODO: 语音记录功能待实现 - 记录在CLAUDE.md前端技术债务 2025-09-05 [项目:chinese-rose-front]
    wx.showToast({
      title: '语音功能开发中',
      icon: 'none'
    })
  },

  /* ==================== 保存笔记 ==================== */

  /**
   * 保存笔记
   */
  async saveNote() {
    // 表单验证
    if (!this.validateForm()) {
      return
    }

    try {
      this.setData({ saving: true })

      wx.showLoading({ title: '保存中...' })

      // 构建数据
      const noteData = {
        bookId: this.data.currentBook.id,
        title: this.data.noteForm.title.trim() || this.generateAutoTitle(),
        content: this.data.noteForm.content.trim(),
        page: this.data.noteForm.page ? parseInt(this.data.noteForm.page) : 0,
        chapter: this.data.noteForm.chapter.trim(),
        type: this.data.noteForm.type,
        color: this.data.noteForm.color,
        isImportant: this.data.noteForm.isImportant,
        tags: this.data.noteForm.tags
      }

      // 保存笔记
      const savedNote = await NoteService.addNote(noteData)

      wx.hideLoading()

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      Logger.info('保存笔记成功', {
        noteId: savedNote.id,
        bookId: noteData.bookId
      })

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      Logger.error('保存笔记失败', error)
      wx.hideLoading()
      this.showError('保存笔记失败')
    } finally {
      this.setData({ saving: false })
    }
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { noteForm, currentBook } = this.data
    const errors = {}

    // 检查书籍
    if (!currentBook) {
      errors.book = '请选择书籍'
    }

    // 检查内容
    if (!noteForm.content || !noteForm.content.trim()) {
      errors.content = '笔记内容不能为空'
    } else if (noteForm.content.trim().length > 10000) {
      errors.content = '笔记内容不能超过10000个字符'
    }

    // 检查页码
    if (noteForm.page && isNaN(parseInt(noteForm.page))) {
      errors.page = '页码必须是数字'
    }

    this.setData({ errors })

    if (Object.keys(errors).length > 0) {
      wx.showToast({
        title: Object.values(errors)[0],
        icon: 'none'
      })
      return false
    }

    return true
  },

  /**
   * 生成自动标题
   */
  generateAutoTitle() {
    const { content } = this.data.noteForm
    if (!content || !content.trim()) {
      return '无标题笔记'
    }

    // 取前20个字符作为标题
    const title = content.trim().substring(0, 20)
    return title + (content.trim().length > 20 ? '...' : '')
  },

  /**
   * 清除字段错误
   */
  clearFieldError(field) {
    const { errors } = this.data
    if (errors[field]) {
      delete errors[field]
      this.setData({ errors })
    }
  },

  /**
   * 显示错误信息
   */
  showError(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    })
  },

  /**
   * 取消编辑
   */
  onCancel() {
    if (this.hasFormChanges()) {
      wx.showModal({
        title: '确认离开',
        content: '当前有未保存的内容，确定要离开吗？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack()
          }
        }
      })
    } else {
      wx.navigateBack()
    }
  },

  /**
   * 检查表单是否有变化
   */
  hasFormChanges() {
    const { noteForm, selectedImages } = this.data

    return (
      noteForm.title.trim() ||
      noteForm.content.trim() ||
      noteForm.page ||
      noteForm.chapter.trim() ||
      noteForm.tags.length > 0 ||
      selectedImages.length > 0
    )
  }
})
