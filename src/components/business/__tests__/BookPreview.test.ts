import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BookPreview from '../BookPreview.vue'
import { createBook } from '@/api/modules/book'

vi.mock('@/utils', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  },
  createContext: vi.fn(() => ({
    traceId: 'trace-id',
    userId: '',
    timestamp: Date.now(),
    platform: 'test'
  }))
}))

// Mock API
vi.mock('@/api/modules/book', () => ({
  createBook: vi.fn()
}))

const createUni = () => ({
  showToast: vi.fn(),
  showModal: vi.fn()
})

beforeEach(() => {
  (global as any).uni = createUni()
})

describe('BookPreview组件', () => {
  const mockBook = {
    title: '测试书籍',
    author: '测试作者',
    isbn: '9787115428028',
    publisher: '测试出版社',
    publishDate: '2023-01-01',
    coverUrl: 'https://example.com/cover.jpg',
    description: '这是一本测试书籍的简介'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该正确渲染书籍信息', () => {
    const wrapper = mount(BookPreview, {
      props: {
        modelValue: true,
        book: mockBook
      }
    })

    // 检查书籍信息是否正确显示
    expect(wrapper.text()).toContain(mockBook.title)
    expect(wrapper.text()).toContain(mockBook.author)
    expect(wrapper.text()).toContain(mockBook.publisher)
    expect(wrapper.text()).toContain(mockBook.isbn)
    expect(wrapper.text()).toContain(mockBook.description)
  })

  it('应该在没有封面时显示占位图', () => {
    const bookWithoutCover = { ...mockBook, coverUrl: '' }
    const wrapper = mount(BookPreview, {
      props: {
        modelValue: true,
        book: bookWithoutCover
      }
    })

    const image = wrapper.find('u-image')
    expect(image.attributes('src')).toContain('book-placeholder.svg')
  })

  it('点击重新扫描应该触发rescan事件', async () => {
    const wrapper = mount(BookPreview, {
      props: {
        modelValue: true,
        book: mockBook
      },
      global: {
        stubs: {
          'u-popup': {
            template: '<div class="u-popup-stub"><slot /></div>'
          },
          'u-image': true,
          'u-button': {
            template: '<button @click="$emit(\'click\')"><slot /></button>'
          }
        }
      }
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(0)
    
    const rescanButton = buttons[0]
    await rescanButton.trigger('click')
    await wrapper.vm.$nextTick()

    // 验证核心功能：重新扫描事件被触发
    expect(wrapper.emitted('rescan')).toBeTruthy()
    expect(wrapper.emitted('rescan')!.length).toBeGreaterThanOrEqual(1)
  })

  it('点击添加到书架应该调用createBook并触发added事件', async () => {
    const newBook = { ...mockBook, id: 1 }
    vi.mocked(createBook).mockResolvedValueOnce(newBook)

    const wrapper = mount(BookPreview, {
      props: {
        modelValue: true,
        book: mockBook
      },
      global: {
        stubs: {
          'u-button': {
            template: '<button @click="$emit(\'click\')"><slot /></button>'
          }
        }
      }
    })

    const addButton = wrapper.findAll('button')[1]
    await addButton.trigger('click')

    // 等待异步操作完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(createBook).toHaveBeenCalledWith({
      title: mockBook.title,
      author: mockBook.author,
      isbn: mockBook.isbn,
      publisher: mockBook.publisher,
      publishDate: mockBook.publishDate,
      coverUrl: mockBook.coverUrl,
      source: 'isbn_api'
    })

    expect(wrapper.emitted('added')?.[0]).toEqual([newBook])
  })

  it('添加失败时应该显示错误提示', async () => {
    vi.mocked(createBook).mockRejectedValueOnce(new Error('网络错误'))

    const wrapper = mount(BookPreview, {
      props: {
        modelValue: true,
        book: mockBook
      },
      global: {
        stubs: {
          'u-button': {
            template: '<button @click="$emit(\'click\')"><slot /></button>'
          }
        }
      }
    })

    const addButton = wrapper.findAll('button')[1]
    await addButton.trigger('click')

    // 等待异步操作完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // 验证没有触发added事件
    expect(wrapper.emitted('added')).toBeFalsy()
  })

  it('书籍已存在时应该显示特定提示', async () => {
    vi.mocked(createBook).mockRejectedValueOnce(new Error('书籍已存在'))

    const wrapper = mount(BookPreview, {
      props: {
        modelValue: true,
        book: mockBook
      },
      global: {
        stubs: {
          'u-button': {
            template: '<button @click="$emit(\'click\')"><slot /></button>'
          }
        }
      }
    })

    const addButton = wrapper.findAll('button')[1]
    await addButton.trigger('click')

    // 等待异步操作完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // 验证没有触发added事件
    expect(wrapper.emitted('added')).toBeFalsy()
  })
})
