import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/modules/user'
import * as storageUtils from '@/utils/storage'
import * as authAPI from '@/api/modules/auth'

// Mock依赖模块
vi.mock('@/utils/storage', () => ({
  getStorage: vi.fn(),
  setStorage: vi.fn(),
  removeStorage: vi.fn()
}))

vi.mock('@/api/modules/auth', () => ({
  wechatLogin: vi.fn(),
  phoneLogin: vi.fn(),
  sendSMSCode: vi.fn(),
  getUserInfo: vi.fn(),
  updateUserInfo: vi.fn(),
  logout: vi.fn()
}))

describe('🔴 User Store业务逻辑测试 - TDD RED阶段', () => {
  let userStore: ReturnType<typeof useUserStore>

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    vi.clearAllMocks()
  })

  describe('🔴 Token持久化业务逻辑测试', () => {
    it('应用启动时应该从Storage恢复有效的Token状态', async () => {
      // Arrange - 模拟有效的本地存储数据（使用有效的JWT格式）
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTYwOTQ1OTIwMCwibmJmIjoxNjA5NDU5MjAwfQ.test'
      const mockUserInfo = {
        id: 1,
        nickname: '测试用户',
        phone: '13800138000',
        avatar: 'https://example.com/avatar.jpg'
      }

      vi.mocked(storageUtils.getStorage)
        .mockResolvedValueOnce(mockToken)  // token
        .mockResolvedValueOnce(mockUserInfo) // userInfo

      // Act - 初始化用户信息
      await userStore.initUserInfo()

      // Assert - 应该恢复用户状态
      expect(userStore.token).toBe(mockToken)
      expect(userStore.userInfo).toEqual(mockUserInfo)
      expect(userStore.isLoggedIn).toBe(true)
    })

    it('应用启动时遇到Storage读取失败应该优雅处理', async () => {
      // Arrange - 模拟Storage读取错误
      vi.mocked(storageUtils.getStorage).mockRejectedValue(new Error('Storage access denied'))

      // Act - 初始化用户信息
      await userStore.initUserInfo()

      // Assert - 应该保持初始未登录状态
      expect(userStore.token).toBe('')
      expect(userStore.userInfo).toBe(null)
      expect(userStore.isLoggedIn).toBe(false)
    })

    it('Token过期后应该清除所有本地用户数据', async () => {
      // Arrange - 先设置用户为已登录状态
      userStore.token = 'expired_token'
      userStore.userInfo = { id: 1, nickname: '测试用户', phone: '', avatar: '' }

      // Mock API返回token过期错误
      vi.mocked(authAPI.getUserInfo).mockRejectedValue({
        code: 401,
        message: 'Token expired'
      })

      // Act - 检查登录状态（应该检测到token过期）
      const isLoggedIn = await userStore.checkLoginStatus()

      // Assert - 应该清除用户数据并返回false
      expect(isLoggedIn).toBe(false)
      expect(userStore.token).toBe('')
      expect(userStore.userInfo).toBe(null)
      expect(storageUtils.removeStorage).toHaveBeenCalledWith('token')
      expect(storageUtils.removeStorage).toHaveBeenCalledWith('userInfo')
    })

    it('微信登录成功时应该保存Token到内存和Storage', async () => {
      // Arrange
      const mockCode = 'mock_wx_code'
      const mockApiResponse = {
        token: 'new_token_12345',
        user: {
          id: 2,
          nickname: '新用户',
          phone: '13900139000',
          avatar: ''
        }
      }

      global.uni.login = vi.fn((options: any) => {
        options.success({ code: mockCode, errMsg: 'login:ok' })
      })

      vi.mocked(authAPI.wechatLogin).mockResolvedValue(mockApiResponse)

      // Act - 执行微信登录
      await userStore.wechatLogin()

      // Assert - 应该同时更新内存和Storage
      expect(userStore.token).toBe(mockApiResponse.token)
      expect(userStore.userInfo).toEqual(mockApiResponse.user)
      expect(storageUtils.setStorage).toHaveBeenCalledWith('token', mockApiResponse.token)
      expect(storageUtils.setStorage).toHaveBeenCalledWith('userInfo', mockApiResponse.user)
    })
  })

  describe('🔴 自动登录业务逻辑测试', () => {
    it('有有效Token时checkLoginStatus应该跳过登录验证', async () => {
      // Arrange - 模拟有效token存在（使用有效的JWT格式）
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTYwOTQ1OTIwMCwibmJmIjoxNjA5NDU5MjAwfQ.test'
      const mockUserInfo = { id: 1, nickname: '测试用户', phone: '', avatar: '' }

      vi.mocked(storageUtils.getStorage)
        .mockResolvedValueOnce(mockToken)
        .mockResolvedValueOnce(mockUserInfo)

      // Mock API验证成功
      vi.mocked(authAPI.getUserInfo).mockResolvedValue(mockUserInfo)

      // Act
      const isLoggedIn = await userStore.checkLoginStatus()

      // Assert - 应该验证成功且调用了API验证
      expect(isLoggedIn).toBe(true)
      expect(authAPI.getUserInfo).toHaveBeenCalled()
      expect(userStore.token).toBe(mockToken)
    })

    it('无Token时checkLoginStatus应该直接返回false', async () => {
      // Arrange - 模拟无本地token
      vi.mocked(storageUtils.getStorage)
        .mockResolvedValueOnce(null) // token为空
        .mockResolvedValueOnce(null) // userInfo为空

      // Act
      const isLoggedIn = await userStore.checkLoginStatus()

      // Assert - 应该直接返回false且不调用API
      expect(isLoggedIn).toBe(false)
      expect(authAPI.getUserInfo).not.toHaveBeenCalled()
    })

    it('网络异常时应该清除本地数据并返回false', async () => {
      // Arrange - 模拟有本地token但网络验证失败
      vi.mocked(storageUtils.getStorage)
        .mockResolvedValueOnce('local_token')
        .mockResolvedValueOnce({ id: 1, nickname: '用户', phone: '', avatar: '' })

      vi.mocked(authAPI.getUserInfo).mockRejectedValue(new Error('Network Error'))

      // Act
      const isLoggedIn = await userStore.checkLoginStatus()

      // Assert - 应该清除数据并返回false
      expect(isLoggedIn).toBe(false)
      expect(userStore.token).toBe('')
      expect(userStore.userInfo).toBe(null)
    })
  })

  describe('🔴 登录状态管理业务逻辑测试', () => {
    it('isLoggedIn计算属性应该准确反映登录状态', () => {
      // Test Case 1: 无token无userInfo = 未登录
      userStore.token = ''
      userStore.userInfo = null
      expect(userStore.isLoggedIn).toBe(false)

      // Test Case 2: 有token无userInfo = 未登录
      userStore.token = 'test_token'
      userStore.userInfo = null
      expect(userStore.isLoggedIn).toBe(false)

      // Test Case 3: 无token有userInfo = 未登录
      userStore.token = ''
      userStore.userInfo = { id: 1, nickname: '用户', phone: '', avatar: '' }
      expect(userStore.isLoggedIn).toBe(false)

      // Test Case 4: 有token有userInfo = 已登录
      userStore.token = 'test_token'
      userStore.userInfo = { id: 1, nickname: '用户', phone: '', avatar: '' }
      expect(userStore.isLoggedIn).toBe(true)
    })

    it('userNickname计算属性应该有正确的降级顺序', () => {
      // Test Case 1: 有nickname时优先使用nickname
      userStore.userInfo = {
        id: 1,
        nickname: '自定义昵称',
        phone: '13800138000',
        avatar: ''
      }
      expect(userStore.userNickname).toBe('自定义昵称')

      // Test Case 2: 无nickname时使用phone
      userStore.userInfo = {
        id: 1,
        nickname: '',
        phone: '13800138000',
        avatar: ''
      }
      expect(userStore.userNickname).toBe('13800138000')

      // Test Case 3: 都为空时使用默认值
      userStore.userInfo = {
        id: 1,
        nickname: '',
        phone: '',
        avatar: ''
      }
      expect(userStore.userNickname).toBe('用户')

      // Test Case 4: userInfo为null时使用默认值
      userStore.userInfo = null
      expect(userStore.userNickname).toBe('用户')
    })

    it('userAvatar计算属性应该有正确的默认头像', () => {
      // Test Case 1: 有头像时使用用户头像
      userStore.userInfo = {
        id: 1,
        nickname: '用户',
        phone: '',
        avatar: 'https://example.com/avatar.jpg'
      }
      expect(userStore.userAvatar).toBe('https://example.com/avatar.jpg')

      // Test Case 2: 无头像时使用默认头像
      userStore.userInfo = {
        id: 1,
        nickname: '用户',
        phone: '',
        avatar: ''
      }
      expect(userStore.userAvatar).toBe('/static/images/default-avatar.png')

      // Test Case 3: userInfo为null时使用默认头像
      userStore.userInfo = null
      expect(userStore.userAvatar).toBe('/static/images/default-avatar.png')
    })

    it('多个组件同时访问store状态应该保持一致性', async () => {
      // Arrange - 获取两个store实例（模拟不同组件）
      const store1 = useUserStore()
      const store2 = useUserStore()

      const mockApiResponse = {
        token: 'consistency_token',
        user: { id: 1, nickname: '一致性测试', phone: '', avatar: '' }
      }

      // Mock微信登录成功
      global.uni.login = vi.fn((options: any) => {
        options.success({ code: 'test_code', errMsg: 'login:ok' })
      })
      vi.mocked(authAPI.wechatLogin).mockResolvedValue(mockApiResponse)

      // Act - 通过store1执行登录
      await store1.wechatLogin()

      // Assert - store2应该立即反映状态变化
      expect(store2.token).toBe(mockApiResponse.token)
      expect(store2.userInfo).toEqual(mockApiResponse.user)
      expect(store2.isLoggedIn).toBe(true)
      expect(store1.isLoggedIn).toBe(store2.isLoggedIn)
    })
  })

  describe('🔴 登出业务逻辑测试', () => {
    it('logout应该清除所有本地状态和Storage', async () => {
      // Arrange - 先设置用户为登录状态
      userStore.token = 'test_token'
      userStore.userInfo = { id: 1, nickname: '测试用户', phone: '', avatar: '' }

      // Mock API成功
      vi.mocked(authAPI.logout).mockResolvedValue(undefined)

      // Act
      await userStore.logout()

      // Assert - 应该清除所有状态
      expect(userStore.token).toBe('')
      expect(userStore.userInfo).toBe(null)
      expect(userStore.isLoggedIn).toBe(false)
      expect(storageUtils.removeStorage).toHaveBeenCalledWith('token')
      expect(storageUtils.removeStorage).toHaveBeenCalledWith('userInfo')
      expect(authAPI.logout).toHaveBeenCalled()
    })

    it('logout即使API调用失败也应该清除本地状态', async () => {
      // Arrange
      userStore.token = 'test_token'
      userStore.userInfo = { id: 1, nickname: '测试用户', phone: '', avatar: '' }

      // Mock API失败
      vi.mocked(authAPI.logout).mockRejectedValue(new Error('Network Error'))

      // Act
      await userStore.logout()

      // Assert - 即使API失败也应该清除本地状态
      expect(userStore.token).toBe('')
      expect(userStore.userInfo).toBe(null)
      expect(storageUtils.removeStorage).toHaveBeenCalledWith('token')
      expect(storageUtils.removeStorage).toHaveBeenCalledWith('userInfo')
    })
  })

  describe('🔴 用户信息更新业务逻辑测试', () => {
    it('updateUserInfo成功时应该同步更新本地状态', async () => {
      // Arrange
      const currentUserInfo = { id: 1, nickname: '旧昵称', phone: '13800138000', avatar: '' }
      userStore.userInfo = currentUserInfo

      const updates = { nickname: '新昵称', avatar: 'new_avatar.jpg' }
      const updatedInfo = { ...currentUserInfo, ...updates }

      vi.mocked(authAPI.updateUserInfo).mockResolvedValue(updatedInfo)

      // Act
      const result = await userStore.updateUserInfo(updates)

      // Assert
      expect(result.success).toBe(true)
      expect(userStore.userInfo).toEqual(updatedInfo)
      expect(storageUtils.setStorage).toHaveBeenCalledWith('userInfo', updatedInfo)
    })

    it('updateUserInfo失败时本地状态应该保持不变', async () => {
      // Arrange
      const originalUserInfo = { id: 1, nickname: '原始昵称', phone: '', avatar: '' }
      userStore.userInfo = originalUserInfo

      vi.mocked(authAPI.updateUserInfo).mockRejectedValue(new Error('Update failed'))

      // Act
      const result = await userStore.updateUserInfo({ nickname: '新昵称' })

      // Assert - 本地状态应该保持不变
      expect(result.success).toBe(false)
      expect(userStore.userInfo).toEqual(originalUserInfo)
      expect(storageUtils.setStorage).not.toHaveBeenCalled()
    })
  })
})