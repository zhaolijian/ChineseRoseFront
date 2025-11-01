import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import NotesPage from '../index.vue'

vi.mock('@dcloudio/uni-app', () => ({
  onMounted: vi.fn((cb?: () => void) => cb && cb()),
  onShow: vi.fn((cb?: () => void) => cb && cb()),
  onPullDownRefresh: vi.fn()
}))

const mockBookStore = {
  fetchBooks: vi.fn(),
  bookCount: 0
}

const mockNoteStore = {
  fetchNotes: vi.fn(),
  total: 0
}

const mockMindmapStore = {
  fetchMindmaps: vi.fn(),
  total: 0
}

vi.mock('@/stores/modules/book', () => ({
  useBookStore: () => mockBookStore
}))

vi.mock('@/stores/modules/note', () => ({
  useNoteStore: () => mockNoteStore
}))

vi.mock('@/stores/modules/mindmap', () => ({
  useMindmapStore: () => mockMindmapStore
}))

const mockSafeHideTabBar = vi.hoisted(() => vi.fn())
vi.mock('@/utils/tabbar', () => ({
  safeHideTabBar: mockSafeHideTabBar
}))

vi.mock('@/utils', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  },
  createContext: vi.fn(() => ({}))
}))

const uniMock = {
  navigateTo: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({ windowWidth: 375, statusBarHeight: 20 })),
  getMenuButtonBoundingClientRect: vi.fn(() => ({ bottom: 60 }))
}

const createWrapper = async () => {
  const wrapper = mount(NotesPage, {
    global: {
      stubs: {
        AppNavBar: {
          name: 'AppNavBar',
          template: '<div class="app-nav-bar"><slot /><slot name="right" /></div>'
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
          template: '<div class="tab-bar-stub"></div>'
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
  await flushPromises()
  return wrapper
}

describe('Notes 首页面板', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const now = new Date('2025-01-01T08:00:00.000Z')
    vi.setSystemTime(now)

    mockBookStore.fetchBooks.mockReset()
    mockNoteStore.fetchNotes.mockReset()
    mockMindmapStore.fetchMindmaps.mockReset()
    uniMock.navigateTo.mockReset()
    uniMock.getSystemInfoSync.mockClear()
    uniMock.getMenuButtonBoundingClientRect.mockClear()
    mockSafeHideTabBar.mockReset()

    mockBookStore.fetchBooks.mockResolvedValue({
      books: [],
      total: 12
    })
    mockNoteStore.fetchNotes.mockResolvedValue({
      list: [
        {
          id: 1,
          title: '认知觉醒',
          bookTitle: '第三章：元认知能力',
          tags: ['方法', '复盘', '实践'],
          updatedAt: '2025-01-01T08:00:00.000Z',
          noteType: 'reading',
          progress: 75
        }
      ],
      total: 156,
      page: 1,
      pageSize: 10
    })
    mockMindmapStore.fetchMindmaps.mockResolvedValue({
      list: [],
      total: 8
    })

    globalThis.uni = uniMock as any
  })

  afterEach(() => {
    vi.useRealTimers()
    delete (globalThis as any).uni
  })

  it('渲染统计卡片与最近笔记列表，符合设计结构', async () => {
    const wrapper = await createWrapper()

    expect(mockBookStore.fetchBooks).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ limit: 12 })
    )
    expect(mockNoteStore.fetchNotes).toHaveBeenCalledWith(1, { pageSize: 10, sortBy: 'updatedAt', sortOrder: 'desc' })
    expect(mockMindmapStore.fetchMindmaps).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ limit: 12 })
    )

    const statNumbers = wrapper.findAll('.stat-number').map(node => node.text())
    expect(statNumbers).toEqual(['12', '156', '8'])

    const recentCards = wrapper.findAll('.recent-card')
    expect(recentCards).toHaveLength(1)

    const card = recentCards[0]
    expect(card.find('.note-title').text()).toBe('认知觉醒')
    expect(card.find('.note-subtitle').text()).toBe('第三章：元认知能力')
    expect(card.find('.note-count').text()).toBe('3 个标签')
    expect(card.find('.note-time').text()).toBe('刚刚')
    expect(card.find('.note-type').text()).toBe('阅读笔记')
    expect(card.find('.progress-bar__fill').attributes('style')).toContain('width: 75%')

    const tagTexts = card.findAll('.note-tag').map(node => node.text())
    expect(tagTexts).toEqual(['#方法', '#复盘', '#实践'])

    const fab = wrapper.find('.notes-fab')
    expect(fab.exists()).toBe(true)
    expect(fab.find('.fab-icon').text()).toBe('+')
  })

  it('点击查看更多与FAB能够导航到对应页面', async () => {
    const wrapper = await createWrapper()

    await wrapper.find('.section-action').trigger('click')
    expect(uniMock.navigateTo).toHaveBeenNthCalledWith(1, { url: '/pages-note/list/list' })

    uniMock.navigateTo.mockReset()
    await wrapper.find('.notes-fab').trigger('click')
    expect(uniMock.navigateTo).toHaveBeenCalledWith({ url: '/pages-note/add/add' })
  })

  it('无笔记时显示空状态', async () => {
    const emptyResponse = {
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    }
    mockNoteStore.fetchNotes.mockImplementation(() => Promise.resolve(emptyResponse))

    const wrapper = await createWrapper()
    expect(wrapper.find('.empty-state-stub').exists()).toBe(true)
    expect(wrapper.find('.recent-card').exists()).toBe(false)
  })
})
