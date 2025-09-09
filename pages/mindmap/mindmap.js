const MindmapService = require('../../services/mindmap.js')
const Logger = require('../../utils/logger.js')

Page({
  data: {
    maps: [],
    loading: false
  },

  onLoad() {
    this.load()
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh())
  },

  async load() {
    this.setData({ loading: true })
    try {
      const maps = await MindmapService.list(1, 50)
      // 规范字段名称
      const normalized = maps.map(m => ({
        id: m.id,
        bookId: m.bookId,
        bookTitle: m.bookTitle,
        previewUrl: m.previewUrl,
        updatedAt: m.updatedAt || m.createdAt
      }))
      this.setData({ maps: normalized })
    } catch (e) {
      Logger.error('加载导图失败', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onPreview(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    wx.previewImage({ urls: [url] })
  },

  formatTime(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  }
})

