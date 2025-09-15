import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { ApiResponse } from '@/types/api'

// 笔记相关类型定义
export interface Note {
  id: number
  title?: string
  content: string
  bookId: number
  bookTitle?: string
  tags?: string[]
  createdAt: string
  updatedAt?: string
  syncStatus?: 'synced' | 'pending' | 'error'
}

export interface CreateNoteRequest {
  title?: string
  content: string
  bookId: number
  tags?: string[]
}

export interface UpdateNoteRequest {
  id: number
  title?: string
  content?: string
  tags?: string[]
}

export interface NotesResponse {
  notes: Note[]
  total: number
  hasMore: boolean
}

export const useNoteStore = defineStore('note', () => {
  // 状态
  const notes = ref<Note[]>([])
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const loading = ref(false)
  
  // 当前选中的笔记
  const currentNote = ref<Note | null>(null)
  
  // 搜索状态
  const searchKeyword = ref('')
  const searchResults = ref<Note[]>([])
  
  // 同步状态
  const syncStatus = ref<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const lastSyncTime = ref<string>('')
  
  // Actions
  
  /**
   * 获取笔记列表
   */
  const fetchNotes = async (page = 1, filter = 0): Promise<NotesResponse> => {
    try {
      loading.value = true
      
      // TODO: 调用实际API
      // const response = await noteApi.getNotes({
      //   page,
      //   pageSize: pageSize.value,
      //   filter
      // })
      
      // 模拟API响应
      const mockResponse: NotesResponse = {
        notes: [
          {
            id: 1,
            title: '读书笔记示例',
            content: '这是一条示例笔记，展示笔记内容的格式。可以包含多行文本，支持各种格式的内容记录...',
            bookId: 1,
            bookTitle: '《示例书籍》',
            tags: ['重要', '理论'],
            createdAt: new Date().toISOString(),
            syncStatus: 'synced'
          }
        ],
        total: 1,
        hasMore: false
      }
      
      if (page === 1) {
        notes.value = mockResponse.notes
        currentPage.value = 1
      } else {
        notes.value.push(...mockResponse.notes)
        currentPage.value = page
      }
      
      total.value = mockResponse.total
      
      return mockResponse
    } catch (error) {
      console.error('获取笔记列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取笔记详情
   */
  const fetchNoteDetail = async (id: number): Promise<Note> => {
    try {
      loading.value = true
      
      // TODO: 调用实际API
      // const response = await noteApi.getNoteDetail(id)
      
      // 模拟API响应
      const mockNote: Note = {
        id,
        title: '笔记详情示例',
        content: '这是笔记的详细内容...',
        bookId: 1,
        bookTitle: '《示例书籍》',
        tags: ['重要'],
        createdAt: new Date().toISOString(),
        syncStatus: 'synced'
      }
      
      currentNote.value = mockNote
      return mockNote
    } catch (error) {
      console.error('获取笔记详情失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 创建笔记
   */
  const createNote = async (noteData: CreateNoteRequest): Promise<Note> => {
    try {
      loading.value = true
      
      // TODO: 调用实际API
      // const response = await noteApi.createNote(noteData)
      
      // 模拟创建成功
      const newNote: Note = {
        id: Date.now(),
        ...noteData,
        createdAt: new Date().toISOString(),
        syncStatus: 'pending'
      }
      
      // 添加到列表前面
      notes.value.unshift(newNote)
      total.value += 1
      
      return newNote
    } catch (error) {
      console.error('创建笔记失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 更新笔记
   */
  const updateNote = async (noteData: UpdateNoteRequest): Promise<Note> => {
    try {
      loading.value = true
      
      // TODO: 调用实际API
      // const response = await noteApi.updateNote(noteData.id, noteData)
      
      // 模拟更新成功
      const index = notes.value.findIndex(note => note.id === noteData.id)
      if (index > -1) {
        const updatedNote = {
          ...notes.value[index],
          ...noteData,
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending' as const
        }
        notes.value[index] = updatedNote
        
        if (currentNote.value?.id === noteData.id) {
          currentNote.value = updatedNote
        }
        
        return updatedNote
      }
      
      throw new Error('笔记不存在')
    } catch (error) {
      console.error('更新笔记失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 删除笔记
   */
  const deleteNote = async (id: number): Promise<void> => {
    try {
      loading.value = true
      
      // TODO: 调用实际API
      // await noteApi.deleteNote(id)
      
      // 从列表中移除
      const index = notes.value.findIndex(note => note.id === id)
      if (index > -1) {
        notes.value.splice(index, 1)
        total.value -= 1
      }
      
      // 清除当前笔记
      if (currentNote.value?.id === id) {
        currentNote.value = null
      }
    } catch (error) {
      console.error('删除笔记失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 搜索笔记
   */
  const searchNotes = async (keyword: string): Promise<Note[]> => {
    try {
      loading.value = true
      searchKeyword.value = keyword
      
      if (!keyword.trim()) {
        searchResults.value = []
        return []
      }
      
      // TODO: 调用实际API
      // const response = await noteApi.searchNotes(keyword)
      
      // 模拟搜索结果
      const results = notes.value.filter(note => 
        note.title?.includes(keyword) || 
        note.content.includes(keyword) ||
        note.tags?.some(tag => tag.includes(keyword))
      )
      
      searchResults.value = results
      return results
    } catch (error) {
      console.error('搜索笔记失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取用户笔记统计
   */
  const getUserNoteCount = async (): Promise<number> => {
    try {
      // TODO: 调用实际API
      // const response = await noteApi.getUserNoteCount()
      
      // 返回模拟数据
      return notes.value.length
    } catch (error) {
      console.error('获取笔记统计失败:', error)
      return 0
    }
  }
  
  /**
   * 同步笔记
   */
  const syncNotes = async (): Promise<void> => {
    try {
      syncStatus.value = 'syncing'
      
      // TODO: 实现笔记同步逻辑
      // await noteApi.syncNotes()
      
      // 模拟同步成功
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 更新所有笔记的同步状态
      notes.value.forEach(note => {
        if (note.syncStatus === 'pending') {
          note.syncStatus = 'synced'
        }
      })
      
      lastSyncTime.value = new Date().toISOString()
      syncStatus.value = 'success'
    } catch (error) {
      console.error('同步笔记失败:', error)
      syncStatus.value = 'error'
      throw error
    }
  }
  
  /**
   * 清空搜索结果
   */
  const clearSearch = () => {
    searchKeyword.value = ''
    searchResults.value = []
  }
  
  /**
   * 重置状态
   */
  const reset = () => {
    notes.value = []
    currentNote.value = null
    currentPage.value = 1
    total.value = 0
    loading.value = false
    clearSearch()
    syncStatus.value = 'idle'
  }
  
  return {
    // 状态
    notes,
    currentPage,
    pageSize,
    total,
    loading,
    currentNote,
    searchKeyword,
    searchResults,
    syncStatus,
    lastSyncTime,
    
    // Actions
    fetchNotes,
    fetchNoteDetail,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    getUserNoteCount,
    syncNotes,
    clearSearch,
    reset
  }
})

export type NoteStore = ReturnType<typeof useNoteStore>