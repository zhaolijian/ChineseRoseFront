import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AddBookPage from './add.vue'
import { createTestingPinia } from '@pinia/testing'

const onLoadCallbacks: Array<(options?: any) => void> = []
const onShowCallbacks: Array<() => void> = []

// Mock uni-app API
vi.mock('@dcloudio/uni-app', () => ({
  onLoad: vi.fn((callback) => {
    onLoadCallbacks.push(callback)
  }),
  onShow: vi.fn((callback) => {
    onShowCallbacks.push(callback)
  }),
  showToast: vi.fn(),
  showLoading: vi.fn(), 
  hideLoading: vi.fn(),
  navigateBack: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({ statusBarHeight: 20 })),
  chooseImage: vi.fn()
}))

// Mock API
vi.mock('@/api/modules/book', () => ({
  uploadBookCover: vi.fn()
}))

describe('AddBookPage', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
    onLoadCallbacks.length = 0
    onShowCallbacks.length = 0
    ;(global as any).uni = {
      showToast: vi.fn(),
      showLoading: vi.fn(),
      hideLoading: vi.fn(),
      navigateBack: vi.fn(),
      getSystemInfoSync: vi.fn(() => ({ statusBarHeight: 20 })),
      chooseImage: vi.fn()
    }
    wrapper = mount(AddBookPage, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              book: {}
            }
          })
        ],
        stubs: {
          'u-icon': true,
          'u-input': {
            template: '<input :placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['placeholder', 'modelValue']
          },
          'u-form': {
            template: '<form><slot /></form>'
          },
          'u-form-item': {
            template: '<div class="u-form-item"><slot /></div>'
          },
          'u-button': true,
          'u-image': true,
          'u-datetime-picker': true,
          'u--textarea': {
            template: '<textarea :placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['placeholder', 'modelValue']
          },
          'AppNavBar': true,
          'IsbnScanner': true
        }
      }
    })
  })

  it('应该正确渲染页面结构', () => {
    expect(wrapper.find('.add-book-page').exists()).toBe(true)
    expect(wrapper.find('.form-container').exists()).toBe(true)
  })

  it('应该包含所有必要的表单字段', () => {
    const formItems = wrapper.findAll('.u-form-item')
    expect(formItems.length).toBeGreaterThanOrEqual(6) // 书名、作者、出版社、页数、出版年份、简介
  })

  it('应该有表单输入字段', () => {
    expect(wrapper.find('input[placeholder="请输入书名"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="请输入作者名称（选填）"]').exists()).toBe(true)
  })

  it('应该有封面上传区域', () => {
    expect(wrapper.find('.cover-upload').exists()).toBe(true)
  })

  it('新增模式下标题应该是"添加书籍"', () => {
    // 不传递id参数，模拟新增模式
    onLoadCallbacks.forEach(cb => cb())
    expect(wrapper.vm.pageTitle).toBe('添加书籍')
  })

  it('编辑模式下应该加载书籍数据', async () => {
    // 模拟编辑模式
    wrapper.vm.bookId = 1
    expect(wrapper.vm.isEditMode).toBe(true)
    expect(wrapper.vm.pageTitle).toBe('编辑书籍')
  })
})
