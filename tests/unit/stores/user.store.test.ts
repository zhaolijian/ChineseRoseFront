import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/modules/user'
import * as storage from '@/utils/storage'
import * as authAPI from '@/api/modules/auth'
import { ErrorCode } from '@/types/errorCodes'

vi.mock('@/utils/storage', () => ({
  getStorage: vi.fn(),
  setStorage: vi.fn(),
  removeStorage: vi.fn()
}))

vi.mock('@/api/modules/auth', () => ({
  wechatCodeLogin: vi.fn(),
  wechatPhoneLogin: vi.fn(),
  smsLogin: vi.fn(),
  sendSMSCode: vi.fn(),
  getUserInfo: vi.fn(),
  updateUserInfo: vi.fn(),
  logout: vi.fn()
}))

const createMockToken = (overrides: Record<string, any> = {}) => {
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
  const payload = Buffer.from(JSON.stringify({
    user_id: 1,
    exp: now + 3600,
    iat: now - 10,
    nbf: now - 10,
    ...overrides
  })).toString('base64')
  return `${header}.${payload}.signature`
}

describe('user store – 登录与会话管理', () => {
  const mockUni = {
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    showToast: vi.fn()
  }

  let store: ReturnType<typeof useUserStore>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()

    setActivePinia(createPinia())
    store = useUserStore()

    vi.mocked(storage.getStorage).mockResolvedValue(null)
    vi.mocked(storage.setStorage).mockResolvedValue()
    vi.mocked(storage.removeStorage).mockResolvedValue()

    global.uni = mockUni as any
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initUserInfo 应该从存储恢复 token 与用户信息', async () => {
    const token = createMockToken()
    const user = { id: 1, nickname: '测试用户' }

    vi.mocked(storage.getStorage)
      .mockResolvedValueOnce(token)
      .mockResolvedValueOnce(user)

    await store.initUserInfo()

    expect(store.token).toBe(token)
    expect(store.userInfo).toEqual(user)
    expect(store.isLoggedIn).toBe(true)
  })

  it('loginWithPhone 成功时应写入本地并返回 success', async () => {
    const response = {
      token: createMockToken({ user_id: 99 }),
      user: { id: 99, phone: '13800000000' }
    }
    vi.mocked(authAPI.smsLogin).mockResolvedValue(response)

    const result = await store.loginWithPhone({ phone: '13800000000', code: '123456' })

    expect(result.success).toBe(true)
    expect(store.token).toBe(response.token)
    expect(store.userInfo).toEqual(response.user)
    expect(storage.setStorage).toHaveBeenCalledWith('token', response.token)
    expect(storage.setStorage).toHaveBeenCalledWith('userInfo', response.user)
  })

  it('wechatLogin 参数不完整时应抛出业务错误', async () => {
    await expect(store.wechatLogin({ code: '', encryptedData: '', iv: '' }))
      .rejects.toMatchObject({ code: ErrorCode.ERR_INVALID_PARAMS })
  })

  it('wechatLogin 成功流程应清理 loading 并持久化用户信息', async () => {
    const apiResult = {
      token: createMockToken({ user_id: 7 }),
      user: { id: 7, phone: '13900000000' }
    }
    vi.mocked(authAPI.wechatPhoneLogin).mockResolvedValue(apiResult)

    await store.wechatLogin({ code: 'wx-code', encryptedData: 'enc', iv: 'iv' })

    expect(mockUni.showLoading).toHaveBeenCalledWith({ title: '登录中...', mask: true })
    expect(mockUni.hideLoading).toHaveBeenCalled()
    expect(store.userInfo).toEqual(apiResult.user)
    expect(storage.setStorage).toHaveBeenCalledWith('token', apiResult.token)
    expect(storage.setStorage).toHaveBeenCalledWith('userInfo', apiResult.user)
  })

  it('loginWithWeChat 应调用 wechatCodeLogin 并保存结果', async () => {
    const apiResponse = {
      token: createMockToken({ user_id: 5 }),
      user: { id: 5, nickname: '小程序用户' }
    }
    vi.mocked(authAPI.wechatCodeLogin).mockResolvedValue(apiResponse)

    const result = await store.loginWithWeChat({
      code: 'wx-code',
      userInfo: {
        nickName: 'wx',
        avatarUrl: 'url',
        gender: 1
      }
    })

    expect(result.success).toBe(true)
    expect(authAPI.wechatCodeLogin).toHaveBeenCalledWith({
      code: 'wx-code',
      nickname: 'wx',
      avatar: 'url',
      gender: 1
    })
    expect(store.token).toBe(apiResponse.token)
  })

  it('sendSMSCode 失败时应返回错误并保持状态不变', async () => {
    vi.mocked(authAPI.sendSMSCode).mockRejectedValue(new Error('network'))

    const result = await store.sendSMSCode('13800000000')

    expect(result.success).toBe(false)
    expect(mockUni.showToast).not.toHaveBeenCalled()
    expect(store.token).toBe('')
  })
})
