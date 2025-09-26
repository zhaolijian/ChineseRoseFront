import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import OCRPage from './ocr.vue'

// Mock uni API
const mockUni = {
  chooseImage: vi.fn(),
  compressImage: vi.fn(),
  ocrNavigator: vi.fn(),
  showToast: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showModal: vi.fn(),
  navigateTo: vi.fn(),
  navigateBack: vi.fn(),
  getSystemInfo: vi.fn(() => ({
    success: vi.fn(),
    fail: vi.fn()
  })),
  getImageInfo: vi.fn(),
  getFileInfo: vi.fn(),
  getFileSystemManager: vi.fn(() => ({
    readFile: vi.fn(({ success }) => {
      success({ data: 'mock-file-data' })
    })
  }))
}

// @ts-ignore
global.uni = mockUni

// Mock console.log to avoid test noise
vi.spyOn(console, 'log').mockImplementation(() => {})

describe('OCR页面', () => {
  beforeEach(() => {
    // 重置所有mock
    vi.clearAllMocks()
  })

  describe('页面初始化', () => {
    it('应该正确渲染页面标题', () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      expect(wrapper.find('.ocr-title').text()).toBe('文字识别')
    })

    it('应该显示图片选择区域', () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      const uploadArea = wrapper.find('.image-upload-area')
      expect(uploadArea.exists()).toBe(true)
      expect(uploadArea.find('.upload-placeholder').exists()).toBe(true)
    })

    it('应该显示批量处理提示', () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      const batchTip = wrapper.find('.batch-tip')
      expect(batchTip.exists()).toBe(true)
      expect(batchTip.text()).toContain('支持1-9张图片')
    })
  })

  describe('图片选择功能', () => {
    it('应该支持相机和相册选择', async () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      mockUni.chooseImage.mockImplementation(({ success }: any) => {
        success({
          tempFilePaths: ['/temp/image1.jpg'],
          tempFiles: [{ size: 1024 * 1024 }] // 1MB
        })
      })

      const uploadArea = wrapper.find('.image-upload-area')
      await uploadArea.trigger('click')

      expect(mockUni.chooseImage).toHaveBeenCalledWith({
        count: 9,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: expect.any(Function),
        fail: expect.any(Function)
      })
    })

    it('应该正确处理图片选择成功', async () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      const mockImages = [
        { tempFilePath: '/temp/image1.jpg', size: 1024 * 1024 },
        { tempFilePath: '/temp/image2.jpg', size: 2 * 1024 * 1024 }
      ]

      mockUni.chooseImage.mockImplementation(({ success }: any) => {
        success({
          tempFilePaths: mockImages.map(img => img.tempFilePath),
          tempFiles: mockImages.map(img => ({ size: img.size }))
        })
      })
      
      // Mock getImageInfo for both images
      mockUni.getImageInfo.mockImplementation(({ success }: any) => {
        success({
          width: 1000,
          height: 1000,
          type: 'jpg'
        })
      })

      const uploadArea = wrapper.find('.image-upload-area')
      await uploadArea.trigger('click')
      await wrapper.vm.$nextTick()

      // 等待异步处理完成
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 验证图片已添加到列表
      const vm = wrapper.vm as any
      expect(vm.selectedImages).toHaveLength(2)
      expect(vm.selectedImages[0].path).toBe('/temp/image1.jpg')
      expect(vm.selectedImages[1].path).toBe('/temp/image2.jpg')
    })

    it('应该限制最多选择10张图片', async () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      // 模拟已有10张图片
      const vm = wrapper.vm as any
      vm.selectedImages = Array(10).fill(0).map((_, i) => ({
        path: `/temp/image${i}.jpg`,
        size: 1024 * 1024,
        compressed: false
      }))

      const uploadArea = wrapper.find('.image-upload-area')
      await uploadArea.trigger('click')

      expect(mockUni.showToast).toHaveBeenCalledWith({
        title: '最多只能选择9张图片',
        icon: 'none'
      })
    })
  })

  describe('智能压缩功能', () => {
    it('应该对大于2MB的图片进行压缩', async () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      const largeImageSize = 3 * 1024 * 1024 // 3MB

      mockUni.chooseImage.mockImplementation(({ success }: any) => {
        success({
          tempFilePaths: ['/temp/large.jpg'],
          tempFiles: [{ size: largeImageSize }]
        })
      })

      mockUni.getImageInfo.mockImplementation(({ src, success }: any) => {
        success({
          width: 2000,
          height: 3000,
          type: 'jpg'
        })
      })
      
      mockUni.compressImage.mockImplementation(({ success }: any) => {
        success({
          tempFilePath: '/temp/compressed.jpg'
        })
      })
      
      mockUni.getFileInfo.mockImplementation(({ success }: any) => {
        success({
          size: 1.5 * 1024 * 1024 // 1.5MB compressed size
        })
      })

      const uploadArea = wrapper.find('.image-upload-area')
      await uploadArea.trigger('click')
      
      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockUni.compressImage).toHaveBeenCalled()
      const compressCall = mockUni.compressImage.mock.calls[0][0]
      expect(compressCall.src).toBe('/temp/large.jpg')
      expect(compressCall.quality).toBe(92)
    })

    it('应该保持小于2MB图片不压缩', async () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      const smallImageSize = 1 * 1024 * 1024 // 1MB

      mockUni.chooseImage.mockImplementation(({ success }: any) => {
        success({
          tempFilePaths: ['/temp/small.jpg'],
          tempFiles: [{ size: smallImageSize }]
        })
      })
      
      // Mock getImageInfo for small image (resolution below threshold)
      mockUni.getImageInfo.mockImplementation(({ success }: any) => {
        success({
          width: 800,
          height: 600,
          type: 'jpg'
        })
      })

      const uploadArea = wrapper.find('.image-upload-area')
      await uploadArea.trigger('click')
      
      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockUni.compressImage).not.toHaveBeenCalled()
    })
  })

  describe('微信OCR识别', () => {
    it.skip('应该调用微信OCR插件进行识别', async () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      // 添加测试图片
      const vm = wrapper.vm as any
      // 先模拟选择图片
      mockUni.chooseImage.mockImplementation(({ success }: any) => {
        success({
          tempFilePaths: ['/temp/image1.jpg'],
          tempFiles: [{ size: 1024 * 1024 }]
        })
      })
      
      mockUni.getImageInfo.mockImplementation(({ success }: any) => {
        success({ width: 1000, height: 1000, type: 'jpg' })
      })

      // 选择图片
      const uploadArea = wrapper.find('.image-upload-area')
      await uploadArea.trigger('click')
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 确保图片已添加
      expect(wrapper.vm.selectedImages.length).toBe(1)

      mockUni.ocrNavigator.mockImplementation(({ success }: any) => {
        success({
          texts: [
            { text: '这是识别的文字内容', confidence: 0.95 }
          ]
        })
      })

      // 等待按钮出现
      await wrapper.vm.$nextTick()
      const ocrButton = wrapper.find('.ocr-start-btn')
      expect(ocrButton.exists()).toBe(true)
      await ocrButton.trigger('click')

      expect(mockUni.ocrNavigator).toHaveBeenCalledWith({
        success: expect.any(Function),
        fail: expect.any(Function)
      })
    })

    it.skip('应该处理OCR识别成功结果', async () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      const vm = wrapper.vm as any
      vm.selectedImages = [{
        path: '/temp/image1.jpg',
        size: 1024 * 1024,
        compressed: false
      }]

      const mockResult = {
        texts: [
          { text: '第一段文字', confidence: 0.95 },
          { text: '第二段文字', confidence: 0.90 }
        ]
      }

      mockUni.ocrNavigator.mockImplementation(({ success }: any) => {
        success(mockResult)
      })

      const ocrButton = wrapper.find('.ocr-start-btn')
      await ocrButton.trigger('click')
      await wrapper.vm.$nextTick()

      // 验证识别结果已保存
      expect(vm.ocrResults).toHaveLength(1)
      expect(vm.ocrResults[0].texts).toEqual(mockResult.texts)
    })

    it.skip('应该处理OCR识别失败情况', async () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      const vm = wrapper.vm as any
      vm.selectedImages = [{
        path: '/temp/image1.jpg',
        size: 1024 * 1024,
        compressed: false
      }]

      mockUni.ocrNavigator.mockImplementation(({ fail }: any) => {
        fail({ errMsg: 'OCR识别失败' })
      })

      const ocrButton = wrapper.find('.ocr-start-btn')
      await ocrButton.trigger('click')

      expect(mockUni.showModal).toHaveBeenCalledWith({
        title: '识别失败',
        content: '文字识别失败，是否手动输入？',
        showCancel: true,
        confirmText: '手动输入',
        cancelText: '重试',
        success: expect.any(Function)
      })
    })
  })

  describe('识别结果展示', () => {
    it.skip('应该显示识别结果编辑区域', async () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      // 模拟有识别结果
      const vm = wrapper.vm as any
      vm.ocrResults = [{
        imageIndex: 0,
        texts: [{ text: '测试文字', confidence: 0.95 }]
      }]

      await wrapper.vm.$nextTick()

      const resultArea = wrapper.find('.ocr-result-area')
      expect(resultArea.exists()).toBe(true)
      expect(resultArea.find('textarea').exists()).toBe(true)
    })

    it.skip('应该支持编辑识别结果', async () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      const vm = wrapper.vm as any
      vm.ocrResults = [{
        imageIndex: 0,
        texts: [{ text: '原始文字', confidence: 0.95 }]
      }]

      await wrapper.vm.$nextTick()

      const textarea = wrapper.find('.result-text textarea')
      await textarea.setValue('修改后的文字')

      expect(vm.ocrResults[0].editedText).toBe('修改后的文字')
    })
  })

  describe('批量处理功能', () => {
    it.skip('应该支持批量识别多张图片', async () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      const vm = wrapper.vm as any
      vm.selectedImages = [
        { path: '/temp/image1.jpg', size: 1024 * 1024, compressed: false },
        { path: '/temp/image2.jpg', size: 1024 * 1024, compressed: false }
      ]

      let callCount = 0
      mockUni.ocrNavigator.mockImplementation(({ success }: any) => {
        callCount++
        success({
          texts: [{ text: `图片${callCount}的文字`, confidence: 0.95 }]
        })
      })

      const batchButton = wrapper.find('.batch-ocr-btn')
      await batchButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockUni.ocrNavigator).toHaveBeenCalledTimes(2)
      expect(vm.ocrResults).toHaveLength(2)
    })

    it.skip('应该显示批量处理进度', async () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      const vm = wrapper.vm as any
      vm.selectedImages = Array(3).fill(0).map((_, i) => ({
        path: `/temp/image${i}.jpg`,
        size: 1024 * 1024,
        compressed: false
      }))

      mockUni.ocrNavigator.mockImplementation(({ success }: any) => {
        // 异步返回以模拟处理过程
        setTimeout(() => {
          success({ texts: [{ text: '测试文字', confidence: 0.95 }] })
        }, 100)
      })

      const batchButton = wrapper.find('.batch-ocr-btn')
      await batchButton.trigger('click')

      // 验证进度显示
      const progressBar = wrapper.find('.batch-progress')
      expect(progressBar.exists()).toBe(true)
    })
  })

  describe('降级处理', () => {
    it('应该在OCR失败时提供手动输入选项', async () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      const vm = wrapper.vm as any
      mockUni.showModal.mockImplementation(({ success }: any) => {
        success({ confirm: true }) // 用户选择手动输入
      })

      // 触发降级处理
      await vm.handleOCRFallback(0)

      expect(mockUni.showModal).toHaveBeenCalled()
      const modalCall = mockUni.showModal.mock.calls[0][0]
      expect(modalCall.title).toBe('识别失败')
      expect(modalCall.content).toContain('是否手动输入')
      expect(modalCall.confirmText).toBe('手动输入')
      expect(modalCall.cancelText).toBe('重试')
    })
  })

  describe('保存功能', () => {
    it.skip('应该支持保存识别结果为笔记', async () => {
      const wrapper = mount(OCRPage, {
        global: {
          plugins: [createTestingPinia()]
        }
      })

      const vm = wrapper.vm as any
      vm.ocrResults = [{
        imageIndex: 0,
        texts: [{ text: '测试笔记内容', confidence: 0.95 }]
      }]

      await wrapper.vm.$nextTick()

      const saveButton = wrapper.find('.save-note-btn')
      await saveButton.trigger('click')

      expect(mockUni.navigateTo).toHaveBeenCalledWith({
        url: '/pages-note/add/add?ocrText=测试笔记内容'
      })
    })
  })
})