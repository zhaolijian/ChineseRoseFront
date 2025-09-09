const BookService = require('../../services/book.js')
const NoteService = require('../../services/note.js')
const Logger = require('../../utils/logger.js')

Page({
  data: {
    id: null,
    book: null,
    notes: [],
    loading: false
  },

  onLoad(options) {
    const id = options.id
    if (!id) {
      wx.showToast({ title: '无效书籍', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({ id })
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const [book, notes] = await Promise.all([
        BookService.getBookDetail(this.data.id),
        NoteService.getNotesList({ bookId: this.data.id, page: 1, pageSize: 50 })
      ])
      this.setData({ book, notes })
    } catch (e) {
      Logger.error('加载书籍详情失败', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onCreateNote() {
    wx.navigateTo({ url: `/pages/note-add/note-add?bookId=${this.data.id}` })
  },

  onOpenNote(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/note-edit/note-edit?id=${id}` })
  },

  formatTime(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  }
})
