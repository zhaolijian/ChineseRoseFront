import request from '@/utils/request'
import { ErrorCode } from '@/types/errorCodes'

// 笔记信息 - 基于架构文档的表结构
export interface NoteResponse {
  id: number
  title: string
  content: string
  bookId?: number
  bookTitle?: string
  bookAuthor?: string
  noteType?: string
  tags?: string[]
  excerpt?: string
  hasImages?: boolean
  images?: string[]
  pageNumber?: number | null
  chapter?: string
  chapterName?: string | null
  createdAt?: string
  updatedAt?: string
}

// 兼容旧的命名导出
export type Note = NoteResponse

// 笔记列表查询参数
export interface NoteListParams {
  page?: number
  pageSize?: number
  keyword?: string
  bookId?: number
  noteType?: string
  hasImages?: boolean
  sortBy?: 'createdAt' | 'updatedAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

// 笔记列表响应 - 匹配后端响应结构
export interface NoteListResponse {
  list: NoteResponse[]  // 后端字段名为 list，不是 notes
  total: number
  page: number
  pageSize: number
  hasMore?: boolean  // 前端计算字段，可选
}

// 创建笔记参数
export interface CreateNoteData {
  title: string
  content: string
  bookId?: number
  noteType?: string
  tags?: string[]
  pageNumber?: number
  chapter?: string
}

// 更新笔记参数
export interface UpdateNoteData {
  title?: string
  content?: string
  bookId?: number
  noteType?: string
  tags?: string[]
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
export const getNoteDetail = (id: number): Promise<NoteResponse> => {
  return request.get<NoteResponse>(`/v1/notes/${id}`)
}

/**
 * 创建笔记
 */
export const createNote = (data: CreateNoteData): Promise<NoteResponse> => {
  return request.post<NoteResponse>('/v1/notes', data)
}

/**
 * 更新笔记
 */
export const updateNote = (id: number, data: UpdateNoteData): Promise<NoteResponse> => {
  return request.put<NoteResponse>(`/v1/notes/${id}`, data)
}

/**
 * 删除笔记（软删除）
 */
export const deleteNote = (id: number): Promise<void> => {
  return request.delete(`/v1/notes/${id}`)
}

/**
 * 获取书籍笔记列表
 */
export const getBookNotes = (
  bookId: number,
  params: {
    page?: number
    pageSize?: number
    [key: string]: any
  } = {}
) => {
  return request.get<{
    notes: NoteResponse[]
    total: number
  }>(`/v1/books/${bookId}/notes`, params, {
    showLoading: false,
    silenceBusinessErrorCodes: [ErrorCode.ERR_BAD_REQUEST, ErrorCode.ERR_NOT_FOUND]
  })
}

/**
 * 根据书籍获取笔记（兼容旧结构）
 */
export const getNotesByBook = async (
  bookId: number,
  params: Omit<NoteListParams, 'bookId'> = {}
): Promise<NoteListResponse> => {
  const { page = 1, pageSize = 20, ...rest } = params
  const response = await getBookNotes(bookId, { page, pageSize, ...rest })
  const notes = response.notes ?? []
  const total = response.total ?? notes.length
  const computedHasMore = page * pageSize < total

  return {
    list: notes,
    total,
    page,
    pageSize,
    hasMore: computedHasMore
  }
}

/**
 * 搜索笔记
 */
export const searchNotes = (keyword: string, params: Omit<NoteListParams, 'keyword'> = {}): Promise<NoteListResponse> => {
  return request.get<NoteListResponse>('/v1/notes', { keyword, ...params })
}

/**
 * 导出笔记
 */
export const exportNotes = (bookId?: number, format: 'markdown' | 'pdf' | 'word' = 'markdown'): Promise<{ url: string }> => {
  const params = bookId ? { bookId, format } : { format }
  return request.get<{ url: string }>('/v1/notes/export', params)
}
