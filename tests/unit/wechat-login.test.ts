import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/modules/user'
import * as authAPI from '@/api/modules/auth'

// Mock API模块
vi.mock('@/api/modules/auth', () => ({
  wechatLogin: vi.fn(),
  phoneLogin: vi.fn(),
  sendSMSCode: vi.fn(),
  getUserInfo: vi.fn(),
  updateUserInfo: vi.fn(),
  logout: vi.fn()
}))

// Mock storage工具
vi.mock('@/utils/storage', () => ({
  getStorage: vi.fn(),
  setStorage: vi.fn(),
  removeStorage: vi.fn()
}))

describe('微信登录功能 - TDD测试', () => {
  let userStore: ReturnType<typeof useUserStore>
  
  beforeEach(() => {
    // 创建新的Pinia实例
    const pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    
    // 重置所有mock
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('🔴 Red阶段 - uni.login()基础调用测试', () => {
    it('应该能够成功调用 uni.login() 并获取code', async () => {
      // Mock API成功响应
      const mockLoginResponse = {
        token: 'mock_token_12345',
        user: {
          id: 1,
          nickname: '测试用户',
          phone: '13800138000',
          avatar: 'mock_avatar_url'
        }
      }
      vi.mocked(authAPI.wechatLogin).mockResolvedValue(mockLoginResponse)

      // Mock uni.login 成功响应
      const mockCode = 'mock_wx_code_12345'
      global.uni.login = vi.fn((options: any) => {
        options.success({
          code: mockCode,
          errMsg: 'login:ok'
        })
      })

      // 执行微信登录
      await userStore.wechatLogin()

      // 断言：应该调用了 uni.login
      expect(global.uni.login).toHaveBeenCalledWith({
        provider: 'weixin',
        success: expect.any(Function),
        fail: expect.any(Function)
      })
      
      // 这个断言会失败，因为我们还没有正确处理登录状态
      expect(userStore.isLoggedIn).toBe(true)
    })

    it('应该处理 uni.login() 失败的情况', async () => {
      // Mock uni.login 失败响应
      global.uni.login = vi.fn((options: any) => {
        options.fail({
          errMsg: 'login:fail auth deny'
        })
      })

      // 执行微信登录并期望抛出错误
      await expect(userStore.wechatLogin()).rejects.toThrow('uni.login失败')
      
      // 断言：用户应该仍然处于未登录状态
      expect(userStore.isLoggedIn).toBe(false)
    })

    it('应该处理获取code为空的情况', async () => {
      // Mock uni.login 返回空code
      global.uni.login = vi.fn((options: any) => {
        options.success({
          code: '',
          errMsg: 'login:ok'
        })
      })

      // 执行微信登录并期望抛出错误
      await expect(userStore.wechatLogin()).rejects.toThrow('未获取到微信登录code')
    })
  })

  describe('🔴 Red阶段 - API集成测试', () => {
    it('应该成功调用后端微信登录API', async () => {
      const { wechatLogin: apiWechatLogin } = await import('@/api/modules/auth')
      
      // Mock uni.login 成功
      const mockCode = 'mock_wx_code_12345'
      global.uni.login = vi.fn((options: any) => {
        options.success({
          code: mockCode,
          errMsg: 'login:ok'
        })
      })

      // Mock API成功响应
      const mockApiResponse = {
        token: 'mock_token_123',
        user: {
          id: 1,
          nickname: '调试用户',
          phone: '13800138000',
          avatar: 'https://example.com/avatar.jpg'
        }
      }
      
      vi.mocked(apiWechatLogin).mockResolvedValue(mockApiResponse)

      // 执行微信登录
      await userStore.wechatLogin()

      // 断言：应该调用了API
      expect(apiWechatLogin).toHaveBeenCalledWith({
        code: mockCode,
        nickname: '调试用户',
        avatar: '',
        gender: 0
      })

      // 断言：用户状态应该更新
      expect(userStore.token).toBe(mockApiResponse.token)
      expect(userStore.userInfo).toEqual(mockApiResponse.user)
      expect(userStore.isLoggedIn).toBe(true)
    })

    it('应该处理API调用失败的情况', async () => {
      const { wechatLogin: apiWechatLogin } = await import('@/api/modules/auth')
      
      // Mock uni.login 成功
      global.uni.login = vi.fn((options: any) => {
        options.success({
          code: 'mock_code',
          errMsg: 'login:ok'
        })
      })

      // Mock API失败响应
      const mockError = new Error('Network Error: Backend not available')
      vi.mocked(apiWechatLogin).mockRejectedValue(mockError)

      // 执行微信登录并期望抛出错误
      await expect(userStore.wechatLogin()).rejects.toThrow('网络连接失败')
      
      // 断言：用户状态应该保持未登录
      expect(userStore.isLoggedIn).toBe(false)
    })

    it('应该处理404错误（接口不存在）', async () => {
      const { wechatLogin: apiWechatLogin } = await import('@/api/modules/auth')
      
      // Mock uni.login 成功
      global.uni.login = vi.fn((options: any) => {
        options.success({
          code: 'mock_code',
          errMsg: 'login:ok'
        })
      })

      // Mock 404错误
      const mockError = new Error('Request failed with status 404')
      vi.mocked(apiWechatLogin).mockRejectedValue(mockError)

      // 执行微信登录并期望抛出特定错误
      await expect(userStore.wechatLogin()).rejects.toThrow('API接口未找到')
    })
  })

  describe('🔴 Red阶段 - 用户状态管理测试', () => {
    it('应该正确保存登录成功后的用户信息', async () => {
      const { setStorage } = await import('@/utils/storage')
      const { wechatLogin: apiWechatLogin } = await import('@/api/modules/auth')
      
      // Mock完整的登录流程
      global.uni.login = vi.fn((options: any) => {
        options.success({ code: 'mock_code', errMsg: 'login:ok' })
      })
      
      const mockResponse = {
        token: 'test_token',
        user: { id: 1, nickname: '测试用户', phone: '13800138000', avatar: '' }
      }
      vi.mocked(apiWechatLogin).mockResolvedValue(mockResponse)

      // 执行登录
      await userStore.wechatLogin()

      // 断言：应该保存到本地存储
      expect(setStorage).toHaveBeenCalledWith('token', mockResponse.token)
      expect(setStorage).toHaveBeenCalledWith('userInfo', mockResponse.user)
    })

    it('应该在登录失败时清除用户信息', async () => {
      // 先设置一些用户信息
      userStore.token = 'old_token'
      userStore.userInfo = { id: 1, nickname: '旧用户', phone: '', avatar: '' }

      // Mock登录失败
      global.uni.login = vi.fn((options: any) => {
        options.fail({ errMsg: 'login:fail' })
      })

      try {
        await userStore.wechatLogin()
      } catch (error) {
        // 预期的错误，忽略
      }

      // 断言：用户信息应该保持原状（不应该清除，除非明确失败）
      expect(userStore.isLoggedIn).toBe(true) // 这会失败，因为我们期望清除逻辑
    })
  })

  describe('🔴 Red阶段 - 错误处理和用户体验测试', () => {
    it('应该显示loading状态', async () => {
      // Mock uni.login 延迟响应
      global.uni.login = vi.fn((options: any) => {
        setTimeout(() => {
          options.success({ code: 'mock_code', errMsg: 'login:ok' })
        }, 100)
      })

      // 开始登录（不等待完成）
      const loginPromise = userStore.wechatLogin()

      // 立即检查loading状态
      expect(global.uni.showLoading).toHaveBeenCalledWith({ title: '登录中...' })

      // 等待登录完成
      try {
        await loginPromise
      } catch (error) {
        // API调用可能失败，但这不是我们测试的重点
      }

      // 断言：应该隐藏loading
      expect(global.uni.hideLoading).toHaveBeenCalled()
    })

    it('应该显示适当的错误提示', async () => {
      // Mock网络错误
      global.uni.login = vi.fn((options: any) => {
        options.success({ code: 'mock_code', errMsg: 'login:ok' })
      })

      const { wechatLogin: apiWechatLogin } = await import('@/api/modules/auth')
      vi.mocked(apiWechatLogin).mockRejectedValue(new Error('timeout'))

      try {
        await userStore.wechatLogin()
      } catch (error) {
        // 预期错误
      }

      // 这个断言会失败，因为我们还没有实现用户友好的错误提示
      expect(global.uni.showToast).toHaveBeenCalledWith({
        title: expect.stringContaining('网络连接失败'),
        icon: 'none'
      })
    })
  })
})

describe('🔴 Red阶段 - 登录页面组件测试', () => {
  // 这里我们将测试登录页面的微信登录按钮点击事件
  // 由于组件测试比较复杂，我们先专注于store层面的测试
  
  it('点击微信登录按钮应该触发登录流程', () => {
    // 这个测试暂时跳过，等store层面的逻辑完善后再实现
    expect(true).toBe(true) // 占位测试，防止describe为空
  })
})