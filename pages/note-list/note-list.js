const NoteService = require('../../services/note.js')
const Logger = require('../../utils/logger.js')

Page({
  data: {
    notes: [],
    loading: false,
    keyword: ''
  },

  onLoad() {
    this.loadNotes()
  },

  onPullDownRefresh() {
    this.loadNotes().finally(() => wx.stopPullDownRefresh())
  },

  async loadNotes() {
    this.setData({ loading: true })
    try {
      const notes = await NoteService.getNotesList({ page: 1, pageSize: 100 })
      // 按更新时间倒序
      notes.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      this.setData({ notes })
    } catch (e) {
      Logger.error('加载笔记列表失败', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onKeywordChange(e) {
    this.setData({ keyword: e.detail || '' })
  },

  async onSearch(e) {
    const kw = (e?.detail || this.data.keyword || '').trim()
    if (!kw) {
      return this.loadNotes()
    }
    try {
      const list = await NoteService.searchNotes(kw, { page: 1, pageSize: 200 })
      this.setData({ notes: list })
    } catch (err) {
      Logger.error('搜索笔记失败', err)
    }
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
