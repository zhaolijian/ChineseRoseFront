import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import ImageUpload from './ImageUpload.vue'
import { nextTick } from 'vue'

// 创建统一的 flush-promises 工具函数
// 用于处理异步操作的稳定性问题
const waitForAsync = async () => {
  await flushPromises()
  await nextTick()
  // 添加额外的微任务等待，确保所有异步操作完成
  await new Promise(resolve => setTimeout(resolve, 0))
}

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

const storageMock = vi.hoisted(() => ({
  getStorageSync: vi.fn()
}))

vi.mock('@/utils/storage', () => storageMock)

// Mock constants
vi.mock('@/constants', () => ({
  API_BASE_URL: 'https://api.example.com',
  STORAGE_KEYS: {
    TOKEN: 'token'
  }
}))

// Mock uni-app API
const createUni = () => ({
  chooseImage: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showToast: vi.fn(),
  uploadFile: vi.fn(),
  compressImage: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({ platform: 'test' }))
})

let mockUniApi = createUni()

Object.assign(global, {
  uni: mockUniApi
})

// Mock后端API
vi.mock('@/api/modules/upload', () => ({
  uploadImage: vi.fn()
}))

describe('ImageUpload组件', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    vi.clearAllMocks()
    mockUniApi = createUni()
    ;(global as any).uni = mockUniApi
    storageMock.getStorageSync.mockReturnValue(null)
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  /**
   * 测试修复说明：
   * 1. 统一使用 Promise.resolve().then() 替代 setTimeout 确保异步执行顺序
   * 2. 添加 waitForAsync 工具函数处理多层异步操作
   * 3. 确保所有 complete 回调都被正确调用
   * 4. 修复进度更新测试的回调机制
   * 
   * 这些修改保持了原有的业务逻辑测试不变，仅优化了异步处理的稳定性
   */

  describe('组件渲染', () => {
    it('应该正确渲染上传区域', () => {
      wrapper = mount(ImageUpload, {
        props: {
          modelValue: ''
        }
      })
      
      expect(wrapper.find('.image-upload').exists()).toBe(true)
      expect(wrapper.find('.upload-area').exists()).toBe(true)
    })

    it('当有图片时应该显示预览', () => {
      wrapper = mount(ImageUpload, {
        props: {
          modelValue: 'https://example.com/image.jpg'
        }
      })
      
      expect(wrapper.find('.preview-image').exists()).toBe(true)
      expect(wrapper.find('.upload-placeholder').exists()).toBe(false)
    })

    it('当没有图片时应该显示占位符', () => {
      wrapper = mount(ImageUpload, {
        props: {
          modelValue: ''
        }
      })
      
      expect(wrapper.find('.upload-placeholder').exists()).toBe(true)
      expect(wrapper.find('.preview-image').exists()).toBe(false)
    })

    it('应该显示自定义的提示文字', () => {
      const tips = '点击上传书籍封面'
      wrapper = mount(ImageUpload, {
        props: {
          modelValue: '',
          tips
        }
      })
      
      expect(wrapper.find('.upload-tips').text()).toBe(tips)
    })
  })

  describe('图片选择', () => {
    it('点击上传区域应该触发选择图片', async () => {
      wrapper = mount(ImageUpload, {
        props: {
          modelValue: ''
        }
      })

      await wrapper.find('.upload-area').trigger('click')
      
      expect(mockUniApi.chooseImage).toHaveBeenCalledWith({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: expect.any(Function),
        fail: expect.any(Function)
      })
    })

    it('应该支持自定义选择来源', async () => {
      wrapper = mount(ImageUpload, {
        props: {
          modelValue: '',
          sourceType: ['camera']
        }
      })

      await wrapper.find('.upload-area').trigger('click')
      
      expect(mockUniApi.chooseImage).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceType: ['camera']
        })
      )
    })

    it('选择图片失败时应该显示错误提示', async () => {
      wrapper = mount(ImageUpload, {
        props: {
          modelValue: ''
        }
      })

      // 模拟选择失败 - 修复：确保同步调用fail回调
      mockUniApi.chooseImage.mockImplementation((options) => {
        options.fail({ errMsg: '选择图片失败' })
      })

      await wrapper.find('.upload-area').trigger('click')
      await waitForAsync()
      
      expect(mockUniApi.showToast).toHaveBeenCalledWith({
        title: '选择图片失败',
        icon: 'none'
      })
    })
  })

  describe('图片压缩', () => {
    it('选择图片后应该进行压缩', async () => {
      const mockTempPath = 'temp://image.jpg'
      const mockCompressedPath = 'temp://compressed.jpg'
      
      wrapper = mount(ImageUpload, {
        props: {
          modelValue: '',
          maxSize: 1024 * 1024 // 1MB
        }
      })

      // 模拟选择成功 - 修复：使用Promise确保执行顺序
      mockUniApi.chooseImage.mockImplementation((options) => {
        // 使用微任务确保异步行为的一致性
        Promise.resolve().then(() => {
          options.success({
            tempFilePaths: [mockTempPath],
            tempFiles: [{
              path: mockTempPath,
              size: 2 * 1024 * 1024 // 2MB，需要压缩
            }]
          })
        })
      })

      // 模拟压缩成功 - 修复：使用Promise确保执行顺序
      mockUniApi.compressImage.mockImplementation((options) => {
        Promise.resolve().then(() => {
          options.success({
            tempFilePath: mockCompressedPath
          })
        })
      })

      // 模拟上传文件成功 - 修复：确保complete回调执行
      mockUniApi.uploadFile.mockImplementation((options) => {
        Promise.resolve().then(() => {
          options.success({
            statusCode: 200,
            data: JSON.stringify({
              code: 0,
              data: {
                url: 'https://example.com/compressed.jpg'
              }
            })
          })
          // 确保complete回调执行
          if (options.complete) {
            options.complete()
          }
        })
        // 返回模拟的uploadTask对象
        return {
          onProgressUpdate: vi.fn()
        }
      })

      await wrapper.find('.upload-area').trigger('click')
      await waitForAsync()
      
      expect(mockUniApi.compressImage).toHaveBeenCalledWith({
        src: mockTempPath,
        quality: 80,
        success: expect.any(Function),
        fail: expect.any(Function)
      })
    })

    it('图片小于限制大小时不应该压缩', async () => {
      const mockTempPath = 'temp://image.jpg'
      const mockUploadUrl = 'https://example.com/uploaded.jpg'
      
      wrapper = mount(ImageUpload, {
        props: {
          modelValue: '',
          maxSize: 1024 * 1024 // 1MB
        }
      })

      // 模拟选择成功 - 修复：使用Promise确保执行顺序
      mockUniApi.chooseImage.mockImplementation((options) => {
        Promise.resolve().then(() => {
          options.success({
            tempFilePaths: [mockTempPath],
            tempFiles: [{
              path: mockTempPath,
              size: 500 * 1024 // 500KB，不需要压缩
            }]
          })
        })
      })

      // 模拟上传成功 - 修复：使用Promise确保执行顺序
      mockUniApi.uploadFile.mockImplementation((options) => {
        Promise.resolve().then(() => {
          options.success({
            statusCode: 200,
            data: JSON.stringify({
              code: 0,
              data: {
                url: mockUploadUrl
              }
            })
          })
          if (options.complete) {
            options.complete()
          }
        })
        return {
          onProgressUpdate: vi.fn()
        }
      })

      await wrapper.find('.upload-area').trigger('click')
      await waitForAsync()
      
      expect(mockUniApi.compressImage).not.toHaveBeenCalled()
    })
  })

  describe('图片上传', () => {
    it('应该调用后端上传接口', async () => {
      const mockTempPath = 'temp://image.jpg'
      const mockUploadUrl = 'https://example.com/uploaded.jpg'
      storageMock.getStorageSync.mockReturnValue('token-123')

      wrapper = mount(ImageUpload, {
        props: {
          modelValue: '',
          uploadUrl: '/api/v1/upload/image'
        }
      })

      // 模拟选择成功 - 修复：使用Promise确保执行顺序
      mockUniApi.chooseImage.mockImplementation((options) => {
        Promise.resolve().then(() => {
          options.success({
            tempFilePaths: [mockTempPath],
            tempFiles: [{
              path: mockTempPath,
              size: 500 * 1024
            }]
          })
        })
      })

      // 模拟上传成功 - 修复：使用Promise确保执行顺序
      mockUniApi.uploadFile.mockImplementation((options) => {
        Promise.resolve().then(() => {
          options.success({
            statusCode: 200,
            data: JSON.stringify({
              code: 0,
              data: {
                url: mockUploadUrl
              }
            })
          })
          if (options.complete) {
            options.complete()
          }
        })
        return {
          onProgressUpdate: vi.fn()
        }
      })

      await wrapper.find('.upload-area').trigger('click')
      await waitForAsync()
      
      expect(mockUniApi.showLoading).toHaveBeenCalledWith({
        title: '上传中...'
      })
      
      expect(mockUniApi.uploadFile).toHaveBeenCalledWith(expect.objectContaining({
        url: expect.stringContaining('/api/v1/upload/image'),
        filePath: mockTempPath,
        name: 'file',
        header: expect.objectContaining({
          Accept: 'application/json',
          Authorization: 'Bearer token-123'
        }),
        success: expect.any(Function),
        fail: expect.any(Function),
        complete: expect.any(Function)
      }))
    })

    it('上传成功后应该更新v-model', async () => {
      const mockTempPath = 'temp://image.jpg'
      const mockUploadUrl = 'https://example.com/uploaded.jpg'
      
      wrapper = mount(ImageUpload, {
        props: {
          modelValue: '',
          'onUpdate:modelValue': vi.fn()
        }
      })

      // 模拟选择和上传成功 - 修复：使用Promise确保执行顺序
      mockUniApi.chooseImage.mockImplementation((options) => {
        Promise.resolve().then(() => {
          options.success({
            tempFilePaths: [mockTempPath],
            tempFiles: [{
              path: mockTempPath,
              size: 500 * 1024
            }]
          })
        })
      })

      mockUniApi.uploadFile.mockImplementation((options) => {
        Promise.resolve().then(() => {
          options.success({
            statusCode: 200,
            data: JSON.stringify({
              code: 0,
              data: {
                url: mockUploadUrl
              }
            })
          })
          if (options.complete) {
            options.complete()
          }
        })
        return {
          onProgressUpdate: vi.fn()
        }
      })

      await wrapper.find('.upload-area').trigger('click')
      await waitForAsync()
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([mockUploadUrl])
      expect(wrapper.emitted('success')?.[0]).toEqual([mockUploadUrl])
    })

    it('上传失败时应该显示错误提示', async () => {
      const mockTempPath = 'temp://image.jpg'
      
      wrapper = mount(ImageUpload, {
        props: {
          modelValue: ''
        }
      })

      // 模拟选择成功 - 修复：使用Promise确保执行顺序
      mockUniApi.chooseImage.mockImplementation((options) => {
        Promise.resolve().then(() => {
          options.success({
            tempFilePaths: [mockTempPath],
            tempFiles: [{
              path: mockTempPath,
              size: 500 * 1024
            }]
          })
        })
      })

      // 模拟上传失败 - 修复：使用Promise确保执行顺序
      mockUniApi.uploadFile.mockImplementation((options) => {
        Promise.resolve().then(() => {
          options.fail({
            errMsg: '上传失败'
          })
          if (options.complete) {
            options.complete()
          }
        })
        return {
          onProgressUpdate: vi.fn()
        }
      })

      await wrapper.find('.upload-area').trigger('click')
      await waitForAsync()
      
      expect(mockUniApi.showToast).toHaveBeenCalledWith({
        title: '上传失败，请重试',
        icon: 'none'
      })
      expect(wrapper.emitted('error')).toBeTruthy()
    })
  })

  describe('上传进度', () => {
    it('应该显示上传进度', async () => {
      const mockTempPath = 'temp://image.jpg'
      
      wrapper = mount(ImageUpload, {
        props: {
          modelValue: '',
          showProgress: true
        }
      })

      // 模拟选择成功 - 修复：同步执行回调
      mockUniApi.chooseImage.mockImplementation((options) => {
        // 同步执行success回调
        options.success({
          tempFilePaths: [mockTempPath],
          tempFiles: [{
            path: mockTempPath,
            size: 500 * 1024
          }]
        })
      })

      // 模拟上传任务 - 修复：确保进度回调能被正确调用
      let progressCallback: ((res: any) => void) | null = null
      const mockUploadTask = {
        onProgressUpdate: vi.fn((callback) => {
          progressCallback = callback
          // 异步触发进度更新
          Promise.resolve().then(() => {
            callback({ progress: 50 })
          })
        })
      }

      mockUniApi.uploadFile.mockImplementation((options: any) => {
        // 异步执行回调，让组件有时间设置进度监听
        Promise.resolve().then(() => {
          // 如果有进度回调，触发它
          if (progressCallback) {
            progressCallback({ progress: 50 })
          }
        })
        // 使用options参数避免lint警告
        console.debug('Upload options:', options.url)
        return mockUploadTask
      })

      await wrapper.find('.upload-area').trigger('click')
      await waitForAsync()
      
      // 确保进度更新被处理
      await waitForAsync()
      
      expect(wrapper.find('.upload-progress').exists()).toBe(true)
      expect(wrapper.vm.uploadProgress).toBe(50)
    })
  })

  describe('图片删除', () => {
    it('应该能够删除已上传的图片', async () => {
      wrapper = mount(ImageUpload, {
        props: {
          modelValue: 'https://example.com/image.jpg',
          'onUpdate:modelValue': vi.fn(),
          deletable: true
        }
      })

      expect(wrapper.find('.delete-btn').exists()).toBe(true)
      
      await wrapper.find('.delete-btn').trigger('click')
      
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
      expect(wrapper.emitted('delete')).toBeTruthy()
    })

    it('当deletable为false时不应该显示删除按钮', () => {
      wrapper = mount(ImageUpload, {
        props: {
          modelValue: 'https://example.com/image.jpg',
          deletable: false
        }
      })

      expect(wrapper.find('.delete-btn').exists()).toBe(false)
    })
  })
})
