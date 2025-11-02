import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useBookStore, type BookListParams, type CreateBookParams, type UpdateBookParams } from '@/stores/modules/book'
import { logger, createContext } from '@/utils'
import { ISBN_REGEX } from '@/constants/validation'

interface ToastOptions {
  title: string
  icon?: 'success' | 'error' | 'none' | 'loading'
}

const showToast = (options: ToastOptions) => {
  uni.showToast({
    duration: 2000,
    icon: 'none',
    ...options
  })
}

export function useBook() {
  const bookStore = useBookStore()
  const { books, loading, hasMore, currentPage } = storeToRefs(bookStore)

  const latestParams = ref<BookListParams>({})
  const searchKeyword = ref('')

  const loadBooks = async (page = 1, params: BookListParams = {}) => {
    const ctx = createContext()
    try {
      latestParams.value = { ...params }
      await bookStore.fetchBooks(page, params)
      logger.info(ctx, '[useBook] 加载书籍列表成功', { page, params })
    } catch (error) {
      logger.error(ctx, '[useBook] 加载书籍列表失败', error)
      showToast({ title: '加载失败，请重试', icon: 'none' })
    }
  }

  const loadMore = async () => {
    if (!hasMore.value) {
      return
    }

    const nextPage = (currentPage.value || 1) + 1
    await loadBooks(nextPage, latestParams.value)
  }

  const refresh = async () => {
    await loadBooks(1, latestParams.value)
  }

  const searchBooks = async (keyword: string, page = 1) => {
    const ctx = createContext()
    const trimmed = keyword.trim()
    searchKeyword.value = trimmed

    if (!trimmed) {
      await loadBooks(1, {})
      return
    }

    try {
      await bookStore.searchBooks(trimmed, page)
      logger.info(ctx, '[useBook] 搜索书籍成功', { keyword: trimmed, page })
    } catch (error) {
      logger.error(ctx, '[useBook] 搜索书籍失败', error)
      showToast({ title: '搜索失败，请重试', icon: 'none' })
    }
  }

  const createBook = async (payload: CreateBookParams) => {
    const ctx = createContext()
    if (!payload.title?.trim()) {
      showToast({ title: '请输入书名', icon: 'none' })
      logger.warn(ctx, '[useBook] 创建书籍缺少书名')
      return null
    }

    try {
      const book = await bookStore.createBook(payload)
      showToast({ title: '创建成功', icon: 'success' })
      logger.info(ctx, '[useBook] 创建书籍成功', { id: book.id })
      return book
    } catch (error) {
      logger.error(ctx, '[useBook] 创建书籍失败', error)
      showToast({ title: '创建失败', icon: 'error' })
      throw error
    }
  }

  const updateBook = async (payload: UpdateBookParams) => {
    const ctx = createContext()
    try {
      const book = await bookStore.updateBook(payload)
      showToast({ title: '更新成功', icon: 'success' })
      logger.info(ctx, '[useBook] 更新书籍成功', { id: payload.id })
      return book
    } catch (error) {
      logger.error(ctx, '[useBook] 更新书籍失败', error)
      showToast({ title: '更新失败', icon: 'error' })
      throw error
    }
  }

  const updateProgress = async (bookId: number, progress: number) => {
    if (progress < 0 || progress > 100) {
      showToast({ title: '进度必须在0-100之间', icon: 'none' })
      return null
    }

    const ctx = createContext()
    try {
      const book = await bookStore.updateReadingProgress(bookId, progress)
      logger.info(ctx, '[useBook] 更新阅读进度成功', { bookId, progress })
      return book
    } catch (error) {
      logger.error(ctx, '[useBook] 更新阅读进度失败', error)
      showToast({ title: '更新失败，请重试', icon: 'none' })
      throw error
    }
  }

  const deleteBook = async (bookId: number, title?: string) => {
    const displayTitle = title ? `《${title}》` : '该书籍'
    const { confirm } = await uni.showModal({
      title: '确认删除',
      content: `确定要删除${displayTitle}吗？删除后相关笔记也将被删除，此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#ff4444'
    })

    if (!confirm) {
      return false
    }

    const ctx = createContext()
    try {
      await bookStore.deleteBook(bookId)
      showToast({ title: '删除成功', icon: 'success' })
      logger.info(ctx, '[useBook] 删除书籍成功', { bookId })
      return true
    } catch (error) {
      logger.error(ctx, '[useBook] 删除书籍失败', error)
      showToast({ title: '删除失败，请重试', icon: 'none' })
      throw error
    }
  }

  const batchDeleteBooks = async (ids: number[]) => {
    if (!ids.length) {
      showToast({ title: '请选择要删除的书籍', icon: 'none' })
      return false
    }

    const { confirm } = await uni.showModal({
      title: '确认删除',
      content: `确定要删除选中的${ids.length}本书籍吗？删除后相关笔记也将被删除，此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#ff4444'
    })

    if (!confirm) {
      return false
    }

    const ctx = createContext()
    try {
      await bookStore.batchDeleteBooks(ids)
      showToast({ title: '删除成功', icon: 'success' })
      logger.info(ctx, '[useBook] 批量删除书籍成功', { ids })
      return true
    } catch (error) {
      logger.error(ctx, '[useBook] 批量删除书籍失败', error)
      showToast({ title: '删除失败，请重试', icon: 'none' })
      throw error
    }
  }

  const fetchBookByISBN = async (isbn: string) => {
    const ctx = createContext()
    const trimmed = isbn.trim()
    if (!trimmed || !ISBN_REGEX.test(trimmed)) {
      showToast({ title: '请输入有效的ISBN', icon: 'none' })
      logger.warn(ctx, '[useBook] ISBN格式无效', { isbn })
      return null
    }

    try {
      const book = await bookStore.fetchBookByISBN(trimmed)
      if (!book) {
        showToast({ title: '未找到相关书籍信息', icon: 'none' })
      }
      return book
    } catch (error) {
      logger.error(ctx, '[useBook] 通过ISBN获取书籍失败', error)
      showToast({ title: '查询失败，请稍后重试', icon: 'none' })
      return null
    }
  }

  const goToBookDetail = (bookId: number) => {
    uni.navigateTo({
      url: `/pages-book/detail/index?id=${bookId}`
    })
  }

  const goToAddBook = () => {
    uni.navigateTo({
      url: '/pages/book/add-book'
    })
  }

  const goToEditBook = (bookId: number) => {
    uni.navigateTo({
      url: `/pages-book/edit/edit?id=${bookId}`
    })
  }

  const goBack = () => {
    uni.navigateBack()
  }

  const isEmpty = computed(() => !books.value.length && !loading.value)

  return {
    books,
    loading,
    hasMore,
    currentPage,
    searchKeyword,
    isEmpty,
    loadBooks,
    loadMore,
    refresh,
    searchBooks,
    createBook,
    updateBook,
    updateProgress,
    deleteBook,
    batchDeleteBooks,
    fetchBookByISBN,
    goToBookDetail,
    goToAddBook,
    goToEditBook,
    goBack
  }
}
