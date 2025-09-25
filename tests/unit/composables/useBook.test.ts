import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useBook } from '@/composables/useBook'
import { useBookStore } from '@/stores/modules/book'

// Mock uni对象
global.uni = {
  showToast: vi.fn(),
  showLoading: vi.fn(), 
  hideLoading: vi.fn(),
  showModal: vi.fn(),
  navigateTo: vi.fn(),
  navigateBack: vi.fn()
} as any

const expectToastCalledWith = (options: Record<string, any>) => {
  expect((global as any).uni.showToast).toHaveBeenCalledWith(expect.objectContaining(options))
}

vi.mock('@/stores/modules/book')

describe('useBook', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('书籍列表管理', () => {
    it('应该加载书籍列表', async () => {
      const mockFetchBooks = vi.fn().mockResolvedValue({
        books: [
          { id: 1, title: 'Book 1' },
          { id: 2, title: 'Book 2' }
        ],
        hasMore: true
      })

      vi.mocked(useBookStore).mockReturnValue({
        fetchBooks: mockFetchBooks,
        books: ref([
          { id: 1, title: 'Book 1' },
          { id: 2, title: 'Book 2' }
        ]),
        loading: ref(false),
        hasMore: ref(true)
      } as any)

      const { loadBooks, books, loading } = useBook()

      expect(loading.value).toBe(false)
      
      const loadPromise = loadBooks()
      expect(loading.value).toBe(false) // store控制loading

      await loadPromise
      
      expect(mockFetchBooks).toHaveBeenCalledWith(1, {})
      expect(books.value).toHaveLength(2)
    })

    it('应该处理加载更多', async () => {
      const mockFetchBooks = vi.fn().mockResolvedValue({
        books: [{ id: 3, title: 'Book 3' }],
        hasMore: false
      })

      vi.mocked(useBookStore).mockReturnValue({
        fetchBooks: mockFetchBooks,
        books: ref([
          { id: 1, title: 'Book 1' },
          { id: 2, title: 'Book 2' }
        ]),
        loading: ref(false),
        hasMore: ref(true),
        currentPage: ref(1)
      } as any)

      const { loadMore } = useBook()

      await loadMore()

      expect(mockFetchBooks).toHaveBeenCalledWith(2, {})
    })

    it('应该在没有更多数据时不加载', async () => {
      const mockFetchBooks = vi.fn()

      vi.mocked(useBookStore).mockReturnValue({
        fetchBooks: mockFetchBooks,
        hasMore: ref(false)
      } as any)

      const { loadMore } = useBook()
      
      await loadMore()

      expect(mockFetchBooks).not.toHaveBeenCalled()
    })

    it('应该处理加载错误', async () => {
      const mockFetchBooks = vi.fn().mockRejectedValue(new Error('Network error'))

      vi.mocked(useBookStore).mockReturnValue({
        fetchBooks: mockFetchBooks,
        loading: ref(false)
      } as any)

      const { loadBooks } = useBook()

      await loadBooks()

      expectToastCalledWith({
        title: '加载失败，请重试',
        icon: 'none'
      })
    })
  })

  describe('书籍搜索', () => {
    it('应该搜索书籍', async () => {
      const mockSearchBooks = vi.fn().mockResolvedValue({
        books: [{ id: 1, title: 'Search Result' }]
      })

      vi.mocked(useBookStore).mockReturnValue({
        searchBooks: mockSearchBooks,
        loading: ref(false)
      } as any)

      const { searchBooks } = useBook()

      await searchBooks('test')

      expect(mockSearchBooks).toHaveBeenCalledWith('test', 1)
    })

    it('应该处理空搜索关键词', async () => {
      const mockFetchBooks = vi.fn()

      vi.mocked(useBookStore).mockReturnValue({
        fetchBooks: mockFetchBooks,
        loading: ref(false)
      } as any)

      const { searchBooks } = useBook()

      await searchBooks('')

      // 空关键词应该调用fetchBooks而不是searchBooks
      expect(mockFetchBooks).toHaveBeenCalledWith(1, {})
    })
  })

  describe('书籍创建', () => {
    it('应该创建书籍', async () => {
      const mockCreateBook = vi.fn().mockResolvedValue({
        id: 1,
        title: 'New Book',
        author: 'New Author'
      })

      vi.mocked(useBookStore).mockReturnValue({
        createBook: mockCreateBook
      } as any)

      const { createBook } = useBook()

      const result = await createBook({
        title: 'New Book',
        author: 'New Author'
      })

      expect(mockCreateBook).toHaveBeenCalledWith({
        title: 'New Book',
        author: 'New Author'
      })

      expect(result).toEqual({
        id: 1,
        title: 'New Book',
        author: 'New Author'
      })

      expectToastCalledWith({
        title: '创建成功',
        icon: 'success'
      })
    })

    it('应该处理创建错误', async () => {
      const mockCreateBook = vi.fn().mockRejectedValue(new Error('Create failed'))

      vi.mocked(useBookStore).mockReturnValue({
        createBook: mockCreateBook
      } as any)

      const { createBook } = useBook()

      await expect(createBook({
        title: 'New Book'
      })).rejects.toThrow('Create failed')

      expectToastCalledWith({
        title: '创建失败',
        icon: 'error'
      })
    })

    it('应该验证必填字段', async () => {
      const { createBook } = useBook()

      const result = await createBook({
        title: ''
      })

      expect(result).toBeNull()
      expectToastCalledWith({
        title: '请输入书名',
        icon: 'none'
      })
    })
  })

  describe('书籍更新', () => {
    it('应该更新书籍信息', async () => {
      const mockUpdateBook = vi.fn().mockResolvedValue({
        id: 1,
        title: 'Updated Title'
      })

      vi.mocked(useBookStore).mockReturnValue({
        updateBook: mockUpdateBook
      } as any)

      const { updateBook } = useBook()

      await updateBook({
        id: 1,
        title: 'Updated Title'
      })

      expect(mockUpdateBook).toHaveBeenCalledWith({
        id: 1,
        title: 'Updated Title'
      })

      expectToastCalledWith({
        title: '更新成功',
        icon: 'success'
      })
    })

    it('应该更新阅读进度', async () => {
      const mockUpdateProgress = vi.fn().mockResolvedValue({
        id: 1,
        progress: 50
      })

      vi.mocked(useBookStore).mockReturnValue({
        updateReadingProgress: mockUpdateProgress
      } as any)

      const { updateProgress } = useBook()

      await updateProgress(1, 50)

      expect(mockUpdateProgress).toHaveBeenCalledWith(1, 50)
    })

    it('应该验证进度范围', async () => {
      const { updateProgress } = useBook()

      await updateProgress(1, -1)
      expectToastCalledWith({
        title: '进度必须在0-100之间',
        icon: 'none'
      })

      await updateProgress(1, 101)
      expectToastCalledWith({
        title: '进度必须在0-100之间',
        icon: 'none'
      })
    })
  })

  describe('书籍删除', () => {
    it('应该删除单本书籍', async () => {
      const mockDeleteBook = vi.fn().mockResolvedValue(undefined)

      vi.mocked(useBookStore).mockReturnValue({
        deleteBook: mockDeleteBook
      } as any)

      vi.mocked(uni.showModal).mockResolvedValue({ confirm: true } as any)

      const { deleteBook } = useBook()

      await deleteBook(1, '测试书籍')

      expect(uni.showModal).toHaveBeenCalledWith({
        title: '确认删除',
        content: '确定要删除《测试书籍》吗？删除后相关笔记也将被删除，此操作不可恢复。',
        confirmText: '删除',
        confirmColor: '#ff4444'
      })

      expect(mockDeleteBook).toHaveBeenCalledWith(1)
      expectToastCalledWith({
        title: '删除成功',
        icon: 'success'
      })
    })

    it('应该在用户取消时不删除', async () => {
      const mockDeleteBook = vi.fn()

      vi.mocked(useBookStore).mockReturnValue({
        deleteBook: mockDeleteBook
      } as any)

      vi.mocked(uni.showModal).mockResolvedValue({ confirm: false } as any)

      const { deleteBook } = useBook()

      await deleteBook(1, '测试书籍')

      expect(mockDeleteBook).not.toHaveBeenCalled()
    })

    it('应该批量删除书籍', async () => {
      const mockBatchDelete = vi.fn().mockResolvedValue(undefined)

      vi.mocked(useBookStore).mockReturnValue({
        batchDeleteBooks: mockBatchDelete
      } as any)

      vi.mocked(uni.showModal).mockResolvedValue({ confirm: true } as any)

      const { batchDeleteBooks } = useBook()

      await batchDeleteBooks([1, 2, 3])

      expect(uni.showModal).toHaveBeenCalledWith({
        title: '确认删除',
        content: '确定要删除选中的3本书籍吗？删除后相关笔记也将被删除，此操作不可恢复。',
        confirmText: '删除',
        confirmColor: '#ff4444'
      })

      expect(mockBatchDelete).toHaveBeenCalledWith([1, 2, 3])
    })

    it('应该处理空选择', async () => {
      const { batchDeleteBooks } = useBook()

      await batchDeleteBooks([])

      expectToastCalledWith({
        title: '请选择要删除的书籍',
        icon: 'none'
      })
    })
  })

  describe('ISBN查询', () => {
    it('应该通过ISBN查询书籍', async () => {
      const mockFetchByISBN = vi.fn().mockResolvedValue({
        title: 'ISBN Book',
        author: 'ISBN Author',
        isbn: '1234567890'
      })

      vi.mocked(useBookStore).mockReturnValue({
        fetchBookByISBN: mockFetchByISBN
      } as any)

      const { fetchBookByISBN } = useBook()

      const result = await fetchBookByISBN('1234567890')

      expect(mockFetchByISBN).toHaveBeenCalledWith('1234567890')
      expect(result).toEqual({
        title: 'ISBN Book',
        author: 'ISBN Author',
        isbn: '1234567890'
      })
    })

    it('应该处理ISBN查询失败', async () => {
      const mockFetchByISBN = vi.fn().mockResolvedValue(null)

      vi.mocked(useBookStore).mockReturnValue({
        fetchBookByISBN: mockFetchByISBN
      } as any)

      const { fetchBookByISBN } = useBook()

      // 使用符合ISBN格式但不存在的ISBN
      const result = await fetchBookByISBN('9780123456789')

      expect(result).toBeNull()
      expectToastCalledWith({
        title: '未找到相关书籍信息',
        icon: 'none'
      })
    })

    it('应该验证ISBN格式', async () => {
      const { fetchBookByISBN } = useBook()

      const result = await fetchBookByISBN('')

      expect(result).toBeNull()
      expectToastCalledWith({
        title: '请输入有效的ISBN',
        icon: 'none'
      })
    })
  })

  describe('导航功能', () => {
    it('应该导航到书籍详情页', () => {
      const { goToBookDetail } = useBook()

      goToBookDetail(123)

      expect(uni.navigateTo).toHaveBeenCalledWith({
        url: '/pages-book/detail/detail?id=123'
      })
    })

    it('应该导航到添加书籍页', () => {
      const { goToAddBook } = useBook()

      goToAddBook()

      expect(uni.navigateTo).toHaveBeenCalledWith({
        url: '/pages-book/add/add'
      })
    })

    it('应该导航到编辑书籍页', () => {
      const { goToEditBook } = useBook()

      goToEditBook(456)

      expect(uni.navigateTo).toHaveBeenCalledWith({
        url: '/pages-book/edit/edit?id=456'
      })
    })
  })
})
