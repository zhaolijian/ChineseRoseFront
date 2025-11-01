import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import BookshelfPage from '../index.vue'

vi.mock('@dcloudio/uni-app', () => ({
  onShow: vi.fn(),
  onPullDownRefresh: vi.fn(),
  onReachBottom: vi.fn()
}))

const bookStore = {
  fetchBooks: vi.fn(async () => ({ books: [], hasMore: false })),
  currentPage: 1
}

const userStore = {
  isLoggedIn: false
}

vi.mock('@/stores/modules/book', () => ({
  useBookStore: () => bookStore
}))

vi.mock('@/stores/modules/user', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/utils/tabbar', () => ({
  safeHideTabBar: vi.fn()
}))

vi.mock('@/utils', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  },
  createContext: vi.fn(() => ({}))
}))

vi.mock('@/api/modules/book', () => ({
  searchBookByISBN: vi.fn()
}))

const uniMock = {
  showToast: vi.fn(),
  stopPullDownRefresh: vi.fn(),
  navigateTo: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  scanCode: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({ windowWidth: 375, statusBarHeight: 20 })),
  getMenuButtonBoundingClientRect: vi.fn(() => ({ bottom: 60 }))
}

const createWrapper = () =>
  mount(BookshelfPage, {
    global: {
      stubs: {
        AppNavBar: {
          name: 'AppNavBar',
          template: '<div class="app-nav-bar"><slot /></div>'
        },
        PageContainer: {
          name: 'PageContainer',
          template: '<div class="page-container"><slot /></div>'
        },
        EmptyState: {
          name: 'EmptyState',
          template: '<div class="empty-state-stub"><slot /></div>'
        },
        TabBar: {
          name: 'TabBar',
          template: '<div class="tab-bar"></div>'
        },
        LoadingSkeleton: {
          name: 'LoadingSkeleton',
          template: '<div class="loading-skeleton"></div>'
        },
        BookPreview: {
          name: 'BookPreview',
          template: '<div class="book-preview"></div>'
        },
        'u-image': {
          name: 'u-image',
          props: ['src', 'mode', 'width', 'height', 'radius', 'loadingIcon'],
          template: '<img class="u-image-stub" />'
        },
        'u-popup': {
          name: 'u-popup',
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template: '<div class="u-popup-stub"><slot /></div>'
        },
        'u-loading-page': {
          name: 'u-loading-page',
          template: '<div class="u-loading-page"></div>'
        },
        'u-icon': {
          name: 'u-icon',
          props: ['name', 'size', 'color'],
          template: '<i class="u-icon" :data-name="name" :data-size="size" :data-color="color"></i>'
        }
      },
      mocks: {
        uni: uniMock
      }
    }
  })

describe('Bookshelf page design behaviour', () => {
  beforeEach(() => {
    userStore.isLoggedIn = false
    bookStore.fetchBooks.mockReset()
    bookStore.fetchBooks.mockImplementation(async () => ({ books: [], hasMore: false }))
    uniMock.showToast.mockClear()
    uniMock.navigateTo.mockClear()
    uniMock.getSystemInfoSync.mockClear()
    uniMock.getMenuButtonBoundingClientRect.mockClear()
  })

  it('shows login empty state when user is not logged in', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    expect(wrapper.find('.bookshelf-empty').exists()).toBe(true)
    expect(bookStore.fetchBooks).not.toHaveBeenCalled()
    const fab = wrapper.find('.bookshelf-fab')
    expect(fab.exists()).toBe(true)
    expect(fab.find('.fab-icon').text()).toBe('+')
  })

  it('renders book cards with tokenised classes when data is available', async () => {
    userStore.isLoggedIn = true
    bookStore.fetchBooks.mockResolvedValueOnce({
      books: [{ id: 1, title: '示例书籍', author: '作者', noteCount: 3 }],
      hasMore: false
    })
    const wrapper = createWrapper()
    await flushPromises()
    const bookItems = wrapper.findAll('.book-item')
    expect(bookItems).toHaveLength(1)
    expect(wrapper.find('.book-add-card').exists()).toBe(true)
    const image = wrapper.findComponent({ name: 'u-image' })
    expect(image.exists()).toBe(true)
    expect(image.props('width')).toBe('220rpx')
    expect(image.props('height')).toBe('280rpx')
  })

  it('搜索操作会触发书籍列表刷新', async () => {
    userStore.isLoggedIn = true
    bookStore.fetchBooks.mockResolvedValue({
      books: [],
      hasMore: false
    })
    const wrapper = createWrapper()
    await flushPromises()
    bookStore.fetchBooks.mockClear()

    const input = wrapper.find('input.search-input')
    await input.setValue('番茄工作法')
    await input.trigger('keyup.enter')
    await flushPromises()

    expect(bookStore.fetchBooks).toHaveBeenCalledWith(1, expect.objectContaining({ keyword: '番茄工作法' }))
  })
})
