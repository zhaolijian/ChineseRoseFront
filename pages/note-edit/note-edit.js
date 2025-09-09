const NoteService = require('../../services/note.js')
const Logger = require('../../utils/logger.js')

Page({
  data: {
    noteId: null,
    content: '',
    loading: false,
    saving: false,
    isEditing: true,
    autoSaveTimer: null,
    hasUnsavedChanges: false
  },

  onLoad(options) {
    if (!options.id) {
      wx.showToast({ title: '无效笔记', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({ noteId: options.id })
    this.load()
  },

  async load() {
    this.setData({ loading: true })
    try {
      const note = await NoteService.getNoteDetail(this.data.noteId)
      this.setData({ content: note.content || '' })
    } catch (e) {
      Logger.error('加载笔记失败', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onContentTap() {
    if (!this.data.isEditing) this.setData({ isEditing: true })
  },

  onContentChange(e) {
    this.setData({ content: e.detail.value, hasUnsavedChanges: true })
    this.resetAutoSaveTimer()
  },

  resetAutoSaveTimer() {
    if (this.data.autoSaveTimer) clearTimeout(this.data.autoSaveTimer)
    this.setData({ autoSaveTimer: setTimeout(() => this.autoSave(), 3000) })
  },

  async autoSave() {
    if (!this.data.hasUnsavedChanges) return
    try {
      await NoteService.updateNote(this.data.noteId, { content: this.data.content })
      this.setData({ hasUnsavedChanges: false })
    } catch (e) {
      Logger.error('自动保存失败', e)
    }
  },

  async onSave() {
    this.setData({ saving: true })
    try {
      await NoteService.updateNote(this.data.noteId, { content: this.data.content })
      this.setData({ hasUnsavedChanges: false })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (e) {
      Logger.error('保存失败', e)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },

  onUnload() {
    if (this.data.autoSaveTimer) clearTimeout(this.data.autoSaveTimer)
    if (this.data.hasUnsavedChanges) this.autoSave()
  }
})
