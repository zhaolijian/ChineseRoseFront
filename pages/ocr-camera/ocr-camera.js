const Logger = require('../../utils/logger.js')
const BookService = require('../../services/book.js')
const request = require('../../utils/request.js')
const OCRService = require('../../services/ocr.js')

Page({
  data: {
    images: [],
    bookId: null,
    bookTitle: '',
    uploading: false,
    canSubmit: false
  },

  onLoad(options) {
    if (options.bookId) {
      this.setData({ bookId: Number(options.bookId) })
    }
  },

  onChooseImage() {
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
      this.setData({ images: res.tempFilePaths })
      this.updateCanSubmit()
    },
      fail: (e) => Logger.error('选择图片失败', e)
    })
  },

  onPreview(e) {
    const idx = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.images[idx],
      urls: this.data.images
    })
  }
  ,
  async onChooseBook() {
    try {
      const books = await BookService.getBooksList({ page: 1, pageSize: 50 })
      if (!books || books.length === 0) {
        wx.showToast({ title: '请先添加书籍', icon: 'none' })
        return
      }
      wx.showActionSheet({
        itemList: books.map(b => `${b.title} - ${b.author}`),
        success: (res) => {
          const book = books[res.tapIndex]
          this.setData({ bookId: book.id, bookTitle: book.title })
          this.updateCanSubmit()
        }
      })
    } catch (e) {
      Logger.error('选择书籍失败', e)
    }
  },
  async onUploadAndMerge() {
    const { images, bookId } = this.data
    if (!bookId) {
      wx.showToast({ title: '请先选择书籍', icon: 'none' })
      return
    }
    if (!images || images.length === 0) {
      wx.showToast({ title: '请先选择图片', icon: 'none' })
      return
    }
    try {
      this.setData({ uploading: true })
      // 逐张上传到后端转存COS
      const urls = []
      for (const path of images) {
        const res = await request.upload('/api/v1/storage/upload', path, {
          name: 'file',
          formData: { bookId }
        })
        const url = (res.data && res.data.data && res.data.data.url) || (typeof res.data === 'string' ? res.data : '')
        if (url) urls.push(url)
      }
      if (urls.length === 0) throw new Error('上传失败')

      // 服务端直接识别并合并成笔记
      const note = await OCRService.serverMerge(bookId, urls, true)
      if (note && note.id) {
        wx.showToast({ title: '已生成笔记', icon: 'success' })
        wx.navigateTo({ url: `/pages/note-edit/note-edit?id=${note.id}` })
      } else {
        wx.showToast({ title: '生成笔记失败', icon: 'none' })
      }
    } catch (e) {
      Logger.error('上传或识别失败', e)
      wx.showToast({ title: e.message || '处理失败', icon: 'none' })
    } finally {
      this.setData({ uploading: false })
    }
  }
  ,
  updateCanSubmit() {
    this.setData({ canSubmit: !!(this.data.bookId && this.data.images && this.data.images.length > 0) })
  }
})
