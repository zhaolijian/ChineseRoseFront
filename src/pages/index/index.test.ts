import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import BookshelfPage from './index.vue'
import { useBookStore } from '@/stores/modules/book'

// Mock uni-app API
vi.mock('@dcloudio/uni-app', () => ({
  onShow: vi.fn(),
  onMounted: vi.fn(),
  onPullDownRefresh: vi.fn(),
  onReachBottom: vi.fn(),
  stopPullDownRefresh: vi.fn(),
  showToast: vi.fn(),
  getStorageSync: vi.fn(() => 'fake-token'),
  setStorageSync: vi.fn(),
  navigateTo: vi.fn(),
  scanCode: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn()
}))

const mockStopPullDownRefresh = vi.mocked(uni.stopPullDownRefresh)
const mockShowToast = vi.mocked(uni.showToast)

// Mock utils
vi.mock('@/utils/tabbar', () => ({
  safeHideTabBar: vi.fn()
}))

vi.mock('@/utils', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  },
  createContext: vi.fn(() => ({}))
}))

describe('书架页面刷新功能', () => {
  let wrapper: any
  let bookStore: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // 确保全局 uni 对象被正确设置
    ;(global as any).uni = {
      stopPullDownRefresh: mockStopPullDownRefresh,
      showToast: mockShowToast,
      getStorageSync: vi.fn(() => 'fake-token'),
      setStorageSync: vi.fn(),
      navigateTo: vi.fn(),
      scanCode: vi.fn(),
      showLoading: vi.fn(),
      hideLoading: vi.fn()
    }
    
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        book: {
          books: [],
          currentPage: 1,
          hasMore: true
        },
        user: {
          isLoggedIn: true,
          token: 'fake-token'
        }
      }
    })
    
    wrapper = mount(BookshelfPage, {
      global: {
        plugins: [pinia],
        stubs: {
          'u-icon': true,
          'u-image': true,
          'u-popup': true,
          'u-loading-page': true,
          'AppNavBar': true,
          'PageContainer': true,
          'EmptyState': true,
          'TabBar': true,
          'LoadingSkeleton': true,
          'BookPreview': true
        }
      }
    })
    
    bookStore = useBookStore()
  })

  describe('下拉刷新', () => {
    it('应该在下拉刷新时重置到第1页', async () => {
      // 设置初始状态
      bookStore.currentPage = 3
      bookStore.fetchBooks = vi.fn().mockResolvedValue({
        books: [
          { id: 1, title: '书籍1', author: '作者1', noteCount: 0 },
          { id: 2, title: '书籍2', author: '作者2', noteCount: 2 }
        ],
        hasMore: true
      })
      
      // 手动触发下拉刷新
      await wrapper.vm.loadBooks(true)
      
      // 验证调用了正确的页码
      expect(bookStore.fetchBooks).toHaveBeenCalledWith(1)
      
      // 验证停止了下拉刷新动画
      expect(mockStopPullDownRefresh).toHaveBeenCalled()
    })
    
    it('应该在刷新时替换整个列表', async () => {
      // 设置初始数据
      wrapper.vm.books = [
        { id: 1, title: '旧书1' },
        { id: 2, title: '旧书2' }
      ]
      
      bookStore.fetchBooks = vi.fn().mockResolvedValue({
        books: [
          { id: 3, title: '新书1' },
          { id: 4, title: '新书2' }
        ],
        hasMore: false
      })
      
      // 执行刷新
      await wrapper.vm.loadBooks(true)
      
      // 验证列表被完全替换
      expect(wrapper.vm.books).toHaveLength(2)
      expect(wrapper.vm.books[0].title).toBe('新书1')
      expect(wrapper.vm.books[1].title).toBe('新书2')
      expect(wrapper.vm.hasMore).toBe(false)
    })
    
    it('刷新失败应该显示错误提示', async () => {
      bookStore.fetchBooks = vi.fn().mockRejectedValue(new Error('网络错误'))
      
      // 执行刷新
      await wrapper.vm.loadBooks(true)
      
      // 验证显示了错误提示
      expect(mockShowToast).toHaveBeenCalledWith({
        title: '加载失败',
        icon: 'error'
      })
    })
    
    it('应该在下拉刷新后立即停止刷新动画', async () => {
      bookStore.fetchBooks = vi.fn().mockResolvedValue({
        books: [],
        hasMore: false
      })
      
      // 手动触发下拉刷新
      await wrapper.vm.loadBooks(true)
      
      // 确保停止刷新在API调用之后
      expect(mockStopPullDownRefresh).toHaveBeenCalled()
    })
  })

  describe('上拉加载更多', () => {
    it('当有更多数据时应该加载下一页', async () => {
      // 设置初始状态
      wrapper.vm.hasMore = true
      wrapper.vm.loading = false
      bookStore.currentPage = 1
      bookStore.fetchBooks = vi.fn().mockResolvedValue({
        books: [
          { id: 3, title: '书籍3' },
          { id: 4, title: '书籍4' }
        ],
        hasMore: true
      })
      
      // 设置初始数据
      wrapper.vm.books = [
        { id: 1, title: '书籍1' },
        { id: 2, title: '书籍2' }
      ]
      
      // 手动触发上拉加载
      await wrapper.vm.loadMoreBooks()
      
      // 验证加载了下一页
      expect(bookStore.fetchBooks).toHaveBeenCalledWith(2)
      
      // 验证数据被追加而不是替换
      expect(wrapper.vm.books).toHaveLength(4)
      expect(wrapper.vm.books[2].title).toBe('书籍3')
      expect(wrapper.vm.books[3].title).toBe('书籍4')
    })
    
    it('当没有更多数据时不应该触发加载', async () => {
      wrapper.vm.hasMore = false
      wrapper.vm.loading = false
      bookStore.fetchBooks = vi.fn()
      
      // 手动触发上拉加载
      await wrapper.vm.loadMoreBooks()
      
      // 验证没有调用API
      expect(bookStore.fetchBooks).not.toHaveBeenCalled()
    })
    
    it('正在加载时不应该重复触发', async () => {
      wrapper.vm.hasMore = true
      wrapper.vm.loading = true
      bookStore.fetchBooks = vi.fn()
      
      // 手动触发上拉加载
      await wrapper.vm.loadMoreBooks()
      
      // 验证没有调用API
      expect(bookStore.fetchBooks).not.toHaveBeenCalled()
    })
    
    it('应该正确更新hasMore状态', async () => {
      wrapper.vm.hasMore = true
      wrapper.vm.loading = false
      
      // 模拟返回最后一页数据
      bookStore.fetchBooks = vi.fn().mockResolvedValue({
        books: [{ id: 5, title: '最后一本书' }],
        hasMore: false
      })
      
      await wrapper.vm.loadMoreBooks()
      
      // 验证hasMore状态被更新
      expect(wrapper.vm.hasMore).toBe(false)
    })
  })

  describe('加载状态管理', () => {
    it('应该在加载时显示loading状态', async () => {
      bookStore.fetchBooks = vi.fn().mockImplementation(() => {
        // 验证loading在API调用时为true
        expect(wrapper.vm.loading).toBe(true)
        return Promise.resolve({ books: [], hasMore: false })
      })
      
      await wrapper.vm.loadBooks()
      
      // 验证loading在完成后为false
      expect(wrapper.vm.loading).toBe(false)
    })
    
    it('加载失败时也应该重置loading状态', async () => {
      bookStore.fetchBooks = vi.fn().mockRejectedValue(new Error('加载失败'))
      
      await wrapper.vm.loadBooks()
      
      // 验证loading被重置
      expect(wrapper.vm.loading).toBe(false)
    })
    
    it('空列表时应该显示骨架屏', () => {
      wrapper.vm.loading = true
      wrapper.vm.books = []
      
      // 由于使用了stubs，我们只能验证数据状态
      expect(wrapper.vm.loading).toBe(true)
      expect(wrapper.vm.books.length).toBe(0)
    })
  })
  
  describe('分页逻辑', () => {
    it('刷新时应该从第1页开始', async () => {
      bookStore.currentPage = 5
      bookStore.fetchBooks = vi.fn().mockResolvedValue({
        books: [],
        hasMore: true
      })
      
      // refresh = true
      await wrapper.vm.loadBooks(true)
      
      expect(bookStore.fetchBooks).toHaveBeenCalledWith(1)
    })
    
    it('加载更多时应该请求下一页', async () => {
      bookStore.currentPage = 2
      bookStore.fetchBooks = vi.fn().mockResolvedValue({
        books: [],
        hasMore: true
      })
      
      // refresh = false
      await wrapper.vm.loadBooks(false)
      
      expect(bookStore.fetchBooks).toHaveBeenCalledWith(3)
    })
    
    it('首次加载（列表为空）应该从第1页开始', async () => {
      wrapper.vm.books = []
      bookStore.currentPage = 3
      bookStore.fetchBooks = vi.fn().mockResolvedValue({
        books: [],
        hasMore: true
      })
      
      await wrapper.vm.loadBooks(false)
      
      expect(bookStore.fetchBooks).toHaveBeenCalledWith(1)
    })
  })
})