import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import HomePage from '@/pages/index/index.vue'

vi.mock('@dcloudio/uni-app', () => ({
  onShow: (fn: () => void) => fn(),
  onPullDownRefresh: () => void 0,
  onReachBottom: () => void 0
}))

vi.mock('@/stores/modules/book', () => ({
  useBookStore: () => ({
    currentPage: 1,
    fetchBooks: vi.fn(async () => ({
      books: [
        { id: 1, title: '认知觉醒', author: '艾理斯', noteCount: 12 }
      ],
      hasMore: false
    })),
    total: 12
  })
}))

vi.mock('@/stores/modules/note', () => ({
  useNoteStore: () => ({
    fetchNotes: vi.fn(async () => ({
      list: [
        { id: 1, title: '系统性思维', bookTitle: '思考，快与慢', updatedAt: '2小时前' }
      ]
    })),
    notes: [
      { id: 1, title: '系统性思维', bookTitle: '思考，快与慢', updatedAt: '2小时前' }
    ],
    total: 156
  })
}))

vi.mock('@/stores/modules/user', () => ({
  useUserStore: () => ({
    isLoggedIn: true,
    checkLoginStatus: vi.fn(async () => true)
  })
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
  createContext: () => ({ traceId: 'test' })
}))

vi.mock('@/api/modules/book', () => ({
  searchBookByISBN: vi.fn()
}))

const globalStubs = {
  'u-icon': {
    props: ['name', 'size', 'color'],
    template: '<span class="u-icon"><slot /></span>'
  },
  'u-image': {
    props: ['src', 'mode', 'width', 'height', 'radius'],
    template: '<img class="u-image" :src="src" />'
  },
  'u-popup': {
    emits: ['update:modelValue'],
    props: ['modelValue'],
    template: '<div class="u-popup" v-if="modelValue"><slot /></div>'
  },
  'u-loading-page': {
    props: ['loading'],
    template: '<div v-if="loading" class="u-loading">loading</div>'
  },
  'u-button': {
    template: '<button><slot /></button>'
  }
}

describe('Home page layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders bookshelf page with correct elements', async () => {
    const wrapper = shallowMount(HomePage, {
      global: {
        stubs: {
          ...globalStubs,
          PageContainer: {
            name: 'PageContainer',
            template: '<div class="page-container"><slot /></div>'
          }
        }
      }
    })

    await wrapper.vm.$nextTick()

    // 验证页面基础结构
    expect(wrapper.find('.bookshelf-page').exists()).toBe(true)
    
    // 输出HTML以调试
    const html = wrapper.html()
    expect(html).toContain('bookshelf')
    
    // 验证有导航栏组件（使用具体的组件名）
    expect(wrapper.findComponent({ name: 'AppNavBar' }).exists()).toBe(true)
  })
})
