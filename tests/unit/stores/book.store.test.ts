import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBookStore } from '@/stores/modules/book'
import * as request from '@/utils/request'

// Mock request module
vi.mock('@/utils/request', () => ({
  request: vi.fn()
}))

describe('Book Store', () => {
  let store: ReturnType<typeof useBookStore>

  beforeEach(() => {
    // 创建新的 pinia 实例
    setActivePinia(createPinia())
    store = useBookStore()
    
    // 清除所有mock
    vi.clearAllMocks()
  })

  describe('State Management', () => {
    it('应该正确初始化状态', () => {
      expect(store.books).toEqual([])
      expect(store.currentBook).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.currentPage).toBe(1)
      expect(store.pageSize).toBe(20)
      expect(store.total).toBe(0)
      expect(store.hasMore).toBe(true)
    })

    it('应该正确计算书籍数量', () => {
      store.books = [
        { id: 1, title: 'Book 1' },
        { id: 2, title: 'Book 2' }
      ] as any
      expect(store.bookCount).toBe(2)
    })

    it('应该正确过滤不同状态的书籍', () => {
      store.books = [
        { id: 1, title: 'Reading 1', status: 'reading' },
        { id: 2, title: 'Reading 2', status: 'reading' },
        { id: 3, title: 'Finished 1', status: 'finished' },
        { id: 4, title: 'Wishlist 1', status: 'wishlist' }
      ] as any

      expect(store.readingBooks).toHaveLength(2)
      expect(store.finishedBooks).toHaveLength(1)
      expect(store.wishlistBooks).toHaveLength(1)
    })
  })

  describe('fetchBooks', () => {
    const mockResponse = {
      books: [
        { id: 1, title: 'Book 1', author: 'Author 1' },
        { id: 2, title: 'Book 2', author: 'Author 2' }
      ],
      total: 10,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      hasMore: false
    }

    it('应该获取书籍列表', async () => {
      vi.mocked(request.request).mockResolvedValueOnce(mockResponse)

      const result = await store.fetchBooks()

      expect(request.request).toHaveBeenCalledWith({
        url: '/v1/books',
        method: 'GET',
        data: { page: 1, limit: 20 }
      })

      expect(result).toMatchObject({
        ...mockResponse,
        pagination: expect.objectContaining({
          page: 1,
          limit: 20
        })
      })
      expect(store.books).toEqual(mockResponse.books)
      expect(store.total).toBe(10)
      expect(store.hasMore).toBe(false)
    })

    it('应该在第一页时替换数据', async () => {
      store.books = [{ id: 999, title: 'Old Book' }] as any
      vi.mocked(request.request).mockResolvedValueOnce(mockResponse)

      await store.fetchBooks(1)

      expect(store.books).toEqual(mockResponse.books)
      expect(store.books).not.toContainEqual({ id: 999, title: 'Old Book' })
    })

    it('应该在后续页面追加数据', async () => {
      store.books = [{ id: 1, title: 'Existing Book' }] as any
      vi.mocked(request.request).mockResolvedValueOnce(mockResponse)

      await store.fetchBooks(2)

      expect(store.books).toHaveLength(3)
      expect(store.books[0]).toEqual({ id: 1, title: 'Existing Book' })
    })

    it('应该处理请求错误', async () => {
      const error = new Error('Network error')
      vi.mocked(request.request).mockRejectedValueOnce(error)

      await expect(store.fetchBooks()).rejects.toThrow('Network error')
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchBookDetail', () => {
    const mockBook = {
      id: 1,
      title: 'Test Book',
      author: 'Test Author',
      isbn: '1234567890'
    }

    it('应该获取书籍详情', async () => {
      vi.mocked(request.request).mockResolvedValueOnce(mockBook)

      const result = await store.fetchBookDetail(1)

      expect(request.request).toHaveBeenCalledWith({
        url: '/v1/books/1',
        method: 'GET'
      })

      expect(result).toEqual(mockBook)
      expect(store.currentBook).toEqual(mockBook)
    })

    it('应该更新列表中的书籍', async () => {
      store.books = [
        { id: 1, title: 'Old Title' },
        { id: 2, title: 'Book 2' }
      ] as any
      vi.mocked(request.request).mockResolvedValueOnce(mockBook)

      await store.fetchBookDetail(1)

      expect(store.books[0]).toEqual(mockBook)
      expect(store.books[1]).toEqual({ id: 2, title: 'Book 2' })
    })

    it('应该处理书籍不存在的情况', async () => {
      vi.mocked(request.request).mockResolvedValueOnce(null)

      await expect(store.fetchBookDetail(999)).rejects.toThrow('获取书籍详情失败')
    })
  })

  describe('createBook', () => {
    const createParams = {
      title: 'New Book',
      author: 'New Author'
    }

    const mockNewBook = {
      id: 3,
      ...createParams,
      createdAt: '2025-09-01'
    }

    it('应该创建新书籍', async () => {
      vi.mocked(request.request).mockResolvedValueOnce(mockNewBook)

      const result = await store.createBook(createParams)

      expect(request.request).toHaveBeenCalledWith({
        url: '/v1/books',
        method: 'POST',
        data: createParams
      })

      expect(result).toEqual(mockNewBook)
      expect(store.books[0]).toEqual(mockNewBook)
      expect(store.total).toBe(1)
    })

    it('应该将新书籍添加到列表开头', async () => {
      store.books = [{ id: 1, title: 'Existing Book' }] as any
      store.total = 1
      vi.mocked(request.request).mockResolvedValueOnce(mockNewBook)

      await store.createBook(createParams)

      expect(store.books).toHaveLength(2)
      expect(store.books[0]).toEqual(mockNewBook)
      expect(store.books[1]).toEqual({ id: 1, title: 'Existing Book' })
      expect(store.total).toBe(2)
    })
  })

  describe('updateBook', () => {
    const updateParams = {
      id: 1,
      title: 'Updated Title',
      author: 'Updated Author'
    }

    const mockUpdatedBook = {
      ...updateParams,
      updatedAt: '2025-09-01'
    }

    it('应该更新书籍', async () => {
      vi.mocked(request.request).mockResolvedValueOnce(mockUpdatedBook)

      const result = await store.updateBook(updateParams)

      expect(request.request).toHaveBeenCalledWith({
        url: '/v1/books/1',
        method: 'PUT',
        data: {
          title: 'Updated Title',
          author: 'Updated Author'
        }
      })

      expect(result).toEqual(mockUpdatedBook)
    })

    it('应该更新列表和当前书籍', async () => {
      store.books = [
        { id: 1, title: 'Old Title' },
        { id: 2, title: 'Book 2' }
      ] as any
      store.currentBook = { id: 1, title: 'Old Title' } as any

      vi.mocked(request.request).mockResolvedValueOnce(mockUpdatedBook)

      await store.updateBook(updateParams)

      expect(store.books[0]).toEqual(mockUpdatedBook)
      expect(store.currentBook).toEqual(mockUpdatedBook)
    })
  })

  describe('deleteBook', () => {
    it('应该删除书籍', async () => {
      store.books = [
        { id: 1, title: 'Book 1' },
        { id: 2, title: 'Book 2' }
      ] as any
      store.total = 2
      store.currentBook = { id: 1, title: 'Book 1' } as any

      vi.mocked(request.request).mockResolvedValueOnce({})

      await store.deleteBook(1)

      expect(request.request).toHaveBeenCalledWith({
        url: '/v1/books/1',
        method: 'DELETE'
      })

      expect(store.books).toHaveLength(1)
      expect(store.books[0]).toEqual({ id: 2, title: 'Book 2' })
      expect(store.total).toBe(1)
      expect(store.currentBook).toBeNull()
    })
  })

  describe('searchBooks', () => {
    it('应该搜索书籍', async () => {
      const mockResponse = {
        books: [{ id: 1, title: 'Search Result' }],
        total: 1,
        hasMore: false
      }

      vi.mocked(request.request).mockResolvedValueOnce(mockResponse)

      const result = await store.searchBooks('test')

      expect(request.request).toHaveBeenCalledWith({
        url: '/v1/books',
        method: 'GET',
        data: {
          keyword: 'test',
          page: 1,
          limit: 20
        }
      })

      expect(result).toMatchObject({
        ...mockResponse,
        pagination: expect.objectContaining({
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        })
      })
    })
  })

  describe('updateReadingProgress', () => {
    it('应该更新阅读进度', async () => {
      const mockUpdatedBook = {
        id: 1,
        title: 'Book',
        progress: 75
      }

      vi.mocked(request.request).mockResolvedValueOnce(mockUpdatedBook)

      const result = await store.updateReadingProgress(1, 75)

      expect(request.request).toHaveBeenCalledWith({
        url: '/v1/books/1',
        method: 'PUT',
        data: { progress: 75 }
      })

      expect(result).toEqual(mockUpdatedBook)
    })
  })

  describe('batchDeleteBooks', () => {
    it('应该批量删除书籍', async () => {
      store.books = [
        { id: 1, title: 'Book 1' },
        { id: 2, title: 'Book 2' },
        { id: 3, title: 'Book 3' }
      ] as any
      store.total = 3

      vi.mocked(request.request).mockResolvedValueOnce({})

      await store.batchDeleteBooks([1, 3])

      expect(request.request).toHaveBeenCalledWith({
        url: '/v1/books/batch-delete',
        method: 'POST',
        data: { ids: [1, 3] }
      })

      expect(store.books).toHaveLength(1)
      expect(store.books[0]).toEqual({ id: 2, title: 'Book 2' })
      expect(store.total).toBe(1)
    })
  })

  describe('resetState', () => {
    it('应该重置所有状态', () => {
      // 设置一些状态
      store.books = [{ id: 1, title: 'Book' }] as any
      store.currentBook = { id: 1, title: 'Book' } as any
      store.loading = true
      store.currentPage = 5
      store.total = 100
      store.hasMore = false

      // 重置
      store.resetState()

      // 验证所有状态已重置
      expect(store.books).toEqual([])
      expect(store.currentBook).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.currentPage).toBe(1)
      expect(store.total).toBe(0)
      expect(store.hasMore).toBe(true)
    })
  })
})
