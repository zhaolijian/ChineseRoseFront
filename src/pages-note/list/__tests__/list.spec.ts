import { mount } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import NotesListPage from '../list.vue'

vi.mock('@dcloudio/uni-app', () => ({
  onLoad: vi.fn(),
  onShow: vi.fn(),
  onPullDownRefresh: vi.fn(),
  onReachBottom: vi.fn()
}))

const uniMock = {
  showToast: vi.fn(),
  stopPullDownRefresh: vi.fn(),
  navigateTo: vi.fn(),
  showModal: vi.fn()
}

const createWrapper = () =>
  mount(NotesListPage, {
    global: {
      stubs: {
        'u-search': {
          name: 'u-search',
          emits: ['focus', 'blur', 'search', 'clear'],
          template: '<div class="u-search-stub"><slot name="suffix" /></div>'
        },
        'scroll-view': {
          name: 'scroll-view',
          template: '<div class="scroll-view"><slot /></div>'
        },
        'u-empty': {
          name: 'u-empty',
          template: '<div class="u-empty"><slot /><slot name="bottom" /></div>'
        },
        'u-icon': {
          name: 'u-icon',
          template: '<i class="u-icon"></i>'
        },
        'u-popup': {
          name: 'u-popup',
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template: '<div class="u-popup"><slot /></div>'
        },
        'u-loading-page': {
          name: 'u-loading-page',
          template: '<div class="u-loading-page"></div>'
        },
        PrimaryButton: {
          name: 'PrimaryButton',
          template: '<button class="primary-button"><slot /></button>'
        }
      },
      mocks: {
        uni: uniMock
      }
    }
  })

describe('Notes list page design behaviour', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders five filter items using the new tokenised classes', async () => {
    const wrapper = createWrapper()
    const filterItems = wrapper.findAll('.filter-item')
    expect(filterItems).toHaveLength(5)
    expect(filterItems[0].classes()).toContain('active')
  })

  it('toggles search input style on focus/blur to match Figma tokens', async () => {
    const wrapper = createWrapper()
    expect(wrapper.vm.searchInputStyle.background).toBe('#f8f9fa')
    const search = wrapper.findComponent({ name: 'u-search' })
    search.vm.$emit('focus')
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.searchInputStyle.background).toBe('#ffffff')
    search.vm.$emit('blur')
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.searchInputStyle.background).toBe('#f8f9fa')
  })

  it('renders FAB button for note creation with design class', async () => {
    const wrapper = createWrapper()
    const fab = wrapper.find('.fab-button')
    expect(fab.exists()).toBe(true)
  })
})
