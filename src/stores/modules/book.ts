import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { request } from '@/utils/request'

// 类型定义
export interface Book {
  id: number
  title: string
  author?: string
  isbn?: string
  publisher?: string
  publishDate?: string
  coverUrl?: string
  description?: string
  noteCount?: number
  status?: 'reading' | 'finished' | 'wishlist'
  progress?: number
  tags?: string[]
  pages?: number
  publishYear?: number
  createdAt?: string
  updatedAt?: string
}

export interface CreateBookParams {
  title: string
  author?: string
  isbn?: string
  publisher?: string
  publishDate?: string
  coverUrl?: string
  description?: string
  status?: 'reading' | 'finished' | 'wishlist'
  pages?: number
  publishYear?: number
}

export interface UpdateBookParams extends Partial<CreateBookParams> {
  id: number
}

export interface BookListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: 'reading' | 'finished' | 'wishlist'
  sortBy?: 'createdAt' | 'updatedAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export interface BookListResponse {
  books: Book[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasMore: boolean
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}

export const useBookStore = defineStore('book', () => {
  // 状态
  const books = ref<Book[]>([])
  const currentBook = ref<Book | null>(null)
  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const hasMore = ref(true)
  
  // 计算属性
  const bookCount = computed(() => books.value.length)
  
  const readingBooks = computed(() => 
    books.value.filter(book => book.status === 'reading')
  )
  
  const finishedBooks = computed(() => 
    books.value.filter(book => book.status === 'finished')
  )
  
  const wishlistBooks = computed(() => 
    books.value.filter(book => book.status === 'wishlist')
  )
  
  // 获取书籍列表
  const fetchBooks = async (page = 1, params: BookListParams = {}): Promise<BookListResponse> => {
    try {
      loading.value = true
      
      const queryParams = {
        page,
        pageSize: pageSize.value,
        ...params
      }
      
      const result = await request<BookListResponse>({
        url: '/v1/books',
        method: 'GET',
        data: queryParams
      })
      
      if (result as any) {
        const resultTyped = result as BookListResponse
        
        // 如果是第一页，替换数据；否则追加数据
        if (page === 1) {
          books.value = resultTyped.books
        } else {
          books.value.push(...resultTyped.books)
        }
        
        currentPage.value = page
        total.value = resultTyped.total
        hasMore.value = resultTyped.hasMore
        
        return resultTyped
      }
    } catch (error: any) {
      console.error('获取书籍列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  // 获取书籍详情
  const fetchBookDetail = async (id: number): Promise<Book> => {
    try {
      const data = await request<Book>({
        url: `/v1/books/${id}`,
        method: 'GET'
      })
      if (data) {
        currentBook.value = data
        
        // 更新列表中的对应书籍
        const index = books.value.findIndex(book => book.id === id)
        if (index !== -1) books.value[index] = data
        return data
      }
      throw new Error('获取书籍详情失败')
    } catch (error: any) {
      console.error('获取书籍详情失败:', error)
      throw error
    }
  }
  
  // 创建书籍
  const createBook = async (params: CreateBookParams): Promise<Book> => {
    try {
      const data = await request<Book>({
        url: '/v1/books',
        method: 'POST',
        data: params
      })
      if (data) {
        const newBook = data
        
        // 添加到列表开头
        books.value.unshift(newBook)
        total.value++
        
        return newBook
      }
      throw new Error('创建书籍失败')
    } catch (error: any) {
      console.error('创建书籍失败:', error)
      throw error
    }
  }
  
  // 更新书籍
  const updateBook = async (params: UpdateBookParams): Promise<Book> => {
    try {
      const { id, ...updateData } = params
      
      const data = await request<Book>({
        url: `/v1/books/${id}`,
        method: 'PUT',
        data: updateData
      })
      
      if (data) {
        const updatedBook = data
        
        // 更新列表中的书籍
        const index = books.value.findIndex(book => book.id === id)
        if (index !== -1) {
          books.value[index] = updatedBook
        }
        
        // 更新当前书籍
        if (currentBook.value?.id === id) currentBook.value = updatedBook
        return updatedBook
      }
      throw new Error('更新书籍失败')
    } catch (error: any) {
      console.error('更新书籍失败:', error)
      throw error
    }
  }
  
  // 删除书籍
  const deleteBook = async (id: number): Promise<void> => {
    try {
      const data = await request<unknown>({
        url: `/v1/books/${id}`,
        method: 'DELETE'
      })
      
      if (data !== undefined) {
        // 从列表中移除
        const index = books.value.findIndex(book => book.id === id)
        if (index !== -1) {
          books.value.splice(index, 1)
          total.value--
        }
        
        // 清除当前书籍
        if (currentBook.value?.id === id) {
          currentBook.value = null
        }
      }
    } catch (error: any) {
      console.error('删除书籍失败:', error)
      throw error
    }
  }
  
  // 搜索书籍
  const searchBooks = async (keyword: string, page = 1): Promise<BookListResponse> => {
    return await fetchBooks(page, { keyword, page, pageSize: pageSize.value })
  }
  
  // 按状态筛选书籍
  const filterBooksByStatus = async (status: 'reading' | 'finished' | 'wishlist', page = 1): Promise<BookListResponse> => {
    return await fetchBooks(page, { status, page, pageSize: pageSize.value })
  }
  
  // 通过ISBN获取书籍信息
  const fetchBookByISBN = async (isbn: string): Promise<Book | null> => {
    try {
      const data = await request<Book>({
        url: `/v1/books/isbn`,
        method: 'GET',
        params: { isbn }
      })
      return data || null
    } catch (error: any) {
      console.error('通过ISBN获取书籍信息失败:', error)
      return null
    }
  }
  
  // 更新阅读进度
  const updateReadingProgress = async (id: number, progress: number): Promise<Book> => {
    return await updateBook({ id, progress })
  }
  
  // 更新阅读状态
  const updateReadingStatus = async (id: number, status: 'reading' | 'finished' | 'wishlist'): Promise<Book> => {
    return await updateBook({ id, status })
  }
  
  // 批量删除书籍
  const batchDeleteBooks = async (ids: number[]): Promise<void> => {
    try {
      const data = await request<unknown>({
        url: '/v1/books/batch-delete',
        method: 'POST',
        data: { ids }
      })
      
      if (data !== undefined) {
        // 从列表中移除删除的书籍
        books.value = books.value.filter(book => !ids.includes(book.id))
        total.value -= ids.length
      }
    } catch (error: any) {
      console.error('批量删除书籍失败:', error)
      throw error
    }
  }
  
  // 重置状态
  const resetState = () => {
    books.value = []
    currentBook.value = null
    loading.value = false
    currentPage.value = 1
    total.value = 0
    hasMore.value = true
  }
  
  // 设置当前书籍
  const setCurrentBook = (book: Book | null) => {
    currentBook.value = book
  }
  
  return {
    // 状态
    books,
    currentBook,
    loading,
    currentPage,
    pageSize,
    total,
    hasMore,
    
    // 计算属性
    bookCount,
    readingBooks,
    finishedBooks,
    wishlistBooks,
    
    // 方法
    fetchBooks,
    fetchBookDetail,
    createBook,
    updateBook,
    deleteBook,
    searchBooks,
    filterBooksByStatus,
    fetchBookByISBN,
    updateReadingProgress,
    updateReadingStatus,
    batchDeleteBooks,
    resetState,
    setCurrentBook
  }
})
