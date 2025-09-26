import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getNoteList,
  getNoteDetail as apiGetNoteDetail,
  createNote as apiCreateNote,
  updateNote as apiUpdateNote,
  deleteNote as apiDeleteNote,
  searchNotes as apiSearchNotes,
  getNotesByBook,
  type Note,
  type NoteListParams,
  type NoteListResponse,
  type CreateNoteData,
  type UpdateNoteData
} from '@/api/modules/note'
import { logger, createContext } from '@/utils'

export type { Note } from '@/api/modules/note'

export const useNoteStore = defineStore('note', () => {
  const notes = ref<Note[]>([])
  const currentNote = ref<Note | null>(null)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const hasMore = ref(true)
  const loading = ref(false)

  const searchKeyword = ref('')
  const searchResults = ref<Note[]>([])

  const syncStatus = ref<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const lastSyncTime = ref('')

  const lastParams = ref<NoteListParams>({})

  const fetchNotes = async (page = 1, params: NoteListParams = {}): Promise<NoteListResponse> => {
    const ctx = createContext()
    try {
      loading.value = true
      lastParams.value = { ...params }
      const response = await getNoteList({
        page,
        pageSize: pageSize.value,
        ...params
      })

      if (page === 1) {
        notes.value = [...response.notes]
      } else {
        notes.value.push(...response.notes)
      }

      currentPage.value = response.page
      total.value = response.total
      hasMore.value = response.hasMore

      logger.debug(ctx, '[NoteStore] 获取笔记列表成功', { page, params, total: total.value })
      return response
    } catch (error) {
      logger.error(ctx, '[NoteStore] 获取笔记列表失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchNoteDetail = async (id: number): Promise<Note> => {
    const ctx = createContext()
    try {
      loading.value = true
      const note = await apiGetNoteDetail(id)
      currentNote.value = note

      const index = notes.value.findIndex(item => item.id === id)
      if (index !== -1) {
        notes.value[index] = note
      }

      logger.debug(ctx, '[NoteStore] 获取笔记详情成功', { id })
      return note
    } catch (error) {
      logger.error(ctx, '[NoteStore] 获取笔记详情失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createNote = async (payload: CreateNoteData): Promise<Note> => {
    const ctx = createContext()
    try {
      loading.value = true
      const note = await apiCreateNote(payload)
      notes.value.unshift(note)
      total.value += 1
      logger.info(ctx, '[NoteStore] 创建笔记成功', { id: note.id })
      return note
    } catch (error) {
      logger.error(ctx, '[NoteStore] 创建笔记失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateNote = async (id: number, payload: UpdateNoteData): Promise<Note> => {
    const ctx = createContext()
    try {
      loading.value = true
      const updated = await apiUpdateNote(id, payload)

      const index = notes.value.findIndex(item => item.id === id)
      if (index !== -1) {
        notes.value[index] = updated
      }

      if (currentNote.value?.id === id) {
        currentNote.value = updated
      }

      logger.info(ctx, '[NoteStore] 更新笔记成功', { id })
      return updated
    } catch (error) {
      logger.error(ctx, '[NoteStore] 更新笔记失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteNote = async (id: number): Promise<void> => {
    const ctx = createContext()
    try {
      loading.value = true
      await apiDeleteNote(id)
      notes.value = notes.value.filter(item => item.id !== id)
      total.value = Math.max(0, total.value - 1)

      if (currentNote.value?.id === id) {
        currentNote.value = null
      }

      logger.info(ctx, '[NoteStore] 删除笔记成功', { id })
    } catch (error) {
      logger.error(ctx, '[NoteStore] 删除笔记失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const searchNotes = async (keyword: string, params: Omit<NoteListParams, 'keyword'> = {}): Promise<Note[]> => {
    const ctx = createContext()
    const trimmed = keyword.trim()
    searchKeyword.value = trimmed

    if (!trimmed) {
      searchResults.value = []
      logger.debug(ctx, '[NoteStore] 搜索关键字为空，返回空结果')
      return []
    }

    try {
      loading.value = true
      const response = await apiSearchNotes(trimmed, params)
      searchResults.value = response.notes
      logger.debug(ctx, '[NoteStore] 搜索笔记成功', { keyword: trimmed, count: response.notes.length })
      return response.notes
    } catch (error) {
      logger.error(ctx, '[NoteStore] 搜索笔记失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchNotesByBook = async (bookId: number, params: Omit<NoteListParams, 'bookId'> = {}): Promise<NoteListResponse> => {
    const ctx = createContext()
    try {
      loading.value = true
      const response = await getNotesByBook(bookId, {
        page: currentPage.value,
        pageSize: pageSize.value,
        ...params
      })
      notes.value = response.notes
      total.value = response.total
      hasMore.value = response.hasMore
      logger.debug(ctx, '[NoteStore] 按书籍获取笔记成功', { bookId })
      return response
    } catch (error) {
      logger.error(ctx, '[NoteStore] 按书籍获取笔记失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const clearSearch = () => {
    searchKeyword.value = ''
    searchResults.value = []
  }

  const reset = () => {
    notes.value = []
    currentNote.value = null
    currentPage.value = 1
    total.value = 0
    hasMore.value = true
    loading.value = false
    searchKeyword.value = ''
    searchResults.value = []
    syncStatus.value = 'idle'
    lastSyncTime.value = ''
    lastParams.value = {}
  }

  const syncNotes = async (): Promise<void> => {
    const ctx = createContext()
    try {
      syncStatus.value = 'syncing'
      await fetchNotes(1, lastParams.value)
      lastSyncTime.value = new Date().toISOString()
      syncStatus.value = 'success'
      logger.info(ctx, '[NoteStore] 同步笔记成功')
    } catch (error) {
      syncStatus.value = 'error'
      logger.error(ctx, '[NoteStore] 同步笔记失败', error)
      throw error
    }
  }

  return {
    notes,
    currentNote,
    currentPage,
    pageSize,
    total,
    hasMore,
    loading,
    searchKeyword,
    searchResults,
    syncStatus,
    lastSyncTime,
    fetchNotes,
    fetchNoteDetail,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    fetchNotesByBook,
    clearSearch,
    syncNotes,
    reset
  }
})

export type NoteStore = ReturnType<typeof useNoteStore>
