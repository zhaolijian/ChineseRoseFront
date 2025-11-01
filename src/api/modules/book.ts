import request from '@/utils/request'

// 书籍信息 - 基于架构文档的表结构
export interface BookResponse {
  id: number
  title: string
  author?: string
  isbn?: string
  publisher?: string
  publishDate?: string
  coverUrl?: string
  coverColor?: string
  pages?: number
  totalNotes?: number
  noteCount?: number
  chapters?: number
  description?: string
  progress?: number
  status?: 'reading' | 'finished' | 'wishlist'
  source?: 'isbn_api' | 'manual'
  createdAt?: string
  updatedAt?: string
}

// 兼容旧的命名导出
export type Book = BookResponse

// 书籍列表查询参数
export interface BookListParams {
  page?: number
  limit?: number
  pageSize?: number // 兼容旧参数，优先级低于 limit
  keyword?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'totalNotes'
  sortOrder?: 'asc' | 'desc'
}

// 书籍列表响应 - 匹配后端响应结构
export interface BookListResponse {
  books: BookResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  hasMore?: boolean
}

// 创建书籍参数
export interface CreateBookData {
  title: string
  author?: string
  isbn?: string
  publisher?: string
  publishDate?: string
  // 预签名直传：优先传递coverKey，由后端最终化写回coverUrl；兼容旧coverUrl传参
  coverKey?: string
  coverUrl?: string
  pages?: number
  source?: 'isbn_api' | 'manual'
  description?: string
  status?: 'reading' | 'finished' | 'wishlist'
}

// 更新书籍参数
export interface UpdateBookRequest {
  title?: string
  author?: string
  isbn?: string
  publisher?: string
  publishDate?: string
  coverKey?: string
  coverUrl?: string
  pages?: number
  source?: 'isbn_api' | 'manual'
  description?: string
  status?: 'reading' | 'finished' | 'wishlist'
  progress?: number
}

/**
 * 获取书籍列表
 */
export const getBookList = (params: BookListParams = {}): Promise<BookListResponse> => {
  const normalizedParams: Record<string, any> = { ...params }

  if (typeof params.pageSize !== 'undefined' && typeof normalizedParams.limit === 'undefined') {
    normalizedParams.limit = params.pageSize
  }
  delete normalizedParams.pageSize

  return request.get<BookListResponse>('/v1/books', normalizedParams)
}

/**
 * 获取书籍详情
 */
export const getBookDetail = (id: number): Promise<BookResponse> => {
  return request.get<BookResponse>(`/v1/books/${id}`)
}

/**
 * 创建书籍
 */
export const createBook = (data: CreateBookData): Promise<BookResponse> => {
  return request.post<BookResponse>('/v1/books', data)
}

/**
 * 更新书籍信息
 */
export const updateBook = (id: number, data: UpdateBookRequest): Promise<BookResponse> => {
  return request.put<BookResponse>(`/v1/books/${id}`, data)
}

/**
 * 删除书籍
 */
export const deleteBook = (id: number): Promise<void> => {
  return request.delete(`/v1/books/${id}`)
}

/**
 * 通过ISBN查询书籍信息
 */
export const searchBookByISBN = (isbn: string, config?: { showLoading?: boolean }): Promise<BookResponse> => {
  // 后端契约：GET /api/v1/books/isbn?isbn=xxx
  return request.get<BookResponse>('/v1/books/isbn', { isbn }, config)
}

/**
 * 搜索书籍
 */
export const searchBooks = (keyword: string): Promise<BookListResponse> => {
  return request.get<BookListResponse>('/v1/books/search', { keyword })
}

/**
 * 获取书籍章节列表
 */
export interface Chapter {
  id: number
  title: string
  orderNum?: number | null
  createdAt?: string
  updatedAt?: string
}

export interface ChapterListResponse {
  chapters: Chapter[]
}

export const getBookChapters = (bookId: number): Promise<ChapterListResponse> => {
  return request.get<ChapterListResponse>(`/v1/books/${bookId}/chapters`)
}
