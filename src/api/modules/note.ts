import request from '@/utils/request'

// 笔记信息 - 基于架构文档的表结构
export interface Note {
  id: number
  title: string
  content: string
  bookId?: number
  bookTitle?: string  // 来自联表查询，用于显示
  pageNumber?: number
  chapter?: string
  createdAt?: string
  updatedAt?: string
}

// 笔记列表查询参数
export interface NoteListParams {
  page?: number
  pageSize?: number
  keyword?: string
  bookId?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

// 笔记列表响应
export interface NoteListResponse {
  notes: Note[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// 创建笔记参数
export interface CreateNoteData {
  title: string
  content: string
  bookId?: number
  pageNumber?: number
  chapter?: string
}

// 更新笔记参数
export interface UpdateNoteData {
  title?: string
  content?: string
  bookId?: number
  pageNumber?: number
  chapter?: string
}

/**
 * 获取笔记列表
 */
export const getNoteList = (params: NoteListParams = {}): Promise<NoteListResponse> => {
  return request.get<NoteListResponse>('/v1/notes', params)
}

/**
 * 获取笔记详情
 */
export const getNoteDetail = (id: number): Promise<Note> => {
  return request.get<Note>(`/v1/notes/${id}`)
}

/**
 * 创建笔记
 */
export const createNote = (data: CreateNoteData): Promise<Note> => {
  return request.post<Note>('/v1/notes', data)
}

/**
 * 更新笔记
 */
export const updateNote = (id: number, data: UpdateNoteData): Promise<Note> => {
  return request.put<Note>(`/v1/notes/${id}`, data)
}

/**
 * 删除笔记（软删除）
 */
export const deleteNote = (id: number): Promise<void> => {
  return request.delete(`/v1/notes/${id}`)
}

/**
 * 根据书籍获取笔记
 */
export const getNotesByBook = (bookId: number, params: Omit<NoteListParams, 'bookId'> = {}): Promise<NoteListResponse> => {
  return request.get<NoteListResponse>(`/v1/books/${bookId}/notes`, params)
}

/**
 * 搜索笔记
 */
export const searchNotes = (keyword: string, params: Omit<NoteListParams, 'keyword'> = {}): Promise<NoteListResponse> => {
  return request.get<NoteListResponse>('/v1/notes/search', { keyword, ...params })
}

/**
 * 导出笔记
 */
export const exportNotes = (bookId?: number, format: 'markdown' | 'pdf' | 'word' = 'markdown'): Promise<{ url: string }> => {
  const params = bookId ? { bookId, format } : { format }
  return request.get<{ url: string }>('/v1/notes/export', params)
}
