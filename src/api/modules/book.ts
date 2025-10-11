import request from '@/utils/request'

// 书籍信息 - 基于架构文档的表结构
export interface Book {
  id: number
  title: string
  author?: string
  isbn?: string
  publisher?: string
  publishDate?: string
  coverUrl?: string
  totalNotes?: number
  source?: 'isbn_api' | 'manual'
  createdAt?: string
  updatedAt?: string
}

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
  books: Book[]
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
  coverUrl?: string
  source?: 'isbn_api' | 'manual'
}

// 更新书籍参数
export interface UpdateBookData {
  title?: string
  author?: string
  isbn?: string
  publisher?: string
  publishDate?: string
  coverUrl?: string
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
export const getBookDetail = (id: number): Promise<Book> => {
  return request.get<Book>(`/v1/books/${id}`)
}

/**
 * 创建书籍
 */
export const createBook = (data: CreateBookData): Promise<Book> => {
  return request.post<Book>('/v1/books', data)
}

/**
 * 更新书籍信息
 */
export const updateBook = (id: number, data: UpdateBookData): Promise<Book> => {
  return request.put<Book>(`/v1/books/${id}`, data)
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
export const searchBookByISBN = (isbn: string): Promise<Book> => {
  // 后端契约：GET /api/v1/books/isbn?isbn=xxx
  return request.get<Book>('/v1/books/isbn', { isbn })
}

/**
 * 搜索书籍
 */
export const searchBooks = (keyword: string): Promise<BookListResponse> => {
  return request.get<BookListResponse>('/v1/books/search', { keyword })
}
