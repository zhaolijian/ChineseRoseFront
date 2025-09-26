import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import BookDetail from '../detail.vue'
import * as bookApi from '@/api/modules/book'

// Mock uni-app API
vi.mock('@dcloudio/uni-app', () => ({
  onLoad: vi.fn((callback) => callback({ id: '1' })),
  onMounted: vi.fn(),
  onShow: vi.fn(),
  showModal: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showToast: vi.fn(),
  navigateBack: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn()
}))

const mockShowModal = vi.mocked(uni.showModal)
const mockShowLoading = vi.mocked(uni.showLoading)
const mockHideLoading = vi.mocked(uni.hideLoading)
const mockShowToast = vi.mocked(uni.showToast)
const mockNavigateBack = vi.mocked(uni.navigateBack)

// Mock API
vi.mock('@/api/modules/book', () => ({
  deleteBook: vi.fn()
}))

vi.mock('@/stores/modules/book', () => ({
  useBookStore: () => ({
    fetchBookDetail: vi.fn().mockResolvedValue({
      id: 1,
      title: '测试书籍',
      author: '测试作者',
      noteCount: 5,
      progress: 50
    }),
    fetchBookNotes: vi.fn().mockResolvedValue({
      notes: [],
      total: 0
    })
  })
}))

describe('书籍删除功能', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // 确保全局 uni 对象被正确设置
    ;(global as any).uni = {
      showModal: mockShowModal,
      showLoading: mockShowLoading,
      hideLoading: mockHideLoading,
      showToast: mockShowToast,
      navigateBack: mockNavigateBack,
      getStorageSync: vi.fn(),
      setStorageSync: vi.fn()
    }
    
    wrapper = mount(BookDetail, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              book: {
                books: [{
                  id: 1,
                  title: '测试书籍',
                  author: '测试作者',
                  noteCount: 5,
                  progress: 50
                }]
              }
            },
            stubActions: false
          })
        ],
        stubs: {
          'u-icon': true,
          'u-image': true,
          'u-button': true,
          'u-line-progress': true,
          'u-empty': true,
          'u-slider': true,
          'u-popup': true,
          'u-loading-page': true,
          'AppNavBar': {
            template: '<div><slot name="right" /></div>'
          }
        }
      }
    })
    
    // 设置组件数据
    wrapper.vm.bookId = 1
    wrapper.vm.book = {
      id: 1,
      title: '测试书籍',
      author: '测试作者',
      noteCount: 5,
      progress: 50
    }
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('删除按钮', () => {
    it('应该在导航栏右侧显示删除按钮', () => {
      const deleteIcon = wrapper.find('[data-testid="delete-button"]')
      expect(deleteIcon.exists()).toBe(true)
    })
    
    it('删除按钮应该使用红色图标', () => {
      const deleteIcon = wrapper.find('[data-testid="delete-button"]')
      expect(deleteIcon.attributes('color')).toBe('#ee0a24')
    })
  })

  describe('删除确认对话框', () => {
    it('点击删除按钮应该显示确认对话框', async () => {
      const deleteIcon = wrapper.find('[data-testid="delete-button"]')
      await deleteIcon.trigger('click')
      
      expect(mockShowModal).toHaveBeenCalledWith({
        title: '确认删除书籍',
        content: '删除后，该书籍下的笔记仍会保留在笔记列表中',
        confirmText: '确认删除',
        confirmColor: '#ee0a24',
        success: expect.any(Function)
      })
    })
    
    it('确认对话框应该明确说明笔记会保留', async () => {
      const deleteIcon = wrapper.find('[data-testid="delete-button"]')
      await deleteIcon.trigger('click')
      
      const modalCall = mockShowModal.mock.calls[0][0]
      expect(modalCall.content).toContain('笔记仍会保留')
    })
    
    it('确认按钮应该使用危险色', async () => {
      const deleteIcon = wrapper.find('[data-testid="delete-button"]')
      await deleteIcon.trigger('click')
      
      const modalCall = mockShowModal.mock.calls[0][0]
      expect(modalCall.confirmColor).toBe('#ee0a24')
      expect(modalCall.confirmText).toBe('确认删除')
    })
  })

  describe('删除操作', () => {
    it('用户确认删除应该调用删除API', async () => {
      const mockDeleteBook = vi.mocked(bookApi.deleteBook)
      mockDeleteBook.mockResolvedValue(undefined)
      
      // 模拟用户确认删除
      mockShowModal.mockImplementation(({ success }) => {
        success({ confirm: true, cancel: false })
      })
      
      const deleteIcon = wrapper.find('[data-testid="delete-button"]')
      await deleteIcon.trigger('click')
      
      // 等待异步操作
      await wrapper.vm.$nextTick()
      
      expect(mockShowLoading).toHaveBeenCalledWith({
        title: '删除中...',
        mask: true
      })
      expect(mockDeleteBook).toHaveBeenCalledWith(1)
    })
    
    it('删除成功应该显示成功提示并返回', async () => {
      const mockDeleteBook = vi.mocked(bookApi.deleteBook)
      mockDeleteBook.mockResolvedValue(undefined)
      
      // 模拟用户确认删除
      mockShowModal.mockImplementation(({ success }) => {
        success({ confirm: true, cancel: false })
      })
      
      const deleteIcon = wrapper.find('[data-testid="delete-button"]')
      await deleteIcon.trigger('click')
      
      // 等待API调用完成
      await wrapper.vm.$nextTick()
      await vi.runAllTimersAsync()
      
      expect(mockHideLoading).toHaveBeenCalled()
      expect(mockShowToast).toHaveBeenCalledWith({
        title: '删除成功',
        icon: 'success'
      })
      
      // 运行延迟后验证返回
      vi.advanceTimersByTime(1500)
      expect(uni.navigateBack).toHaveBeenCalled()
    })
    
    it('删除失败应该显示错误提示', async () => {
      const mockDeleteBook = vi.mocked(bookApi.deleteBook)
      mockDeleteBook.mockRejectedValue(new Error('网络错误'))
      
      // 模拟用户确认删除
      mockShowModal.mockImplementation(({ success }) => {
        success({ confirm: true, cancel: false })
      })
      
      const deleteIcon = wrapper.find('[data-testid="delete-button"]')
      await deleteIcon.trigger('click')
      
      // 等待API调用失败
      await wrapper.vm.$nextTick()
      await vi.runAllTimersAsync()
      
      expect(mockShowToast).toHaveBeenCalledWith({
        title: '删除失败',
        icon: 'error'
      })
      
      // 确保不会调用返回
      expect(uni.navigateBack).not.toHaveBeenCalled()
    })
    
    it('用户取消删除不应该执行任何操作', async () => {
      const mockDeleteBook = vi.mocked(bookApi.deleteBook)
      
      // 模拟用户取消删除
      mockShowModal.mockImplementation(({ success }) => {
        success({ confirm: false, cancel: true })
      })
      
      const deleteIcon = wrapper.find('[data-testid="delete-button"]')
      await deleteIcon.trigger('click')
      
      await wrapper.vm.$nextTick()
      
      // 不应该调用任何API或显示加载
      expect(mockShowLoading).not.toHaveBeenCalled()
      expect(mockDeleteBook).not.toHaveBeenCalled()
      expect(mockShowToast).not.toHaveBeenCalled()
      expect(uni.navigateBack).not.toHaveBeenCalled()
    })
  })
  
  describe('删除流程完整性', () => {
    it('应该按正确的顺序执行删除流程', async () => {
      const mockDeleteBook = vi.mocked(bookApi.deleteBook)
      mockDeleteBook.mockResolvedValue(undefined)
      
      const callOrder: string[] = []
      
      mockShowModal.mockImplementation((options) => {
        callOrder.push('showModal')
        options.success({ confirm: true, cancel: false })
      })
      
      mockShowLoading.mockImplementation(() => {
        callOrder.push('showLoading')
      })
      
      mockDeleteBook.mockImplementation(() => {
        callOrder.push('deleteBook')
        return Promise.resolve()
      })
      
      mockHideLoading.mockImplementation(() => {
        callOrder.push('hideLoading')
      })
      
      mockShowToast.mockImplementation(() => {
        callOrder.push('showToast')
      })
      
      const deleteIcon = wrapper.find('[data-testid="delete-button"]')
      await deleteIcon.trigger('click')
      
      // 等待所有异步操作完成
      await vi.waitFor(() => {
        expect(callOrder).toEqual([
          'showModal',
          'showLoading',
          'deleteBook',
          'hideLoading',
          'showToast'
        ])
      })
    })
  })
})